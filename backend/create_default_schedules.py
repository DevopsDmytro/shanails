"""
Create default schedules for all masters
Mon-Fri: 10:00-22:00 (6 slots)
Sat-Sun: 10:00-16:00 (3 slots)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.models import Master, Schedule, TimeSlot

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://shanails_user:sh4n41ls2024@db:5432/shanails_db")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def create_default_schedule_for_master(master_id: int, session):
    """Create default schedule for a master using Schedule→TimeSlot structure"""
    
    # First, clear existing schedules to ensure clean state
    existing_schedules = session.query(Schedule).filter(Schedule.master_id == master_id).all()
    for schedule in existing_schedules:
        session.delete(schedule)
    session.flush()
    
    # Days: 1=Monday, 2=Tuesday, ..., 5=Friday, 6=Saturday, 7=Sunday
    days_config = [
        (1, "Monday", "10:00", "22:00", [("10:00", 120), ("12:00", 120), ("14:00", 120), ("16:00", 120), ("18:00", 120), ("20:00", 120)]),
        (2, "Tuesday", "10:00", "22:00", [("10:00", 120), ("12:00", 120), ("14:00", 120), ("16:00", 120), ("18:00", 120), ("20:00", 120)]),
        (3, "Wednesday", "10:00", "22:00", [("10:00", 120), ("12:00", 120), ("14:00", 120), ("16:00", 120), ("18:00", 120), ("20:00", 120)]),
        (4, "Thursday", "10:00", "22:00", [("10:00", 120), ("12:00", 120), ("14:00", 120), ("16:00", 120), ("18:00", 120), ("20:00", 120)]),
        (5, "Friday", "10:00", "22:00", [("10:00", 120), ("12:00", 120), ("14:00", 120), ("16:00", 120), ("18:00", 120), ("20:00", 120)]),
        (6, "Saturday", "10:00", "16:00", [("10:00", 120), ("12:00", 120), ("14:00", 120)]),
        (7, "Sunday", "10:00", "16:00", [("10:00", 120), ("12:00", 120), ("14:00", 120)]),
    ]
    
    for day_num, day_name, start, end, slots in days_config:
        schedule = Schedule(
            master_id=master_id,
            day_of_week=day_num,
            start_time=start,
            end_time=end,
            is_available=True,
            is_break=False,
            note=f"Default {day_name} schedule"
        )
        session.add(schedule)
        session.flush()  # Get the schedule.id
        
        # Add time slots
        for start_time, duration in slots:
            time_slot = TimeSlot(
                schedule_id=schedule.id,
                start_time=start_time,
                duration_minutes=duration,
                is_enabled=True,
                slot_type='work'
            )
            session.add(time_slot)
    
    print(f"✅ Created default schedule for master {master_id}")

def main():
    session = Session()
    
    try:
        # Get all masters
        masters = session.query(Master).all()
        
        if not masters:
            print("❌ No masters found in database")
            return
        
        print(f"Found {len(masters)} masters")
        created_count = 0
        
        for master in masters:
            # Check if master has time slots
            # We check if ANY time slots exist for this master's schedules
            has_slots = session.query(TimeSlot).join(Schedule).filter(
                Schedule.master_id == master.id
            ).first()
            
            if has_slots:
                print(f"⏭️  Master {master.id} already has time slots, skipping...")
                continue
            
            print(f"Creating default schedule for master {master.id}...")
            # Create default schedule (will clear empty schedules first)
            create_default_schedule_for_master(master.id, session)
            created_count += 1
        
        session.commit()
        print(f"\n✅ Successfully created default schedules for {created_count} masters!")
        print("📅 Mon-Fri: 10:00-22:00 (6 slots of 2 hours each)")
        print("📅 Sat-Sun: 10:00-16:00 (3 slots of 2 hours each)")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    main()
