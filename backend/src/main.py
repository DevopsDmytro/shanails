from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, create_db_and_tables
from .api.endpoints import masters, services, appointments, auth, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    create_db_and_tables()
    yield


app = FastAPI(
    title="Salon Booking API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)  # Auth router already has prefix="/api/v1/auth" defined
app.include_router(masters.router, prefix="/api/v1/masters", tags=["masters"])
app.include_router(services.router, prefix="/api/v1/services", tags=["services"])
app.include_router(appointments.router, prefix="/api/v1/appointments", tags=["appointments"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/")
async def root():
    return {"message": "Salon Booking API"}