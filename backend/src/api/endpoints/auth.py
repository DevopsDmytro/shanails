"""
Authentication endpoints for Telegram WebApp
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
import jwt
import os

from ...database import get_session
from ...models import User
from ...utils.telegram import validate_telegram_web_app_data
from ...utils.validators import validate_ukrainian_phone, validate_name


router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"


# Pydantic models
class TelegramInitRequest(BaseModel):
    init_data: str


class RegisterRequest(BaseModel):
    name: str
    phone: str
    
    @validator('name')
    def validate_name_field(cls, v):
        is_valid, cleaned = validate_name(v)
        if not is_valid:
            raise ValueError('Invalid name format. Must be 2-50 characters.')
        return cleaned
    
    @validator('phone')
    def validate_phone_field(cls, v):
        is_valid, normalized = validate_ukrainian_phone(v)
        if not is_valid:
            raise ValueError('Invalid Ukrainian phone number. Use format: +380XXXXXXXXX')
        return normalized


class UserResponse(BaseModel):
    id: int
    telegram_id: Optional[int]
    name: str
    phone: Optional[str]
    role: str
    is_registered: bool
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    user: UserResponse
    token: Optional[str] = None
    needs_registration: bool


@router.post("/telegram/init", response_model=AuthResponse)
async def telegram_init(
    request: TelegramInitRequest,
    db: Session = Depends(get_session)
):
    """
    Initialize Telegram WebApp authentication
    
    Validates Telegram WebApp initData and creates/updates user
    Returns user status and whether registration is needed
    """
    # Validate Telegram data
    print(f"DEBUG: Received init_data: {request.init_data}")
    is_valid, user_data = validate_telegram_web_app_data(request.init_data)
    print(f"DEBUG: Validation result: {is_valid}, User data: {user_data}")
    
    if not is_valid or not user_data:
        print("DEBUG: Validation failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication data"
        )
    
    telegram_id = user_data.get('id')
    print(f"DEBUG: Telegram ID: {telegram_id}")
    if not telegram_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram user ID not found"
        )
    
    # Find or create user
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    print(f"DEBUG: User found in DB: {user}")
    
    if not user:
        # Create new user with Telegram data
        print("DEBUG: Creating new user")
        user = User(
            telegram_id=telegram_id,
            name=user_data.get('first_name', '') + ' ' + user_data.get('last_name', '').strip(),
            role="CLIENT",
            is_registered=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"DEBUG: New user created: {user.id}")
    
    # Check if user needs to complete registration
    needs_registration = not user.is_registered or not user.phone
    print(f"DEBUG: Needs registration: {needs_registration} (is_registered={user.is_registered}, phone={user.phone})")
    
    # Generate token if user is fully registered
    token = None
    if not needs_registration:
        token = generate_jwt_token(user)
        print("DEBUG: Token generated")
    
    return AuthResponse(
        user=UserResponse.from_orm(user),
        token=token,
        needs_registration=needs_registration
    )


@router.post("/register", response_model=AuthResponse)
async def register(
    request: RegisterRequest,
    telegram_id: int,
    db: Session = Depends(get_session)
):
    """
    Complete user registration with name and phone
    
    Requires telegram_id to identify the user
    Updates user with validated name and phone number
    """
    # Find user by telegram_id
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please authenticate with Telegram first."
        )
    
    # Check if already registered
    if user.is_registered:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already registered"
        )
    
    # Update user data
    user.name = request.name
    user.phone = request.phone
    user.is_registered = True
    user.registration_completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    # Generate JWT token
    token = generate_jwt_token(user)
    
    return AuthResponse(
        user=UserResponse.from_orm(user),
        token=token,
        needs_registration=False
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    authorization: str,
    db: Session = Depends(get_session)
):
    """
    Get current authenticated user
    
    Requires Authorization header with JWT token
    """
    if not authorization.startswith('Bearer '):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    token = authorization.split('Bearer ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse.from_orm(user)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


def generate_jwt_token(user: User) -> str:
    """
    Generate JWT token for authenticated user
    
    Args:
        user: User model instance
    
    Returns:
        str: JWT token
    """
    payload = {
        'user_id': user.id,
        'telegram_id': user.telegram_id,
        'role': user.role,
        'exp': datetime.utcnow().timestamp() + 86400  # 24 hours
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
