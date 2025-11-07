from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://salon:password@localhost:5432/salon_db")

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_db_and_tables():
    Base.metadata.create_all(bind=engine)


def get_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()