"""Email/Password authentication endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime, timedelta
import secrets

from ...database import get_session
from ...models import User
from ..endpoints.auth import generate_jwt_token, UserResponse
from ...utils.password import hash_password, verify_password, validate_password_strength
from ...utils.email_service import send_verification_email

router = APIRouter(tags=["auth"])


# Request/Response models
class EmailRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str
    
    @validator('password')
    def validate_password_strength_field(cls, v):
        is_valid, error = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error)
        return v


class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    message: str = ""


@router.post("/email/register", response_model=AuthResponse)
async def register_with_email(
    request: EmailRegisterRequest,
    db: Session = Depends(get_session)
):
    """
    Register a new user with email and password
    Sends verification email to the provided email address
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    password_hash = hash_password(request.password)
    
    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    
    # Create new user
    user = User(
        name=request.name,
        email=request.email,
        phone=request.phone,
        password_hash=password_hash,
        provider="email",
        role="CLIENT",
        is_registered=True,  # Registered but email not verified
        email_verified=False,
        email_verification_token=verification_token,
        registration_completed_at=datetime.utcnow()
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send verification email
    try:
        send_verification_email(user.email, verification_token, user.name)
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        # Don't fail registration if email fails
    
    # Generate access token (user can still use app, but some features may require verification)
    access_token = generate_jwt_token(user)
    
    return AuthResponse(
        user=UserResponse.from_orm(user),
        access_token=access_token,
        message="Registration successful! Please check your email to verify your account."
    )


@router.post("/email/login", response_model=AuthResponse)
async def login_with_email(
    request: EmailLoginRequest,
    db: Session = Depends(get_session)
):
    """
    Login with email and password
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate access token
    access_token = generate_jwt_token(user)
    
    message = ""
    if not user.email_verified:
        message = "Please verify your email address to unlock all features."
    
    return AuthResponse(
        user=UserResponse.from_orm(user),
        access_token=access_token,
        message=message
    )


@router.get("/email/verify")
async def verify_email(
    token: str = Query(...),
    db: Session = Depends(get_session)
):
    """
    Verify email address using token from email link
    """
    # Find user by verification token
    user = db.query(User).filter(User.email_verification_token == token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Mark email as verified
    user.email_verified = True
    user.email_verified_at = datetime.utcnow()
    user.email_verification_token = None  # Clear token after use
    
    db.commit()
    
    return {
        "message": "Email verified successfully! You can now close this page and return to the app."
    }


@router.post("/email/resend-verification")
async def resend_verification_email(
    email: EmailStr,
    db: Session = Depends(get_session)
):
    """
    Resend verification email
    """
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If the email exists, a verification link has been sent."}
    
    if user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Generate new verification token
    verification_token = secrets.token_urlsafe(32)
    user.email_verification_token = verification_token
    db.commit()
    
    # Send verification email
    try:
        send_verification_email(user.email, verification_token, user.name)
    except Exception as e:
        print(f"Failed to send verification email: {e}")
    
    return {"message": "If the email exists, a verification link has been sent."}
