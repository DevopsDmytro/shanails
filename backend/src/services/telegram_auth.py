"""
Telegram WebApp Authentication Service

Validates Telegram WebApp initData and manages JWT token generation.
"""
import hashlib
import hmac
import json
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import parse_qsl

from jose import JWTError, jwt
from fastapi import HTTPException, status

from ..database import SessionLocal
from ..models import User


# Configuration (should be moved to config.py in production)
SECRET_KEY = "your-secret-key-change-in-production"  # TODO: Move to environment
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 60  # 60 days


def validate_init_data(init_data: str, bot_token: str) -> dict:
    """
    Validate Telegram WebApp initData using HMAC-SHA256.
    
    Args:
        init_data: The initData string from Telegram WebApp
        bot_token: Telegram bot token for signature verification
        
    Returns:
        dict: Parsed and validated user data from initData
        
    Raises:
        HTTPException: If validation fails
    """
    try:
        # Parse the init_data query string
        parsed_data = dict(parse_qsl(init_data))
        
        # Extract hash
        received_hash = parsed_data.pop('hash', None)
        if not received_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing hash in initData"
            )
        
        # Create data check string
        data_check_arr = [f"{k}={v}" for k, v in sorted(parsed_data.items())]
        data_check_string = '\n'.join(data_check_arr)
        
        # Calculate secret key
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=bot_token.encode(),
            digestmod=hashlib.sha256
        ).digest()
        
        # Calculate hash
        calculated_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        # Compare hashes
        if calculated_hash != received_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid initData signature"
            )
        
        # Parse user data
        user_data = json.loads(parsed_data.get('user', '{}'))
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing user data in initData"
            )
        
        return user_data
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user data format"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"initData validation error: {str(e)}"
        )


def get_or_create_user(telegram_id: int, user_data: dict) -> User:
    """
    Find existing user by telegram_id or create a new one.
    
    Args:
        telegram_id: Telegram user ID
        user_data: User data from Telegram (first_name, last_name, username)
        
    Returns:
        User: The found or created user object
    """
    db = SessionLocal()
    try:
        # Try to find existing user
        user = db.query(User).filter(User.telegram_id == telegram_id).first()
        
        if user:
            # Update user data if needed
            if user_data.get('first_name') or user_data.get('last_name'):
                name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
                if name and user.name != name:
                    user.name = name
                    db.commit()
                    db.refresh(user)
            return user
        
        # Create new user
        name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
        new_user = User(
            telegram_id=telegram_id,
            name=name or "Telegram User",
            role="CLIENT"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
        
    finally:
        db.close()


def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token for authenticated user.
    
    Args:
        user_id: User ID to encode in token
        expires_delta: Optional custom expiration time
        
    Returns:
        str: JWT access token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access"
    }
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[int]:
    """
    Verify JWT token and extract user ID.
    
    Args:
        token: JWT access token
        
    Returns:
        Optional[int]: User ID if token is valid, None otherwise
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return int(user_id)
    except JWTError:
        return None
