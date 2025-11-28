
import os
import sys
import argparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.models import User

def delete_user(telegram_id=None, user_id=None):
    # Get database URL from environment
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/shanails")
    
    # Create engine and session
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    
    try:
        user = None
        if telegram_id:
            user = session.query(User).filter(User.telegram_id == telegram_id).first()
        elif user_id:
            user = session.query(User).filter(User.id == user_id).first()
            
        if not user:
            print(f"❌ User not found!")
            return False
        
        print(f"Found user: ID={user.id}, Name={user.name}, Telegram ID={user.telegram_id}")
        
        # Delete user
        session.delete(user)
        session.commit()
        print(f"✅ User deleted successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        session.rollback()
        return False
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Delete a user from the database')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--telegram-id', type=int, help='Telegram ID of the user to delete')
    group.add_argument('--id', type=int, help='Database ID of the user to delete')
    
    args = parser.parse_args()
    
    delete_user(telegram_id=args.telegram_id, user_id=args.id)
