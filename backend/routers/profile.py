from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from database import get_db
import models
import schemas

router = APIRouter(tags=["profile"])


@router.get("/api/profiles", response_model=List[schemas.UserProfileOut])
def list_profiles(db: Session = Depends(get_db)):
    return db.query(models.UserProfile).order_by(models.UserProfile.id).all()


@router.post("/api/profiles", response_model=schemas.UserProfileOut)
def create_profile(data: schemas.UserProfileCreate, db: Session = Depends(get_db)):
    profile = models.UserProfile(name=data.name)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/api/profile", response_model=schemas.UserProfileOut)
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(models.UserProfile).filter(models.UserProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/api/profile", response_model=schemas.UserProfileOut)
def update_profile(data: schemas.UserProfileUpdate, profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(models.UserProfile).filter(models.UserProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile.name = data.name
    profile.age = data.age
    profile.height_cm = data.height_cm
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/api/profile/weight", response_model=List[schemas.WeightLogOut])
def get_weight_history(profile_id: int, days: int = 30, db: Session = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=days)
    return (
        db.query(models.WeightLog)
        .filter(models.WeightLog.profile_id == profile_id, models.WeightLog.date >= cutoff)
        .order_by(models.WeightLog.date)
        .all()
    )


@router.post("/api/profile/weight", response_model=schemas.WeightLogOut)
def log_weight(data: schemas.WeightLogCreate, profile_id: int, db: Session = Depends(get_db)):
    log = models.WeightLog(
        profile_id=profile_id,
        weight_kg=data.weight_kg,
        date=data.date or datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/api/profile/measurements", response_model=List[schemas.BodyMeasurementOut])
def get_measurements(profile_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.BodyMeasurement)
        .filter(models.BodyMeasurement.profile_id == profile_id)
        .order_by(models.BodyMeasurement.date.desc())
        .limit(24)
        .all()
    )


@router.post("/api/profile/measurements", response_model=schemas.BodyMeasurementOut)
def log_measurement(data: schemas.BodyMeasurementCreate, profile_id: int, db: Session = Depends(get_db)):
    m = models.BodyMeasurement(
        profile_id=profile_id,
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
