from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/exercises", tags=["exercises"])


@router.get("", response_model=List[schemas.ExerciseOut])
def get_exercises(db: Session = Depends(get_db)):
    return (
        db.query(models.Exercise)
        .order_by(models.Exercise.muscle_group, models.Exercise.name)
        .all()
    )


@router.post("", response_model=schemas.ExerciseOut)
def create_exercise(exercise: schemas.ExerciseCreate, db: Session = Depends(get_db)):
    db_exercise = models.Exercise(**exercise.model_dump())
    db.add(db_exercise)
    db.commit()
    db.refresh(db_exercise)
    return db_exercise


@router.put("/{exercise_id}", response_model=schemas.ExerciseOut)
def update_exercise(
    exercise_id: int, data: schemas.ExerciseUpdate, db: Session = Depends(get_db)
):
    ex = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Exercise not found")
    ex.name = data.name
    ex.muscle_group = data.muscle_group
    ex.description = data.description
    ex.tracking_type = data.tracking_type
    ex.custom_metric_label = data.custom_metric_label
    db.commit()
    db.refresh(ex)
    return ex
