from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# ── Exercises ────────────────────────────────────────────────────────────────

class ExerciseBase(BaseModel):
    name: str
    muscle_group: str
    description: Optional[str] = None
    tracking_type: str = "strength"
    custom_metric_label: Optional[str] = None


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(BaseModel):
    name: str
    muscle_group: str
    description: Optional[str] = None
    tracking_type: str = "strength"
    custom_metric_label: Optional[str] = None


class ExerciseOut(ExerciseBase):
    id: int
    model_config = {"from_attributes": True}


# ── Workout Templates ────────────────────────────────────────────────────────

class WorkoutTemplateExerciseOut(BaseModel):
    id: int
    exercise_id: int
    exercise: ExerciseOut
    sets: int
    reps: int
    weight: Optional[float] = None
    order: int
    model_config = {"from_attributes": True}


class WorkoutTemplateExerciseCreate(BaseModel):
    exercise_id: int
    sets: int = 3
    reps: int = 10
    weight: Optional[float] = None
    order: int = 0


class WorkoutTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    exercises: List[WorkoutTemplateExerciseCreate] = []


class WorkoutTemplateOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    exercise_count: int = 0
    model_config = {"from_attributes": True}


class WorkoutTemplateDetailOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    exercises: List[WorkoutTemplateExerciseOut] = []
    model_config = {"from_attributes": True}


# ── Completed workout (Do Workout) ───────────────────────────────────────────

class CompletedSetCreate(BaseModel):
    set_number: int
    # Strength
    reps: Optional[int] = None
    weight: Optional[float] = None
    # Cardio
    distance_km: Optional[float] = None
    duration_secs: Optional[int] = None
    calories: Optional[int] = None
    custom_value: Optional[float] = None


class CompletedSessionExerciseCreate(BaseModel):
    exercise_id: int
    sets: List[CompletedSetCreate]


class CompleteWorkoutCreate(BaseModel):
    workout_template_id: Optional[int] = None
    date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    exercises: List[CompletedSessionExerciseCreate]


# ── Session output ───────────────────────────────────────────────────────────

class SessionOut(BaseModel):
    id: int
    date: datetime
    workout_name: Optional[str] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    muscle_groups: List[str] = []
    model_config = {"from_attributes": True}


class CompletedSetOut(BaseModel):
    set_number: int
    reps: Optional[int] = None
    weight: Optional[float] = None
    distance_km: Optional[float] = None
    duration_secs: Optional[int] = None
    calories: Optional[int] = None
    custom_value: Optional[float] = None
    model_config = {"from_attributes": True}


class SessionExerciseDetailOut(BaseModel):
    exercise: ExerciseOut
    sets: List[CompletedSetOut] = []
    model_config = {"from_attributes": True}


class SessionDetailOut(BaseModel):
    id: int
    date: datetime
    workout_name: Optional[str] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    muscle_groups: List[str] = []
    exercises: List[SessionExerciseDetailOut] = []
    model_config = {"from_attributes": True}


class BodyAreaStat(BaseModel):
    muscle_group: str
    count: int


# ── Profile ──────────────────────────────────────────────────────────────────

class UserProfileOut(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None
    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    height_cm: Optional[float] = None


class WeightLogCreate(BaseModel):
    weight_kg: float
    date: Optional[datetime] = None


class WeightLogOut(BaseModel):
    id: int
    date: datetime
    weight_kg: float
    model_config = {"from_attributes": True}


class BodyMeasurementCreate(BaseModel):
    date: Optional[datetime] = None
    arms_cm: Optional[float] = None
    chest_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hips_cm: Optional[float] = None
    thighs_cm: Optional[float] = None
    notes: Optional[str] = None


class BodyMeasurementOut(BaseModel):
    id: int
    date: datetime
    arms_cm: Optional[float] = None
    chest_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    hips_cm: Optional[float] = None
    thighs_cm: Optional[float] = None
    notes: Optional[str] = None
    model_config = {"from_attributes": True}
