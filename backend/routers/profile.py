from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
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


def _query_pbs(profile_id: int, exercise_id, db: Session) -> list:
    return db.execute(text("""
        SELECT
            pb.exercise_id,
            e.name,
            e.muscle_group,
            e.tracking_type,
            e.custom_metric_label,
            pb.manual_weight,
            pb.manual_pace_secs_per_km,
            pb.manual_distance_km,
            pb.manual_duration_secs,
            pb.manual_custom,
            MAX(CASE WHEN e.tracking_type = 'strength' THEN cs.weight END) AS auto_weight,
            MIN(CASE WHEN e.tracking_type = 'distance_pace' AND cs.distance_km > 0
                     THEN CAST(cs.duration_secs AS REAL) / cs.distance_km END) AS auto_pace_secs_per_km,
            MAX(CASE WHEN e.tracking_type IN ('distance_pace','distance_calories') THEN cs.distance_km END) AS auto_distance_km,
            MAX(CASE WHEN e.tracking_type = 'duration' THEN cs.duration_secs END) AS auto_duration_secs,
            MAX(CASE WHEN e.tracking_type = 'custom' THEN cs.custom_value END) AS auto_custom
        FROM personal_bests pb
        JOIN exercises e ON e.id = pb.exercise_id
        LEFT JOIN session_exercises se ON se.exercise_id = e.id
        LEFT JOIN workout_sessions ws ON ws.id = se.session_id AND ws.profile_id = :profile_id
        LEFT JOIN completed_sets cs ON cs.session_exercise_id = se.id
        WHERE pb.profile_id = :profile_id AND (:eid IS NULL OR pb.exercise_id = :eid)
        GROUP BY pb.exercise_id, e.name, e.muscle_group, e.tracking_type, e.custom_metric_label,
                 pb.manual_weight, pb.manual_pace_secs_per_km, pb.manual_distance_km,
                 pb.manual_duration_secs, pb.manual_custom
        ORDER BY e.name
    """), {"profile_id": profile_id, "eid": exercise_id}).fetchall()


def _to_pb_out(r) -> schemas.PersonalBestOut:
    return schemas.PersonalBestOut(
        exercise_id=r[0], exercise_name=r[1], muscle_group=r[2],
        tracking_type=r[3], custom_metric_label=r[4],
        manual_weight=r[5], manual_pace_secs_per_km=r[6],
        manual_distance_km=r[7], manual_duration_secs=r[8], manual_custom=r[9],
        auto_weight=r[10], auto_pace_secs_per_km=r[11],
        auto_distance_km=r[12], auto_duration_secs=r[13], auto_custom=r[14],
    )


@router.get("/api/profile/personal-bests", response_model=List[schemas.PersonalBestOut])
def get_personal_bests(profile_id: int, db: Session = Depends(get_db)):
    return [_to_pb_out(r) for r in _query_pbs(profile_id, None, db)]


@router.post("/api/profile/personal-bests", response_model=schemas.PersonalBestOut)
def add_personal_best(data: schemas.PersonalBestCreate, profile_id: int, db: Session = Depends(get_db)):
    existing = db.execute(
        text("SELECT id FROM personal_bests WHERE profile_id = :pid AND exercise_id = :eid"),
        {"pid": profile_id, "eid": data.exercise_id},
    ).fetchone()
    if existing:
        raise HTTPException(status_code=409, detail="Exercise already tracked")
    db.add(models.PersonalBest(profile_id=profile_id, exercise_id=data.exercise_id))
    db.commit()
    rows = _query_pbs(profile_id, data.exercise_id, db)
    return _to_pb_out(rows[0])


@router.put("/api/profile/personal-bests/{exercise_id}", response_model=schemas.PersonalBestOut)
def update_personal_best(
    exercise_id: int, data: schemas.PersonalBestUpdate, profile_id: int, db: Session = Depends(get_db)
):
    pb = db.query(models.PersonalBest).filter(
        models.PersonalBest.profile_id == profile_id,
        models.PersonalBest.exercise_id == exercise_id,
    ).first()
    if not pb:
        raise HTTPException(status_code=404, detail="Personal best not found")
    pb.manual_weight = data.manual_weight
    pb.manual_pace_secs_per_km = data.manual_pace_secs_per_km
    pb.manual_distance_km = data.manual_distance_km
    pb.manual_duration_secs = data.manual_duration_secs
    pb.manual_custom = data.manual_custom
    db.commit()
    rows = _query_pbs(profile_id, exercise_id, db)
    return _to_pb_out(rows[0])


@router.delete("/api/profile/personal-bests/{exercise_id}")
def delete_personal_best(exercise_id: int, profile_id: int, db: Session = Depends(get_db)):
    pb = db.query(models.PersonalBest).filter(
        models.PersonalBest.profile_id == profile_id,
        models.PersonalBest.exercise_id == exercise_id,
    ).first()
    if not pb:
        raise HTTPException(status_code=404, detail="Personal best not found")
    db.delete(pb)
    db.commit()
    return {"ok": True}
