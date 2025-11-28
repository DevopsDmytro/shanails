#!/usr/bin/env python3
"""
Script to promote a user to ADMIN role
Usage: python promote_to_admin.py
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.models import User

def promote_user_to_admin(telegram_id: int):
    """Promote a user with the given telegram_id to ADMIN role"""
    
    # Get database URL from environment
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://salon:password@localhost:5432/salon_db")
    
    # Create engine and session
    engine = create_engine(DATABASE_URL, echo=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    
    try:
        # Find user by telegram_id
        user = session.query(User).filter(User.telegram_id == telegram_id).first()
        
        if not user:
            print(f"❌ User with telegram_id {telegram_id} not found!")
            return False
        
        # Check current role
        print(f"\n📋 User found:")
        print(f"   ID: {user.id}")
        print(f"   Name: {user.name}")
        print(f"   Telegram ID: {user.telegram_id}")
        print(f"   Current Role: {user.role}")
        
        if user.role == "ADMIN":
            print(f"\n✅ User is already an ADMIN!")
            return True
        
        # Update role to ADMIN
        user.role = "ADMIN"
        session.commit()
        
        print(f"\n✅ Successfully promoted {user.name} to ADMIN role!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        session.rollback()
        return False
    finally:
        session.close()


if __name__ == "__main__":
    TELEGRAM_ID = 1656854173  # Your telegram ID
    
    print("="*60)
    print("   PROMOTE USER TO ADMIN")
    print("="*60)
    print(f"\nTelegram ID: {TELEGRAM_ID}")
    
    success = promote_user_to_admin(TELEGRAM_ID)
    
    if success:
        print("\n" + "="*60)
        print("   ✅ PROMOTION SUCCESSFUL!")
        print("="*60)
        print("\nYou can now access the admin panel at /admin")
    else:
        print("\n" + "="*60)
        print("   ❌ PROMOTION FAILED!")
        print("="*60)
        print("\nPlease check the error message above")
    
    sys.exit(0 if success else 1)
