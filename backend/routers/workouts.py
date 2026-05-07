from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/workouts", tags=["workouts"])


@router.get("", response_model=List[schemas.WorkoutTemplateOut])
def get_workouts(db: Session = Depends(get_db)):
    workouts = db.query(models.WorkoutTemplate).order_by(models.WorkoutTemplate.created_at.desc()).all()
    return [
        schemas.WorkoutTemplateOut(
            id=w.id,
            name=w.name,
            description=w.description,
            created_at=w.created_at,
            exercise_count=len(w.exercises),
        )
        for w in workouts
    ]


@router.post("", response_model=schemas.WorkoutTemplateOut)
def create_workout(workout: schemas.WorkoutTemplateCreate, db: Session = Depends(get_db)):
    db_workout = models.WorkoutTemplate(name=workout.name, description=workout.description)
    db.add(db_workout)
    db.flush()

    for i, ex in enumerate(workout.exercises):
        db.add(
            models.WorkoutTemplateExercise(
                workout_template_id=db_workout.id,
                exercise_id=ex.exercise_id,
                sets=ex.sets,
                reps=ex.reps,
                weight=ex.weight,
                order=ex.order if ex.order else i,
            )
        )

    db.commit()
    db.refresh(db_workout)
    return schemas.WorkoutTemplateOut(
        id=db_workout.id,
        name=db_workout.name,
        description=db_workout.description,
        created_at=db_workout.created_at,
        exercise_count=len(db_workout.exercises),
    )


@router.get("/{workout_id}", response_model=schemas.WorkoutTemplateDetailOut)
def get_workout(workout_id: int, db: Session = Depends(get_db)):
    workout = (
        db.query(models.WorkoutTemplate)
        .filter(models.WorkoutTemplate.id == workout_id)
        .first()
    )
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout
