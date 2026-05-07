from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=schemas.UserProfileOut)
def get_profile(db: Session = Depends(get_db)):
    profile = db.query(models.UserProfile).first()
    if not profile:
        return schemas.UserProfileOut()
    return profile


@router.put("", response_model=schemas.UserProfileOut)
def update_profile(data: schemas.UserProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(models.UserProfile).first()
    if not profile:
        profile = models.UserProfile()
        db.add(profile)
    profile.name = data.name
    profile.age = data.age
    profile.height_cm = data.height_cm
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/weight", response_model=List[schemas.WeightLogOut])
def get_weight_history(days: int = 30, db: Session = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=days)
    return (
        db.query(models.WeightLog)
        .filter(models.WeightLog.date >= cutoff)
        .order_by(models.WeightLog.date)
        .all()
    )


@router.post("/weight", response_model=schemas.WeightLogOut)
def log_weight(data: schemas.WeightLogCreate, db: Session = Depends(get_db)):
    log = models.WeightLog(weight_kg=data.weight_kg, date=data.date or datetime.utcnow())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/measurements", response_model=List[schemas.BodyMeasurementOut])
def get_measurements(db: Session = Depends(get_db)):
    return (
        db.query(models.BodyMeasurement)
        .order_by(models.BodyMeasurement.date.desc())
        .limit(24)
        .all()
    )


@router.post("/measurements", response_model=schemas.BodyMeasurementOut)
def log_measurement(data: schemas.BodyMeasurementCreate, db: Session = Depends(get_db)):
    m = models.BodyMeasurement(
        date=data.date or datetime.utcnow(),
        arms_cm=data.arms_cm,
        chest_cm=data.chest_cm,
        waist_cm=data.waist_cm,
        hips_cm=data.hips_cm,
        thighs_cm=data.thighs_cm,
        notes=data.notes,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m
