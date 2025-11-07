from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from datetime import datetime

from ...database import get_session
from ...models import Appointment, User, Service, appointment_service

router = APIRouter()


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
        from datetime import timedelta
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