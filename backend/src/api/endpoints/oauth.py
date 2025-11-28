"""OAuth authentication endpoints for Google and Apple Sign-In"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
from datetime import datetime, timedelta
from jose import jwt

from ...database import get_session
from ...models import User

router = APIRouter(tags=["auth"])

# OAuth request/response models
class GoogleAuthRequest(BaseModel):
    id_token: str
    telegram_id: int | None = None

class AppleAuthRequest(BaseModel):
    id_token: str
    telegram_id: int | None = None
    
class TelegramLinkRequest(BaseModel):
    telegram_id: int
    email: str  # Email to link to

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")

def create_access_token(user_id: int) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(days=60)
    to_encode = {
        "sub": str(user_id),
        "exp": expire
    }
    return jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")

@router.post("/google", response_model=AuthResponse)
async def authenticate_with_google(
    request: GoogleAuthRequest,
    db: Session = Depends(get_session)
):
    """
    Authenticate user with Google ID token
    Creates new user if doesn't exist, or returns existing user
    Optionally links Telegram ID if provided
    """
    try:
        # Verify Google ID token
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        if not google_client_id:
            raise HTTPException(
                status_code=500,
                detail="Google OAuth not configured"
            )
        
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            request.id_token,
            google_requests.Request(),
            google_client_id
        )
        
        # Extract user info
        google_id = idinfo['sub']
        email = idinfo.get('email')
        name = idinfo.get('name', email)
        email_verified = idinfo.get('email_verified', False)
        
        # Check if user exists by provider_id or email
        user = db.query(User).filter(
            (User.provider == "google") & (User.provider_id == google_id)
        ).first()
        
        if not user and email:
            # Check by email (for linking existing accounts)
            user = db.query(User).filter(User.email == email).first()
            if user:
                # Link Google to existing account
                user.provider = "google"
                user.provider_id = google_id
                user.email_verified = email_verified
                db.commit()
                db.refresh(user)
        
        if not user:
            # Create new user
            user = User(
                name=name,
                email=email,
                email_verified=email_verified,
                provider="google",
                provider_id=google_id,
                role="CLIENT",
                is_registered=False,  # Not fully registered until phone is added
                registration_completed_at=None
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        # Link Telegram ID if provided and not already linked
        if request.telegram_id:
            # Check if this telegram_id is already used by another user
            existing_telegram_user = db.query(User).filter(User.telegram_id == request.telegram_id).first()
            
            if existing_telegram_user and existing_telegram_user.id != user.id:
                # If the other user is a temporary/unregistered one, we delete it to allow linking
                if not existing_telegram_user.is_registered:
                    print(f"DEBUG: Deleting temporary user {existing_telegram_user.id} to link Telegram ID {request.telegram_id} to Google user {user.id}")
                    db.delete(existing_telegram_user)
                    db.commit()
                    
                    # Now we can link
                    user.telegram_id = request.telegram_id
                    db.commit()
                    db.refresh(user)
                else:
                    # Conflict with a registered user - cannot auto-merge safely
                    print(f"WARNING: Telegram ID {request.telegram_id} already linked to registered user {existing_telegram_user.id}")
            elif not user.telegram_id:
                 user.telegram_id = request.telegram_id
                 db.commit()
                 db.refresh(user)
        
        # Create access token
        access_token = create_access_token(user.id)
        
        return AuthResponse(
            access_token=access_token,
            user={
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "provider": user.provider,
                "phone": user.phone,
                "is_registered": user.is_registered,
                "telegram_id": user.telegram_id
            }
        )
        
    except ValueError as e:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.post("/link-telegram")
async def link_telegram_to_account(
    request: TelegramLinkRequest,
    db: Session = Depends(get_session)
):
    """
    Link Telegram ID to existing account (by email)
    Used when Telegram user opens WebApp but already has Google/Apple account
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User with this email not found"
        )
    
    # Check if telegram_id already used
    existing = db.query(User).filter(User.telegram_id == request.telegram_id).first()
    if existing and existing.id != user.id:
        raise HTTPException(
            status_code=400,
            detail="This Telegram account is already linked to another user"
        )
    
    # Link Telegram ID
    user.telegram_id = request.telegram_id
    db.commit()
    
    return {"message": "Telegram account linked successfully"}

# Apple Sign-In will be similar to Google
# TODO: Implement Apple OAuth verification
@router.post("/apple", response_model=AuthResponse)
async def authenticate_with_apple(
    request: AppleAuthRequest,
    db: Session = Depends(get_session)
):
    """
    Authenticate user with Apple ID token
    TODO: Implement Apple token verification
    """
    raise HTTPException(
        status_code=501,
        detail="Apple Sign-In not yet implemented"
    )
