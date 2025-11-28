
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.models import User

def list_users():
    # Get database URL from environment
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/shanails")
    
    # Create engine and session
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    
    try:
        users = session.query(User).all()
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"ID: {user.id}, Name: {user.name}, Phone: {user.phone}, Telegram ID: {user.telegram_id}, Role: {user.role}, Provider: {user.provider}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    list_users()
