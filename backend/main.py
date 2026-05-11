import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, SessionLocal
import models
from routers import workouts, sessions, exercises, profile
from seed import seed_database

models.Base.metadata.create_all(bind=engine)


def run_migrations():
    """Add columns/tables introduced after initial schema creation."""
    alter_stmts = [
        # CompletedSet cardio columns
        "ALTER TABLE completed_sets ADD COLUMN distance_km REAL",
        "ALTER TABLE completed_sets ADD COLUMN duration_secs INTEGER",
        "ALTER TABLE completed_sets ADD COLUMN calories INTEGER",
        "ALTER TABLE completed_sets ADD COLUMN custom_value REAL",
        # Exercise tracking columns
        "ALTER TABLE exercises ADD COLUMN tracking_type TEXT DEFAULT 'strength'",
        "ALTER TABLE exercises ADD COLUMN custom_metric_label TEXT",
        # Profile foreign keys
        "ALTER TABLE workout_templates ADD COLUMN profile_id INTEGER REFERENCES user_profiles(id)",
        "ALTER TABLE workout_sessions ADD COLUMN profile_id INTEGER REFERENCES user_profiles(id)",
        "ALTER TABLE weight_logs ADD COLUMN profile_id INTEGER REFERENCES user_profiles(id)",
        "ALTER TABLE body_measurements ADD COLUMN profile_id INTEGER REFERENCES user_profiles(id)",
        # Exercise slot labels
        "ALTER TABLE workout_template_exercises ADD COLUMN label TEXT",
        "ALTER TABLE session_exercises ADD COLUMN label TEXT",
        # Cardio targets on template exercises
        "ALTER TABLE workout_template_exercises ADD COLUMN target_distance_km REAL",
        "ALTER TABLE workout_template_exercises ADD COLUMN target_duration_secs INTEGER",
        "ALTER TABLE workout_template_exercises ADD COLUMN target_calories INTEGER",
        "ALTER TABLE workout_template_exercises ADD COLUMN target_custom REAL",
    ]
    update_stmts = [
        "UPDATE exercises SET tracking_type='distance_pace'    WHERE name IN ('Running','Cycling') AND (tracking_type IS NULL OR tracking_type='strength')",
        "UPDATE exercises SET tracking_type='distance_calories' WHERE name='Rowing'                AND (tracking_type IS NULL OR tracking_type='strength')",
        "UPDATE exercises SET tracking_type='duration'          WHERE name IN ('Jump Rope','Plank') AND (tracking_type IS NULL OR tracking_type='strength')",
    ]
    create_stmts = [
        "CREATE TABLE IF NOT EXISTS user_profiles (id INTEGER PRIMARY KEY, name TEXT, age INTEGER, height_cm REAL)",
        "CREATE TABLE IF NOT EXISTS weight_logs (id INTEGER PRIMARY KEY, date DATETIME, weight_kg REAL NOT NULL)",
        "CREATE TABLE IF NOT EXISTS body_measurements (id INTEGER PRIMARY KEY, date DATETIME, arms_cm REAL, chest_cm REAL, waist_cm REAL, hips_cm REAL, thighs_cm REAL, notes TEXT)",
        "CREATE TABLE IF NOT EXISTS personal_bests (id INTEGER PRIMARY KEY, profile_id INTEGER REFERENCES user_profiles(id), exercise_id INTEGER REFERENCES exercises(id), manual_weight REAL, manual_pace_secs_per_km REAL, manual_distance_km REAL, manual_duration_secs INTEGER, manual_custom REAL)",
    ]
    with engine.connect() as conn:
        for stmt in alter_stmts:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass
        for stmt in update_stmts + create_stmts:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass

        # Ensure a default profile exists, then migrate any unowned rows to it
        result = conn.execute(text("SELECT id FROM user_profiles LIMIT 1"))
        row = result.fetchone()
        if not row:
            conn.execute(text("INSERT INTO user_profiles (name) VALUES ('Me')"))
            conn.commit()
            result = conn.execute(text("SELECT id FROM user_profiles LIMIT 1"))
            row = result.fetchone()
        if row:
            default_id = row[0]
            for table in ["workout_templates", "workout_sessions", "weight_logs", "body_measurements"]:
                try:
                    conn.execute(text(f"UPDATE {table} SET profile_id = {default_id} WHERE profile_id IS NULL"))
                    conn.commit()
                except Exception:
                    pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Workout Tracker API", lifespan=lifespan)

_cors_origins = ["http://localhost:3000"]
if os.getenv("CORS_ORIGIN"):
    _cors_origins.append(os.getenv("CORS_ORIGIN"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workouts.router)
app.include_router(sessions.router)
app.include_router(exercises.router)
app.include_router(profile.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
