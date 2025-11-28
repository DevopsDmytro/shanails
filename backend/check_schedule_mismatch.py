import sys
import os
from datetime import date, datetime, timedelta
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.models import Master, Schedule, TimeSlot, ScheduleOverride, TimeSlotOverride, Appointment

# Setup DB connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://shanails_user:sh4n41ls2024@db:5432/shanails_db")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

CHECK_DATE = date(2025, 12, 1)  # Monday
print(f"Checking ALL Masters for Date {CHECK_DATE} (Monday)...")

masters = session.query(Master).all()

for master in masters:
    print(f"\n=== Master {master.id}: {master.user.name if master.user else 'Unknown'} ===")
    
    # 1. Simulate Weekly Schedule Logic (Admin View)
    print("--- Admin Weekly Schedule View (Day 1) ---")
    day_schedule = session.query(Schedule).filter(
        Schedule.master_id == master.id,
        Schedule.day_of_week == 1  # Monday
    ).first()

    admin_slots = []
    if day_schedule:
        time_slots = session.query(TimeSlot).filter(
            TimeSlot.schedule_id == day_schedule.id
        ).order_by(TimeSlot.start_time).all()
        
        for ts in time_slots:
            if ts.is_enabled:
                admin_slots.append(ts.start_time)
        print(f"Admin Slots: {admin_slots}")
    else:
        print("No weekly schedule found for Monday!")

    # 2. Simulate Availability Logic (Booking View)
    print("--- Booking Availability View ---")
    # Get day of week (1=Monday, 7=Sunday)
    day_of_week = CHECK_DATE.isoweekday()
    
    # Check override
    override = session.query(ScheduleOverride).filter(
        ScheduleOverride.master_id == master.id,
        ScheduleOverride.specific_date == CHECK_DATE
    ).first()

    booking_slots = []

    if override:
        print("Found Override!")
        if override.is_day_off:
            print("Override is DAY OFF")
        else:
            # Get override time slots
            time_slot_overrides = session.query(TimeSlotOverride).filter(
                TimeSlotOverride.schedule_override_id == override.id,
                TimeSlotOverride.is_enabled == True
            ).all()
            for slot in time_slot_overrides:
                 booking_slots.append(slot.start_time)
    else:
        # Use weekly schedule
        schedule = session.query(Schedule).filter(
            Schedule.master_id == master.id,
            Schedule.day_of_week == day_of_week,
            Schedule.is_available == True
        ).first()
        
        if schedule:
            # Get time slots for this schedule
            time_slots = session.query(TimeSlot).filter(
                TimeSlot.schedule_id == schedule.id,
                TimeSlot.is_enabled == True
            ).all()
            
            for slot in time_slots:
                slot_start_time = datetime.strptime(slot.start_time, "%H:%M").time()
                slot_start_datetime = datetime.combine(CHECK_DATE, slot_start_time)
                slot_end_datetime = slot_start_datetime + timedelta(minutes=slot.duration_minutes)
                
                # Check if slot conflicts with existing appointments
                conflicting_appointments = session.query(Appointment).filter(
                    Appointment.master_id == master.id,
                    Appointment.start_time < slot_end_datetime,
                    Appointment.end_time > slot_start_datetime,
                    Appointment.status.in_(["SCHEDULED", "CONFIRMED"])
                ).all()
                
                if not conflicting_appointments:
                    booking_slots.append(slot.start_time)
                else:
                    print(f"  [BLOCKED] {slot.start_time} due to appointment")

    print(f"Booking Slots: {sorted(booking_slots)}")
    
    if sorted(admin_slots) != sorted(booking_slots):
        print("❌ MISMATCH DETECTED!")
    else:
        print("✅ Match")
