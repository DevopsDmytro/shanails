from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import date, datetime, time, timedelta
from typing import List
import calendar

from ...database import get_session
from ...models import Master, Schedule, Appointment, User

router = APIRouter()


@router.get("/")
async def get_masters(session: Session = Depends(get_session)):
    masters = session.execute(
        select(Master, User.name)
        .join(User, Master.user_id == User.id)
        .where(Master.is_active == True)
    ).all()
    
    # Format the response to include master name
    result = []
    for master, user_name in masters:
        result.append({
            "id": master.id,
            "user_id": master.user_id,
            "name": user_name,
            "is_active": master.is_active,
            "created_at": master.created_at.isoformat() if master.created_at else None
        })
    
    return result


@router.get("/{master_id}")
async def get_master(master_id: int, session: Session = Depends(get_session)):
    master = session.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    return master


@router.get("/{master_id}/availability")
async def get_master_availability(
    master_id: int,
    date: date = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    session: Session = Depends(get_session)
):
    # Check if master exists
    master = session.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    # Get master's schedule for the day of week
    day_of_week = date.weekday() + 1  # Convert to 1-7 (Monday-Sunday)
    schedule = session.query(Schedule).filter(
        Schedule.master_id == master_id,
        Schedule.day_of_week == day_of_week,
        Schedule.is_available == True
    ).first()
    
    if not schedule:
        return {"date": date.isoformat(), "available_slots": []}
    
    # Parse schedule times
    start_time = datetime.strptime(schedule.start_time, "%H:%M").time()
    end_time = datetime.strptime(schedule.end_time, "%H:%M").time()
    
    # Generate 2-hour slots from 10:00 to 20:00
    available_slots = []
    current_time = time(10, 0)  # Start at 10:00
    end_of_day = time(20, 0)    # End at 20:00
    
    while current_time <= end_of_day:
        slot_start = current_time
        slot_end = (datetime.combine(date, current_time) + timedelta(hours=2)).time()
        
        # Check if slot is within master's schedule
        if slot_start >= start_time and slot_end <= end_time:
            # Check if slot conflicts with existing appointments
            slot_start_datetime = datetime.combine(date, slot_start)
            slot_end_datetime = datetime.combine(date, slot_end)
            
            conflicting_appointments = session.query(Appointment).filter(
                Appointment.master_id == master_id,
                Appointment.start_time < slot_end_datetime,
                Appointment.end_time > slot_start_datetime,
                Appointment.status.in_(["SCHEDULED", "CONFIRMED"])
            ).all()
            
            if not conflicting_appointments:
                available_slots.append(slot_start.strftime("%H:%M"))
        
        # Move to next 2-hour slot
        current_time = (datetime.combine(date, current_time) + timedelta(hours=2)).time()
    
    return {
        "date": date.isoformat(),
        "available_slots": available_slots,
        "master": master
    }


@router.get("/{master_id}/availability-month")
async def get_master_monthly_availability(
    master_id: int,
    month: str = Query(..., description="Month to check availability (YYYY-MM)"),
    session: Session = Depends(get_session)
):
    # Check if master exists
    master = session.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    # Parse month (YYYY-MM)
    try:
        year, month_num = map(int, month.split('-'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    
    # Get all days in the month
    _, num_days = calendar.monthrange(year, month_num)
    
    available_dates = []
    
    # Check each day of the month
    for day in range(1, num_days + 1):
        check_date = date(year, month_num, day)
        
        # Skip past dates
        if check_date < date.today():
            continue
        
        # Get master's schedule for this day of week
        day_of_week = check_date.weekday() + 1  # Convert to 1-7 (Monday-Sunday)
        schedule = session.query(Schedule).filter(
            Schedule.master_id == master_id,
            Schedule.day_of_week == day_of_week,
            Schedule.is_available == True
        ).first()
        
        if not schedule:
            continue
        
        # Parse schedule times
        start_time = datetime.strptime(schedule.start_time, "%H:%M").time()
        end_time = datetime.strptime(schedule.end_time, "%H:%M").time()
        
        # Check if there's at least one available 2-hour slot
        has_available_slot = False
        current_time = time(10, 0)  # Start at 10:00
        end_of_day = time(20, 0)    # End at 20:00
        
        while current_time <= end_of_day:
            slot_start = current_time
            slot_end = (datetime.combine(check_date, current_time) + timedelta(hours=2)).time()
            
            # Check if slot is within master's schedule
            if slot_start >= start_time and slot_end <= end_time:
                # Check if slot conflicts with existing appointments
                slot_start_datetime = datetime.combine(check_date, slot_start)
                slot_end_datetime = datetime.combine(check_date, slot_end)
                
                conflicting_appointments = session.query(Appointment).filter(
                    Appointment.master_id == master_id,
                    Appointment.start_time < slot_end_datetime,
                    Appointment.end_time > slot_start_datetime,
                    Appointment.status.in_(["SCHEDULED", "CONFIRMED"])
                ).all()
                
                if not conflicting_appointments:
                    has_available_slot = True
                    break
            
            # Move to next 2-hour slot
            current_time = (datetime.combine(check_date, current_time) + timedelta(hours=2)).time()
        
        if has_available_slot:
            available_dates.append(check_date.isoformat())
    
    return {
        "month": month,
        "available_dates": available_dates
    }