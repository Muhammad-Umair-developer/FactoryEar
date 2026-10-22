# backend/app/schemas/machine.py
from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.machine import MachineType, MachineStatus

# Schema for incoming request data when creating a machine
class MachineCreate(BaseModel):
    machine_code: str
    machine_type: MachineType
    snr_profile: Optional[str] = None
    location_bay: Optional[str] = None

# Schema for response payload returned to client/frontend
class MachineResponse(BaseModel):
    machine_id: UUID
    machine_code: str
    machine_type: MachineType
    status: MachineStatus
    snr_profile: Optional[str]
    location_bay: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)