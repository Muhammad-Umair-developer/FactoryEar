# backend/app/api/endpoints/machines.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.machine import Machine
from app.schemas.machine import MachineCreate, MachineResponse

router = APIRouter()

@router.post("/", response_model=MachineResponse, status_code=status.HTTP_201_CREATED)
async def register_machine(
    payload: MachineCreate, 
    db: Session = Depends(get_db)
):
    """
    Registers a new machine on the factory floor with JSON body validation.
    """
    existing_machine = db.query(Machine).filter(Machine.machine_code == payload.machine_code).first()
    if existing_machine:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Machine code '{payload.machine_code}' is already registered."
        )

    new_machine = Machine(
        machine_code=payload.machine_code,
        machine_type=payload.machine_type,
        snr_profile=payload.snr_profile,
        location_bay=payload.location_bay
    )

    db.add(new_machine)
    db.commit()
    db.refresh(new_machine)
    return new_machine

@router.get("/", response_model=List[MachineResponse])
async def list_machines(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(get_db)
):
    """
    Fetches paginated list of machines for the factory dashboard.
    """
    machines = db.query(Machine).offset(skip).limit(limit).all()
    return machines