"""Enhanced schedule management with time slots and overrides"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

from src.database import get_session
from src.models import Master, Schedule, TimeSlot, ScheduleOverride, TimeSlotOverride
from src.api.endpoints.auth import get_current_user, User

router = APIRouter(tags=["admin-schedule"])


# Request/Response models
class TimeSlotRequest(BaseModel):
    start_time: str  # "10:00"
    duration_minutes: int = 30
    is_enabled: bool = True
    slot_type: str = "work"  # 'work' or 'break'


class TimeSlotResponse(BaseModel):
    id: int
    start_time: str
    duration_minutes: int
    is_enabled: bool
    slot_type: str
    
    class Config:
        from_attributes = True


class WeeklyScheduleRequest(BaseModel):
    day_of_week: int  # 1-7
    time_slots: List[TimeSlotRequest]


class DayScheduleResponse(BaseModel):
    day_of_week: int
    is_available: bool
    time_slots: List[TimeSlotResponse]


class OverrideRequest(BaseModel):
    specific_date: date
    is_day_off: bool = False
    note: Optional[str] = None
    time_slots: Optional[List[TimeSlotRequest]] = None


class OverrideResponse(BaseModel):
    id: int
    specific_date: date
    is_day_off: bool
    note: Optional[str]
    time_slots: List[TimeSlotResponse]
    
    class Config:
        from_attributes = True


# Weekly schedule endpoints
@router.get("/masters/{master_id}/schedule/weekly")
async def get_weekly_schedule(
    master_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get weekly schedule with time slots for a master"""
    master = db.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    # Get all schedules for this master
    schedules = db.query(Schedule).filter(Schedule.master_id == master_id).all()
    
    weekly_schedule = []
    for day in range(1, 8):  # Monday=1 to Sunday=7
        day_schedule = next((s for s in schedules if s.day_of_week == day), None)
        
        if day_schedule:
            time_slots = db.query(TimeSlot).filter(
                TimeSlot.schedule_id == day_schedule.id
            ).order_by(TimeSlot.start_time).all()
            
            weekly_schedule.append({
                "day_of_week": day,
                "is_available": day_schedule.is_available,
                "schedule_id": day_schedule.id,
                "time_slots": [TimeSlotResponse.from_orm(ts) for ts in time_slots]
            })
        else:
            weekly_schedule.append({
                "day_of_week": day,
                "is_available": False,
                "schedule_id": None,
                "time_slots": []
            })
    
    return {"weekly_schedule": weekly_schedule}


@router.put("/masters/{master_id}/schedule/weekly/{day_of_week}")
async def update_day_schedule(
    master_id: int,
    day_of_week: int,
    request: WeeklyScheduleRequest,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update time slots for a specific day of the week"""
    if not (1 <= day_of_week <= 7):
        raise HTTPException(status_code=400, detail="day_of_week must be 1-7")
    
    master = db.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    # Find or create schedule for this day
    schedule = db.query(Schedule).filter(
        Schedule.master_id == master_id,
        Schedule.day_of_week == day_of_week
    ).first()
    
    if not schedule:
        schedule = Schedule(
            master_id=master_id,
            day_of_week=day_of_week,
            start_time="00:00",  # Placeholder
            end_time="23:59",    # Placeholder
            is_available=True
        )
        db.add(schedule)
        db.flush()
    
    # Delete existing time slots
    db.query(TimeSlot).filter(TimeSlot.schedule_id == schedule.id).delete()
    
    # Create new time slots
    for slot_data in request.time_slots:
        time_slot = TimeSlot(
            schedule_id=schedule.id,
            start_time=slot_data.start_time,
            duration_minutes=slot_data.duration_minutes,
            is_enabled=slot_data.is_enabled,
            slot_type=slot_data.slot_type
        )
        db.add(time_slot)
    
    # Update schedule availability
    schedule.is_available = len(request.time_slots) > 0
    
    db.commit()
    
    return {"message": "Schedule updated successfully"}


# Calendar override endpoints
@router.get("/masters/{master_id}/schedule/overrides")
async def get_schedule_overrides(
    master_id: int,
    month: Optional[str] = None,  # "2025-12"
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get schedule overrides for a master, optionally filtered by month"""
    master = db.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    query = db.query(ScheduleOverride).filter(ScheduleOverride.master_id == master_id)
    
    if month:
        try:
            year, month_num = map(int, month.split('-'))
            start_date = date(year, month_num, 1)
            if month_num == 12:
                end_date = date(year + 1, 1, 1)
            else:
                end_date = date(year, month_num + 1, 1)
            
            query = query.filter(
                ScheduleOverride.specific_date >= start_date,
                ScheduleOverride.specific_date < end_date
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    
    overrides = query.order_by(ScheduleOverride.specific_date).all()
    
    result = []
    for override in overrides:
        time_slots = db.query(TimeSlotOverride).filter(
            TimeSlotOverride.schedule_override_id == override.id
        ).order_by(TimeSlotOverride.start_time).all()
        
        result.append({
            "id": override.id,
            "specific_date": override.specific_date.isoformat(),
            "is_day_off": override.is_day_off,
            "note": override.note,
            "time_slots": [TimeSlotResponse.from_orm(ts) for ts in time_slots]
        })
    
    return {"overrides": result}


@router.post("/masters/{master_id}/schedule/overrides")
async def create_schedule_override(
    master_id: int,
    request: OverrideRequest,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create or update a schedule override for a specific date"""
    master = db.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    # Check if override already exists
    existing = db.query(ScheduleOverride).filter(
        ScheduleOverride.master_id == master_id,
        ScheduleOverride.specific_date == request.specific_date
    ).first()
    
    if existing:
        # Update existing
        existing.is_day_off = request.is_day_off
        existing.note = request.note
        
        # Delete old time slots
        db.query(TimeSlotOverride).filter(
            TimeSlotOverride.schedule_override_id == existing.id
        ).delete()
        
        override = existing
    else:
        # Create new
        override = ScheduleOverride(
            master_id=master_id,
            specific_date=request.specific_date,
            is_day_off=request.is_day_off,
            note=request.note
        )
        db.add(override)
        db.flush()
    
    # Add time slots if provided and not a day off
    if not request.is_day_off and request.time_slots:
        for slot_data in request.time_slots:
            time_slot = TimeSlotOverride(
                schedule_override_id=override.id,
                start_time=slot_data.start_time,
                duration_minutes=slot_data.duration_minutes,
                is_enabled=slot_data.is_enabled,
                slot_type=slot_data.slot_type
            )
            db.add(time_slot)
    
    db.commit()
    
    return {"message": "Override created successfully", "override_id": override.id}


@router.delete("/masters/{master_id}/schedule/overrides/{override_date}")
async def delete_schedule_override(
    master_id: int,
    override_date: date,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a schedule override"""
    override = db.query(ScheduleOverride).filter(
        ScheduleOverride.master_id == master_id,
        ScheduleOverride.specific_date == override_date
    ).first()
    
    if not override:
        raise HTTPException(status_code=404, detail="Override not found")
    
    db.delete(override)
    db.commit()
    
    return {"message": "Override deleted successfully"}
