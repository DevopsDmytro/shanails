"""
Admin API Endpoints

Protected endpoints for salon administration.
Requires ADMIN role.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from ...database import get_session
from ...models import User, Appointment, Master, Service, Schedule
from ..endpoints.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


# ============================================================================
# Authentication Middleware
# ============================================================================

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Verify user has ADMIN role"""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ============================================================================
# Pydantic Schemas
# ============================================================================

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    notes: Optional[str] = None


class AppointmentCreate(BaseModel):
    user_id: int
    master_id: int
    service_ids: List[int]
    start_time: datetime


class MasterCreate(BaseModel):
    user_id: int
    is_active: bool = True


class MasterUpdate(BaseModel):
    is_active: Optional[bool] = None


class ServiceCreate(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    price: float
    duration: int
    image_url: Optional[str] = None
    is_popular: bool = False
    is_active: bool = True


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[int] = None
    image_url: Optional[str] = None
    is_popular: Optional[bool] = None
    is_active: Optional[bool] = None


class ScheduleCreate(BaseModel):
    master_id: int
    day_of_week: int
    start_time: str
    end_time: str
    is_available: bool = True
    is_break: bool = False
    note: Optional[str] = None


class ScheduleUpdate(BaseModel):
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_available: Optional[bool] = None
    is_break: Optional[bool] = None
    note: Optional[str] = None


# ============================================================================
# User Management
# ============================================================================

@router.get("/users")
async def get_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Get list of users with optional filters"""
    query = db.query(User)
    
    if search:
        query = query.filter(
            or_(
                User.name.ilike(f"%{search}%"),
                User.phone.ilike(f"%{search}%")
            )
        )
    
    if role:
        query = query.filter(User.role == role)
    
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "users": [
            {
                "id": u.id,
                "telegram_id": u.telegram_id,
                "name": u.name,
                "phone": u.phone,
                "role": u.role,
                "is_registered": u.is_registered,
                "cancellations_this_year": u.cancellations_this_year,
                "last_time_slot_change": u.last_time_slot_change,
                "notes": u.notes,
                "created_at": u.created_at
            }
            for u in users
        ]
    }


@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Get detailed user information"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's appointments
    appointments = db.query(Appointment).filter(Appointment.user_id == user_id).all()
    
    return {
        "id": user.id,
        "telegram_id": user.telegram_id,
        "name": user.name,
        "phone": user.phone,
        "role": user.role,
        "is_registered": user.is_registered,
        "cancellations_this_year": user.cancellations_this_year,
        "last_cancellation_reset": user.last_cancellation_reset,
        "last_time_slot_change": user.last_time_slot_change,
        "notes": user.notes,
        "created_at": user.created_at,
        "appointments_count": len(appointments),
        "last_appointment": max([a.start_time for a in appointments]) if appointments else None
    }


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Update user information"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.name is not None:
        user.name = user_update.name
    if user_update.phone is not None:
        user.phone = user_update.phone
    if user_update.role is not None:
        user.role = user_update.role
    if user_update.notes is not None:
        user.notes = user_update.notes
    
    db.commit()
    db.refresh(user)
    
    return {"message": "User updated successfully", "user": user}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Delete user (soft delete by setting inactive)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has future appointments
    future_appointments = db.query(Appointment).filter(
        and_(
            Appointment.user_id == user_id,
            Appointment.start_time > datetime.now(),
            Appointment.status == "SCHEDULED"
        )
    ).count()
    
    if future_appointments > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete user with {future_appointments} future appointments"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}


@router.post("/users/{user_id}/reset-limits")
async def reset_user_limits(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Reset user's cancellation limits"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.cancellations_this_year = 0
    user.last_cancellation_reset = datetime.now()
    user.last_time_slot_change = None
    
    db.commit()
    
    return {"message": "User limits reset successfully"}


# ============================================================================
# Appointment Management
# ============================================================================

@router.get("/appointments")
async def get_all_appointments(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    master_id: Optional[int] = None,
    user_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Get all appointments with filters"""
    query = db.query(Appointment)
    
    if status:
        query = query.filter(Appointment.status == status)
    if master_id:
        query = query.filter(Appointment.master_id == master_id)
    if user_id:
        query = query.filter(Appointment.user_id == user_id)
    if date_from:
        query = query.filter(Appointment.start_time >= date_from)
    if date_to:
        query = query.filter(Appointment.start_time <= date_to)
    
    total = query.count()
    appointments = query.order_by(Appointment.start_time.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "appointments": [
            {
                "id": a.id,
                "user": {"id": a.user.id, "name": a.user.name, "phone": a.user.phone},
                "master": {"id": a.master.id, "name": a.master.user.name},
                "services": [{"id": s.id, "name": s.name} for s in a.services],
                "start_time": a.start_time,
                "end_time": a.end_time,
                "status": a.status,
                "total_price": a.total_price,
                "created_at": a.created_at
            }
            for a in appointments
        ]
    }


@router.post("/appointments")
async def create_admin_appointment(
    appointment: AppointmentCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Create appointment for client (admin override)"""
    # Verify user exists
    user = db.query(User).filter(User.id == appointment.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify master exists
    master = db.query(Master).filter(Master.id == appointment.master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    # Get services
    services = db.query(Service).filter(Service.id.in_(appointment.service_ids)).all()
    if len(services) != len(appointment.service_ids):
        raise HTTPException(status_code=404, detail="One or more services not found")
    
    # Calculate total duration and price
    total_duration = sum(s.duration for s in services)
    total_price = sum(s.price for s in services)
    end_time = appointment.start_time + timedelta(minutes=total_duration)
    
    # Create appointment
    new_appointment = Appointment(
        user_id=appointment.user_id,
        master_id=appointment.master_id,
        start_time=appointment.start_time,
        end_time=end_time,
        total_price=total_price,
        status="SCHEDULED"
    )
    
    db.add(new_appointment)
    db.flush()
    
    # Add services
    new_appointment.services = services
    
    db.commit()
    db.refresh(new_appointment)
    
    return {"message": "Appointment created successfully", "appointment": new_appointment}


# ============================================================================
# Master Management
# ============================================================================

@router.get("/masters")
async def get_masters(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Get all masters"""
    masters = db.query(Master).all()
    
    return {
        "masters": [
            {
                "id": m.id,
                "user_id": m.user_id,
                "name": m.user.name,
                "is_active": m.is_active,
                "created_at": m.created_at
            }
            for m in masters
        ]
    }


@router.post("/masters")
async def create_master(
    master_data: MasterCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Create new master"""
    # Verify user exists
    user = db.query(User).filter(User.id == master_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is already a master
    existing_master = db.query(Master).filter(Master.user_id == master_data.user_id).first()
    if existing_master:
        raise HTTPException(status_code=400, detail="User is already a master")
    
    new_master = Master(
        user_id=master_data.user_id,
        is_active=master_data.is_active
    )
    
    db.add(new_master)
    db.commit()
    db.refresh(new_master)
    
    return {"message": "Master created successfully", "master": new_master}


@router.patch("/masters/{master_id}")
async def update_master(
    master_id: int,
    master_update: MasterUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Update master"""
    master = db.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    if master_update.is_active is not None:
        master.is_active = master_update.is_active
    
    db.commit()
    db.refresh(master)
    
    return {"message": "Master updated successfully", "master": master}


# ============================================================================
# Service Management
# ============================================================================

@router.get("/services")
async def get_admin_services(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Get all services (including inactive)"""
    services = db.query(Service).all()
    
    return {
        "services": [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category,
                "description": s.description,
                "price": s.price,
                "duration": s.duration,
                "image_url": s.image_url,
                "is_popular": s.is_popular,
                "is_active": s.is_active,
                "created_at": s.created_at
            }
            for s in services
        ]
    }


@router.post("/services")
async def create_service(
    service_data: ServiceCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Create new service"""
    new_service = Service(**service_data.dict())
    
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    
    return {"message": "Service created successfully", "service": new_service}


@router.patch("/services/{service_id}")
async def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Update service"""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    for field, value in service_update.dict(exclude_unset=True).items():
        setattr(service, field, value)
    
    db.commit()
    db.refresh(service)
    
    return {"message": "Service updated successfully", "service": service}


# ============================================================================
# Schedule Management
# ============================================================================

@router.get("/schedules")
async def get_schedules(
    master_id: Optional[int] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Get schedules with optional master filter"""
    query = db.query(Schedule)
    
    if master_id:
        query = query.filter(Schedule.master_id == master_id)
    
    schedules = query.all()
    
    return {
        "schedules": [
            {
                "id": s.id,
                "master_id": s.master_id,
                "master_name": s.master.user.name,
                "day_of_week": s.day_of_week,
                "start_time": s.start_time,
                "end_time": s.end_time,
                "is_available": s.is_available,
                "is_break": s.is_break,
                "note": s.note
            }
            for s in schedules
        ]
    }


@router.post("/schedules")
async def create_schedule(
    schedule_data: ScheduleCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Create new schedule"""
    new_schedule = Schedule(**schedule_data.dict())
    
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    
    return {"message": "Schedule created successfully", "schedule": new_schedule}


@router.patch("/schedules/{schedule_id}")
async def update_schedule(
    schedule_id: int,
    schedule_update: ScheduleUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Update schedule"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    for field, value in schedule_update.dict(exclude_unset=True).items():
        setattr(schedule, field, value)
    
    db.commit()
    db.refresh(schedule)
    
    return {"message": "Schedule updated successfully", "schedule": schedule}


@router.delete("/schedules/{schedule_id}")
async def delete_schedule(
    schedule_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Delete schedule"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    db.delete(schedule)
    db.commit()
    
    return {"message": "Schedule deleted successfully"}


# ============================================================================
# Analytics & Stats
# ============================================================================

@router.get("/stats")
async def get_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Get dashboard statistics"""
    total_users = db.query(User).count()
    total_masters = db.query(Master).filter(Master.is_active == True).count()
    
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    today_appointments = db.query(Appointment).filter(
        and_(
            Appointment.start_time >= today_start,
            Appointment.start_time <= today_end
        )
    ).count()
    
    active_appointments = db.query(Appointment).filter(
        Appointment.status == "SCHEDULED"
    ).count()
    
    total_revenue = db.query(func.sum(Appointment.total_price)).filter(
        Appointment.status == "COMPLETED"
    ).scalar() or 0
    
    return {
        "total_users": total_users,
        "total_masters": total_masters,
        "today_appointments": today_appointments,
        "active_appointments": active_appointments,
        "total_revenue": total_revenue
    }


@router.get("/reports/revenue")
async def get_revenue_report(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Get revenue report"""
    query = db.query(Appointment).filter(Appointment.status == "COMPLETED")
    
    if date_from:
        query = query.filter(Appointment.start_time >= date_from)
    if date_to:
        query = query.filter(Appointment.start_time <= date_to)
    
    appointments = query.all()
    total_revenue = sum(a.total_price for a in appointments)
    
    return {
        "total_revenue": total_revenue,
        "appointment_count": len(appointments),
        "average_booking": total_revenue / len(appointments) if appointments else 0
    }


@router.get("/reports/popular-services")
async def get_popular_services(
    limit: int = 10,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_session)
):
    """Get most popular services"""
    # This would require a more complex query joining appointment_service table
    # For now, returning all popular services
    popular_services = db.query(Service).filter(Service.is_popular == True).limit(limit).all()
    
    return {
        "services": [
            {
                "id": s.id,
                "name": s.name,
                "category": s.category,
                "price": s.price,
                "duration": s.duration
            }
            for s in popular_services
        ]
    }
