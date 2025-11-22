from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Time, Table
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

# Association table for many-to-many relationship between appointments and services
appointment_service = Table(
    'appointment_service',
    Base.metadata,
    Column('appointment_id', Integer, ForeignKey('appointment.id'), primary_key=True),
    Column('service_id', Integer, ForeignKey('service.id'), primary_key=True)
)


class User(Base):
    __tablename__ = 'user'
    
    id = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, unique=True, nullable=True)
    name = Column(String, index=True)
    phone = Column(String, nullable=True)
    role = Column(String, default="CLIENT")  # 'CLIENT' or 'ADMIN'
    is_registered = Column(Boolean, default=False)  # Track registration completion
    registration_completed_at = Column(DateTime, nullable=True)  # When registration was completed
    
    # Cancellation tracking
    cancellations_this_year = Column(Integer, default=0)
    last_cancellation_reset = Column(DateTime, nullable=True)
    
    # Change tracking
    last_time_slot_change = Column(DateTime, nullable=True)
    
    # Admin notes
    notes = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    master = relationship("Master", back_populates="user", uselist=False)
    appointments = relationship("Appointment", back_populates="user")


class Master(Base):
    __tablename__ = 'master'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="master")
    schedules = relationship("Schedule", back_populates="master")
    appointments = relationship("Appointment", back_populates="master")


class Service(Base):
    __tablename__ = 'service'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    description = Column(String, nullable=True)  # Service description
    price = Column(Float, nullable=False)
    duration = Column(Integer, nullable=False)  # in minutes
    image_url = Column(String, nullable=True)  # Service image
    is_popular = Column(Boolean, default=False)  # Highlight popular services
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    appointments = relationship("Appointment", secondary=appointment_service, back_populates="services")


class Schedule(Base):
    __tablename__ = 'schedule'
    
    id = Column(Integer, primary_key=True)
    master_id = Column(Integer, ForeignKey('master.id'))
    day_of_week = Column(Integer, nullable=False)  # 1=Monday, 7=Sunday
    start_time = Column(String, nullable=False)  # "10:00"
    end_time = Column(String, nullable=False)    # "20:00"
    is_available = Column(Boolean, default=True)
    is_break = Column(Boolean, default=False)  # Mark as break time
    note = Column(String, nullable=True)  # Schedule note
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    master = relationship("Master", back_populates="schedules")


class Appointment(Base):
    __tablename__ = 'appointment'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'))
    master_id = Column(Integer, ForeignKey('master.id'))
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String, default="SCHEDULED")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="appointments")
    master = relationship("Master", back_populates="appointments")
    services = relationship("Service", secondary=appointment_service, back_populates="appointments")