#!/usr/bin/env python3
"""
Script to migrate appointments from user_id=1 to the correct user

This is useful for fixing appointments created before the auth fix was applied.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def migrate_appointments(from_user_id: int, to_user_id: int):
    """Migrate appointments from one user to another"""
    
    # Get database URL from environment
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/shanails")
    
    # Create engine and session
    engine = create_engine(DATABASE_URL, echo=True)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Count appointments to migrate
        count_query = text("SELECT COUNT(*) FROM appointment WHERE user_id = :from_id")
        count = session.execute(count_query, {"from_id": from_user_id}).scalar()
        
        print(f"\n📋 Found {count} appointments with user_id={from_user_id}")
        
        if count == 0:
            print("✅ No appointments to migrate!")
            return True
        
        # Confirm migration
        response = input(f"\n⚠️  Migrate {count} appointments to user_id={to_user_id}? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Migration cancelled")
            return False
        
        # Perform migration
        update_query = text("UPDATE appointment SET user_id = :to_id WHERE user_id = :from_id")
        result = session.execute(update_query, {"to_id": to_user_id, "from_id": from_user_id})
        session.commit()
        
        print(f"\n✅ Successfully migrated {result.rowcount} appointments!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        session.rollback()
        return False
    finally:
        session.close()


if __name__ == "__main__":
    print("="*60)
    print("   APPOINTMENT MIGRATION TOOL")
    print("="*60)
    
    # Default: migrate from user_id=1 to user_id=6 (your account)
    FROM_USER = 1
    TO_USER = 6  # Your telegram_id: 1656854173
    
    if len(sys.argv) > 2:
        FROM_USER = int(sys.argv[1])
        TO_USER = int(sys.argv[2])
    
    print(f"\nMigrating from user_id={FROM_USER} to user_id={TO_USER}")
    
    success = migrate_appointments(FROM_USER, TO_USER)
    sys.exit(0 if success else 1)
