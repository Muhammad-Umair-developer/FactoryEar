# backend/app/models/machine.py
import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Float, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

# Define a strict Python Enum for machine types to prevent database insertion errors.
# Inheriting from str allows these Enums to serialize easily to JSON in FastAPI responses.
class MachineType(str, enum.Enum):
    PUMP = "pump"
    FAN = "fan"
    VALVE = "valve"
    SLIDE_RAIL = "slide_rail"
    METAL_CUTTER = "metal_cutter"
    CNC_GRINDER = "cnc_grinder"

# Define a strict Python Enum representing the operational lifecycle of the machine.
class MachineStatus(str, enum.Enum):
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    DECOMMISSIONED = "decommissioned"

# Define the SQLAlchemy ORM model representing the 'machines' table.
class Machine(Base):
    # Explicitly set the table name as it will be constructed in PostgreSQL.
    __tablename__ = "machines"

    # Primary Key: UUID for secure, distributed identity generation (avoids guessable sequential IDs).
    # default=uuid.uuid4 ensures a unique ID is automatically generated upon row creation.
    machine_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Unique human-readable code for the machine on the factory floor (e.g., "PMP-001").
    # index=True optimizes database read speeds when searching by this code.
    # unique=True enforces that no two machines can share the same code.
    machine_code = Column(String, unique=True, index=True, nullable=False)
    
    # Machine category, mapped and constrained by the MachineType Enum defined above.
    machine_type = Column(Enum(MachineType), nullable=False)
    
    # Defines the acoustic noise environment (e.g., "-6dB", "0dB", "6dB", "mixed").
    snr_profile = Column(String, nullable=True)
    
    # Stores the physical location or zone of the machine within the factory.
    location_bay = Column(String, nullable=True)
    
    # Baseline acoustic metric: the normal spectral centroid frequency (Hz) for healthy operation.
    baseline_centroid_hz = Column(Float, nullable=True)
    
    # Baseline acoustic metric: the normal Root Mean Square energy (decibels) for healthy operation.
    baseline_rms_db = Column(Float, nullable=True)
    
    # Current operational status, mapped to the MachineStatus Enum.
    # default=MachineStatus.ACTIVE automatically marks new additions as active.
    status = Column(Enum(MachineStatus), default=MachineStatus.ACTIVE, nullable=False)
    
    # Timestamp recording exactly when this machine profile was added to the system database.
    # default=datetime.utcnow triggers automatically to capture the exact server insertion time.
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)