"""Create time slot tables for master schedule system"""
import os
import sys

# Get database URL from environment or use Docker default
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@db:5432/shanails')

from sqlalchemy import create_engine, text

def migrate():
    """Create new tables for time slot-based scheduling"""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        trans = conn.begin()
        
        try:
            print("Creating time slot tables...")
            
            # TimeSlot table - individual time slots for weekly schedule
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS time_slot (
                    id SERIAL PRIMARY KEY,
                    schedule_id INTEGER REFERENCES schedule(id) ON DELETE CASCADE,
                    start_time VARCHAR(5) NOT NULL,
                    duration_minutes INTEGER NOT NULL DEFAULT 30,
                    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                    slot_type VARCHAR(10) NOT NULL DEFAULT 'work',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT valid_slot_type CHECK (slot_type IN ('work', 'break'))
                );
            """))
            print("✓ Created time_slot table")
            
            # ScheduleOverride table - override specific dates
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS schedule_override (
                    id SERIAL PRIMARY KEY,
                    master_id INTEGER REFERENCES master(id) ON DELETE CASCADE,
                    specific_date DATE NOT NULL,
                    is_day_off BOOLEAN NOT NULL DEFAULT FALSE,
                    note VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(master_id, specific_date)
                );
            """))
            print("✓ Created schedule_override table")
            
            # TimeSlotOverride table - time slot overrides for specific dates
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS time_slot_override (
                    id SERIAL PRIMARY KEY,
                    schedule_override_id INTEGER REFERENCES schedule_override(id) ON DELETE CASCADE,
                    start_time VARCHAR(5) NOT NULL,
                    duration_minutes INTEGER NOT NULL DEFAULT 30,
                    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                    slot_type VARCHAR(10) NOT NULL DEFAULT 'work',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT valid_override_slot_type CHECK (slot_type IN ('work', 'break'))
                );
            """))
            print("✓ Created time_slot_override table")
            
            # Create indexes for better performance
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_time_slot_schedule 
                ON time_slot(schedule_id);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_schedule_override_master_date 
                ON schedule_override(master_id, specific_date);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_time_slot_override_schedule 
                ON time_slot_override(schedule_override_id);
            """))
            print("✓ Created indexes")
            
            trans.commit()
            print("\n✅ Migration completed successfully!")
            
        except Exception as e:
            trans.rollback()
            print(f"\n❌ Migration failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    migrate()
