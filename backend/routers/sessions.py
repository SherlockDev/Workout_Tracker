from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from collections import Counter
from database import get_db
import models
import schemas

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("/calendar", response_model=List[str])
def get_calendar(
    profile_id: int = Query(...),
    month: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if not month:
        now = datetime.now()
        month = f"{now.year}-{now.month:02d}"
    year, m = map(int, month.split("-"))
    start = datetime(year, m, 1)
    end = datetime(year + 1, 1, 1) if m == 12 else datetime(year, m + 1, 1)
    sessions = (
        db.query(models.WorkoutSession)
        .filter(
            models.WorkoutSession.profile_id == profile_id,
            models.WorkoutSession.date >= start,
            models.WorkoutSession.date < end,
        )
        .all()
    )
    return list({s.date.strftime("%Y-%m-%d") for s in sessions})


@router.get("/body-areas", response_model=List[schemas.BodyAreaStat])
def get_body_areas(
    profile_id: int = Query(...),
    days: int = 30,
    db: Session = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=days)
    sessions = (
        db.query(models.WorkoutSession)
        .filter(
            models.WorkoutSession.profile_id == profile_id,
            models.WorkoutSession.date >= cutoff,
        )
        .all()
    )
    counter: Counter = Counter()
    for s in sessions:
        for se in s.exercises:
            if se.exercise:
                set_count = len(se.completed_sets) if se.completed_sets else se.sets
                counter[se.exercise.muscle_group] += set_count
    return [schemas.BodyAreaStat(muscle_group=k, count=v) for k, v in counter.most_common()]


@router.get("", response_model=List[schemas.SessionOut])
def get_sessions(
    profile_id: int = Query(...),
    month: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    query = db.query(models.WorkoutSession).filter(
        models.WorkoutSession.profile_id == profile_id
    )
    if month:
        year, m = map(int, month.split("-"))
        start = datetime(year, m, 1)
        end = datetime(year + 1, 1, 1) if m == 12 else datetime(year, m + 1, 1)
        query = query.filter(
            models.WorkoutSession.date >= start, models.WorkoutSession.date < end
        )
    sessions = query.order_by(models.WorkoutSession.date.desc()).limit(limit).all()
    result = []
    for s in sessions:
        muscle_groups = list({se.exercise.muscle_group for se in s.exercises if se.exercise})
        result.append(schemas.SessionOut(
            id=s.id,
            date=s.date,
            workout_name=s.workout_template.name if s.workout_template else None,
            duration_minutes=s.duration_minutes,
            notes=s.notes,
            muscle_groups=muscle_groups,
        ))
    return result


@router.post("", response_model=schemas.SessionOut)
def complete_workout(
    data: schemas.CompleteWorkoutCreate,
    profile_id: int = Query(...),
    db: Session = Depends(get_db),
):
    session = models.WorkoutSession(
        workout_template_id=data.workout_template_id,
        profile_id=profile_id,
        date=data.date or datetime.utcnow(),
        duration_minutes=data.duration_minutes,
        notes=data.notes,
    )
    db.add(session)
    db.flush()
    for ex_data in data.exercises:
        se = models.SessionExercise(
            session_id=session.id,
            exercise_id=ex_data.exercise_id,
            sets=len(ex_data.sets),
            reps=ex_data.sets[0].reps if ex_data.sets else None,
            weight=ex_data.sets[0].weight if ex_data.sets else None,
        )
        db.add(se)
        db.flush()
        for s in ex_data.sets:
            db.add(models.CompletedSet(
                session_exercise_id=se.id,
                set_number=s.set_number,
                reps=s.reps,
                weight=s.weight,
                distance_km=s.distance_km,
                duration_secs=s.duration_secs,
                calories=s.calories,
                custom_value=s.custom_value,
            ))
    db.commit()
    db.refresh(session)
    muscle_groups = list({se.exercise.muscle_group for se in session.exercises if se.exercise})
    return schemas.SessionOut(
        id=session.id,
        date=session.date,
        workout_name=session.workout_template.name if session.workout_template else None,
        duration_minutes=session.duration_minutes,
        notes=session.notes,
        muscle_groups=muscle_groups,
    )


@router.get("/{session_id}", response_model=schemas.SessionDetailOut)
def get_session(session_id: int, db: Session = Depends(get_db)):
    s = db.query(models.WorkoutSession).filter(models.WorkoutSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    muscle_groups = list({se.exercise.muscle_group for se in s.exercises if se.exercise})
    exercises_detail = []
    for se in s.exercises:
        if se.exercise:
            sorted_sets = sorted(se.completed_sets, key=lambda cs: cs.set_number)
            exercises_detail.append(schemas.SessionExerciseDetailOut(
                exercise=se.exercise,
                sets=sorted_sets,
            ))
    return schemas.SessionDetailOut(
        id=s.id,
        date=s.date,
        workout_name=s.workout_template.name if s.workout_template else None,
        duration_minutes=s.duration_minutes,
        notes=s.notes,
        muscle_groups=muscle_groups,
        exercises=exercises_detail,
    )
