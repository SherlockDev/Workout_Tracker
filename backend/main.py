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
    ]
    with engine.connect() as conn:
        for stmt in alter_stmts:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass  # Column already exists
        for stmt in update_stmts + create_stmts:
            try:
                conn.execute(text(stmt))
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
