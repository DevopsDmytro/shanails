"""Add email/password authentication columns to user table"""
import os
import sys

# Get database URL from environment or use Docker default
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@db:5432/shanails')

from sqlalchemy import create_engine, text

def migrate():
    """Add new columns for email/password authentication"""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        
        try:
            print("Adding email/password authentication columns...")
            
            # Add email_verified_at column
            conn.execute(text("""
                ALTER TABLE "user" 
                ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
            """))
            print("✓ Added email_verified_at column")
            
            # Add email_verification_token column
            conn.execute(text("""
                ALTER TABLE "user" 
                ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR;
            """))
            print("✓ Added email_verification_token column")
            
            # Add password_hash column
            conn.execute(text("""
                ALTER TABLE "user" 
                ADD COLUMN IF NOT EXISTS password_hash VARCHAR;
            """))
            print("✓ Added password_hash column")
            
            # Update provider column to support 'email'
            # No schema change needed, just documentation
            
            # Commit transaction
            trans.commit()
            print("\n✅ Migration completed successfully!")
            
        except Exception as e:
            trans.rollback()
            print(f"\n❌ Migration failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    migrate()
