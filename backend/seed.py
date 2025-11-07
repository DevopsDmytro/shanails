#!/usr/bin/env python3

import sys
import os
from datetime import datetime

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.models import User, Master, Service, Schedule, Appointment
from src.database import create_db_and_tables

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://salon:password@localhost:5432/salon_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_sample_data():
    # Create tables first
    create_db_and_tables()
    
    session = SessionLocal()
    try:
        # Create admin user
        admin_user = User(
            name="Admin User",
            role="ADMIN",
            phone="+380501234567"
        )
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)
        
        # Sample data for masters and services
        MASTERS_DATA = ["Анна", "Віка", "Женя", "Ілона"]

        SERVICES_DATA = {
            "💅 Манікюр": [
                {"name": "Комплекс (зняття, манікюр, покриття)", "price": 800, "duration": 120},
                {"name": "Комплекс + Френч", "price": 900, "duration": 150},
                {"name": "Манікюр + Гель-Лак", "price": 750, "duration": 90},
                {"name": "Манікюр Комбінований", "price": 400, "duration": 60},
                {"name": "Зняття + Покриття", "price": 350, "duration": 45},
                {"name": "Ремонт нігтя", "price": 100, "duration": 30},
                {"name": "Мініатюра", "price": 500, "duration": 120},
                {"name": "Френч манікюр", "price": 600, "duration": 90},
            ],
            "💪 Нарощення": [
                {"name": "Нарощення 1 довжина", "price": 950, "duration": 180},
                {"name": "Нарощення 2 довжина", "price": 1050, "duration": 210},
                {"name": "Нарощення 3 довжина", "price": 1150, "duration": 240},
                {"name": "Зняття нарощення", "price": 300, "duration": 60},
                {"name": "Корекція нарощення", "price": 200, "duration": 45},
                {"name": "Нарощення + дизайн", "price": 1250, "duration": 240},
            ],
            "👣 Педикюр": [
                {"name": "Педикюр комплекс", "price": 850, "duration": 150},
                {"name": "Педикюр класичний", "price": 600, "duration": 90},
                {"name": "Покриття гель-лаком", "price": 400, "duration": 60},
                {"name": "Зняття старого покриття", "price": 200, "duration": 30},
                {"name": "Педикюр + масаж", "price": 950, "duration": 180},
                {"name": "SPA-педикюр", "price": 1100, "duration": 210},
            ],
        }

        # Create master users
        master_users = []
        for i, master_name in enumerate(MASTERS_DATA):
            master_user = User(
                name=master_name,
                role="CLIENT",  # Masters are also users with CLIENT role
                phone=f"+38050123456{i+1}"
            )
            master_users.append(master_user)
        
        session.add_all(master_users)
        session.commit()
        
        # Refresh to get IDs
        for user in master_users:
            session.refresh(user)
        
        # Create masters
        masters = []
        for user in master_users:
            master = Master(
                user_id=user.id,
                is_active=True
            )
            masters.append(master)
        
        session.add_all(masters)
        session.commit()
        
        # Refresh to get master IDs
        for master in masters:
            session.refresh(master)
        
        # Create services from the structured data
        services = []
        service_id = 1
        for category, service_list in SERVICES_DATA.items():
            for service_data in service_list:
                service = Service(
                    name=service_data["name"],
                    price=float(service_data["price"]),
                    duration=service_data["duration"],
                    category=category,
                    is_active=True
                )
                services.append(service)
                service_id += 1
        
        session.add_all(services)
        session.commit()
        session.add_all(services)
        session.commit()
        
        # Create schedules for all masters (Monday-Friday 9:00-18:00, Saturday 10:00-15:00)
        all_schedules = []
        for i, master in enumerate(masters):
            # Monday-Friday schedule
            for day_of_week in range(1, 6):  # 1=Monday, 5=Friday
                schedule = Schedule(
                    master_id=master.id,
                    day_of_week=day_of_week,
                    start_time="09:00",
                    end_time="18:00",
                    is_available=True
                )
                all_schedules.append(schedule)
            
            # Saturday schedule
            schedule_saturday = Schedule(
                master_id=master.id,
                day_of_week=6,  # Saturday
                start_time="10:00",
                end_time="15:00",
                is_available=True
            )
            all_schedules.append(schedule_saturday)
        
        session.add_all(all_schedules)
        session.commit()
        
        print("✅ Sample data created successfully!")
        print(f"👤 Admin user: {admin_user.name} (ID: {admin_user.id})")
        print(f"💇 Masters created: {len(masters)}")
        print(f"💅 Services created: {len(services)}")
        print(f"📅 Schedules created: {len(all_schedules)}")
    finally:
        session.close()


if __name__ == "__main__":
    create_sample_data()