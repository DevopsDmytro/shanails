from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from ...database import get_session
from ...models import Service

router = APIRouter()


@router.get("/")
async def get_services(session: Session = Depends(get_session)):
    services = session.execute(select(Service).where(Service.is_active == True)).scalars().all()
    return services


@router.get("/{service_id}")
async def get_service(service_id: int, session: Session = Depends(get_session)):
    service = session.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service