from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from typing import List
from datetime import datetime, timedelta
from pydantic import BaseModel

from ...database import get_session
from ...models import Appointment, User, Service, appointment_service
from .auth import get_current_user

router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class AppointmentUpdate(BaseModel):
    start_time: datetime


# ============================================================================
# Business Logic Functions
# ============================================================================

def can_cancel_appointment(user: User, appointment: Appointment) -> dict:
    """Check if user can cancel appointment"""
    # Check if appointment is in the past
    if appointment.start_time < datetime.now():
        return {
            "allowed": False,
            "reason": "Неможливо скасувати минулий запис"
        }
    
    # Check yearly limit (3 cancellations/year)
    if user.cancellations_this_year >= 3:
        return {
            "allowed": False,
            "reason": "Ви досягли ліміту скасувань (3 на рік). Зателефонуйте адміністратору."
        }
    
    return {"allowed": True, "reason": None}


def can_reschedule_appointment(user: User, appointment: Appointment) -> dict:
    """Check if user can reschedule appointment"""
    # Check if appointment is in the past
    if appointment.start_time < datetime.now():
        return {
            "allowed": False,
            "reason": "Неможливо змінити час минулого запису"
        }
    
    # Check 2-month cooldown
    if user.last_time_slot_change:
        days_since = (datetime.now() - user.last_time_slot_change).days
        if days_since < 60:  # 2 months
            days_remaining = 60 - days_since
            return {
                "allowed": False,
                "reason": f"Можна змінити час через {days_remaining} днів. Зателефонуйте адміністратору."
            }
    
    return {"allowed": True, "reason": None}


# ============================================================================
# Public Endpoints
# ============================================================================

@router.get("/")
async def get_appointments(session: Session = Depends(get_session)):
    appointments = session.execute(select(Appointment)).scalars().all()
    return appointments


@router.post("/")
async def create_appointment(
    appointment_data: dict,
    session: Session = Depends(get_session)
):
    try:
        # Extract data from request
        user_id = appointment_data.get("user_id", 1)  # Default user for now
        master_id = appointment_data["master_id"]
        service_ids = appointment_data["service_ids"]
        start_time_str = appointment_data["start_time"]
        
        # Parse start time
        start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
        
        # Get services to calculate total duration and price
        services = session.query(Service).filter(Service.id.in_(service_ids)).all()
        if not services:
            raise HTTPException(status_code=400, detail="No valid services found")
        
        # Calculate total duration and price
        total_duration = sum(service.duration for service in services)
        total_price = sum(service.price for service in services)
        
        # Calculate end time
        end_time = start_time + timedelta(minutes=total_duration)
        
        # Create appointment
        appointment = Appointment(
            user_id=user_id,
            master_id=master_id,
            start_time=start_time,
            end_time=end_time,
            total_price=total_price,
            status="SCHEDULED"
        )
        
        session.add(appointment)
        session.commit()
        session.refresh(appointment)
        
        # Add services to appointment
        for service in services:
            session.execute(
                appointment_service.insert().values(
                    appointment_id=appointment.id,
                    service_id=service.id
                )
            )
        
        session.commit()
        
        return {
            "id": appointment.id,
            "message": "Appointment created successfully",
            "start_time": appointment.start_time.isoformat(),
            "end_time": appointment.end_time.isoformat(),
            "total_price": appointment.total_price,
            "services": [{"id": s.id, "name": s.name} for s in services]
        }
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Client Endpoints (Authenticated)
# ============================================================================

@router.get("/my")
async def get_my_appointments(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current user's appointments"""
    appointments = session.query(Appointment).filter(
        Appointment.user_id == current_user.id
    ).order_by(Appointment.start_time.desc()).all()
    
    return {
        "appointments": [
            {
                "id": a.id,
                "master": {"id": a.master.id, "name": a.master.user.name},
                "services": [{"id": s.id, "name": s.name, "price": s.price} for s in a.services],
                "start_time": a.start_time,
                "end_time": a.end_time,
                "status": a.status,
                "total_price": a.total_price,
                "created_at": a.created_at
            }
            for a in appointments
        ]
    }


@router.get("/{appointment_id}/can-cancel")
async def check_can_cancel(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Check if user can cancel appointment"""
    appointment = session.query(Appointment).filter(
        and_(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id
        )
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return can_cancel_appointment(current_user, appointment)


@router.get("/{appointment_id}/can-reschedule")
async def check_can_reschedule(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Check if user can reschedule appointment"""
    appointment = session.query(Appointment).filter(
        and_(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id
        )
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return can_reschedule_appointment(current_user, appointment)


@router.patch("/{appointment_id}")
async def update_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Reschedule appointment"""
    appointment = session.query(Appointment).filter(
        and_(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id
        )
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check if reschedule is allowed
    can_reschedule = can_reschedule_appointment(current_user, appointment)
    if not can_reschedule["allowed"]:
        raise HTTPException(status_code=403, detail=can_reschedule["reason"])
    
    # Calculate new end time based on service duration
    total_duration = sum(service.duration for service in appointment.services)
    new_end_time = appointment_update.start_time + timedelta(minutes=total_duration)
    
    # Update appointment
    appointment.start_time = appointment_update.start_time
    appointment.end_time = new_end_time
    
    # Update user's last change timestamp
    current_user.last_time_slot_change = datetime.now()
    
    session.commit()
    
    return {"message": "Appointment rescheduled successfully", "appointment": appointment}


@router.delete("/{appointment_id}")
async def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Cancel appointment"""
    appointment = session.query(Appointment).filter(
        and_(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id
        )
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check if cancellation is allowed
    can_cancel = can_cancel_appointment(current_user, appointment)
    if not can_cancel["allowed"]:
        raise HTTPException(status_code=403, detail=can_cancel["reason"])
    
    # Update appointment status
    appointment.status = "CANCELLED"
    
    # Increment user's cancellation count
    current_user.cancellations_this_year += 1
    
    session.commit()
    
    return {
        "message": "Appointment cancelled successfully",
        "remaining_cancellations": 3 - current_user.cancellations_this_year
    }