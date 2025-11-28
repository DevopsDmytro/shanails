"""
Telegram Account Linking Token System

Provides secure, time-limited tokens for linking Telegram accounts to web accounts.
Tokens expire after 5 minutes and are single-use.
"""
import secrets
import time
from datetime import datetime, timedelta
from typing import Optional

from ..database import SessionLocal
from ..models import LinkingToken


def generate_linking_token(telegram_id: int, expires_in: int = 1800) -> str:
    """
    Generate a unique linking token for a Telegram user.
    
    Args:
        telegram_id: Telegram user ID to associate with token
        expires_in: Token validity duration in seconds (default: 30 minutes)
    
    Returns:
        str: Secure random token
    """
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
    
    db = SessionLocal()
    try:
        # Create new token record
        db_token = LinkingToken(
            token=token,
            telegram_id=telegram_id,
            expires_at=expires_at
        )
        db.add(db_token)
        db.commit()
        return token
    finally:
        db.close()


def verify_linking_token(token: str) -> Optional[int]:
    """
    Verify a linking token and return the associated Telegram ID.
    Token is consumed (deleted) upon successful verification.
    
    Args:
        token: Token to verify
    
    Returns:
        Optional[int]: Telegram ID if token valid, None otherwise
    """
    db = SessionLocal()
    try:
        # Find token
        db_token = db.query(LinkingToken).filter(LinkingToken.token == token).first()
        
        if not db_token:
            return None
        
        # Check if expired
        if db_token.expires_at < datetime.utcnow():
            db.delete(db_token)
            db.commit()
            return None
        
        telegram_id = db_token.telegram_id
        
        # Consume token (single-use)
        db.delete(db_token)
        db.commit()
        
        return telegram_id
    finally:
        db.close()


def cleanup_expired_tokens() -> int:
    """
    Remove all expired tokens from the database.
    
    Returns:
        int: Number of tokens removed
    """
    db = SessionLocal()
    try:
        expired_tokens = db.query(LinkingToken).filter(LinkingToken.expires_at < datetime.utcnow()).all()
        count = len(expired_tokens)
        
        for token in expired_tokens:
            db.delete(token)
        
        db.commit()
        return count
    finally:
        db.close()


def get_active_token_count() -> int:
    """
    Get the number of active tokens in the database.
    
    Returns:
        int: Number of unexpired tokens
    """
    db = SessionLocal()
    try:
        return db.query(LinkingToken).filter(LinkingToken.expires_at > datetime.utcnow()).count()
    finally:
        db.close()
