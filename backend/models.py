from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    muscle_group = Column(String)
    description = Column(Text, nullable=True)
    tracking_type = Column(String, default="strength")
    custom_metric_label = Column(String, nullable=True)


class WorkoutTemplate(Base):
    __tablename__ = "workout_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    profile_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=True)

    profile = relationship("UserProfile", back_populates="templates")
    exercises = relationship(
        "WorkoutTemplateExercise", back_populates="workout_template", cascade="all, delete-orphan"
    )
    sessions = relationship("WorkoutSession", back_populates="workout_template")


class WorkoutTemplateExercise(Base):
    __tablename__ = "workout_template_exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_template_id = Column(Integer, ForeignKey("workout_templates.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    sets = Column(Integer, default=3)
    reps = Column(Integer, default=10)
    weight = Column(Float, nullable=True)
    order = Column(Integer, default=0)

    workout_template = relationship("WorkoutTemplate", back_populates="exercises")
    exercise = relationship("Exercise")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    workout_template_id = Column(Integer, ForeignKey("workout_templates.id"), nullable=True)
    profile_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)

    profile = relationship("UserProfile", back_populates="sessions")
    workout_template = relationship("WorkoutTemplate", back_populates="sessions")
    exercises = relationship(
        "SessionExercise", back_populates="session", cascade="all, delete-orphan"
    )


class SessionExercise(Base):
    __tablename__ = "session_exercises"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    sets = Column(Integer)
    reps = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)

    session = relationship("WorkoutSession", back_populates="exercises")
    exercise = relationship("Exercise")
    completed_sets = relationship(
        "CompletedSet", back_populates="session_exercise", cascade="all, delete-orphan"
    )


class CompletedSet(Base):
    __tablename__ = "completed_sets"

    id = Column(Integer, primary_key=True, index=True)
    session_exercise_id = Column(Integer, ForeignKey("session_exercises.id"))
    set_number = Column(Integer)
    reps = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=True)
    duration_secs = Column(Integer, nullable=True)
    calories = Column(Integer, nullable=True)
    custom_value = Column(Float, nullable=True)

    session_exercise = relationship("SessionExercise", back_populates="completed_sets")


# ── Profile ─────────────────────────────────────────────────────────────────

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    height_cm = Column(Float, nullable=True)

    templates = relationship("WorkoutTemplate", back_populates="profile")
    sessions = relationship("WorkoutSession", back_populates="profile")
    weight_logs = relationship("WeightLog", back_populates="profile")
    measurements = relationship("BodyMeasurement", back_populates="profile")


class WeightLog(Base):
    __tablename__ = "weight_logs"

    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    weight_kg = Column(Float, nullable=False)

    profile = relationship("UserProfile", back_populates="weight_logs")


class BodyMeasurement(Base):
    __tablename__ = "body_measurements"

    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    arms_cm = Column(Float, nullable=True)
    chest_cm = Column(Float, nullable=True)
    waist_cm = Column(Float, nullable=True)
    hips_cm = Column(Float, nullable=True)
    thighs_cm = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    profile = relationship("UserProfile", back_populates="measurements")
