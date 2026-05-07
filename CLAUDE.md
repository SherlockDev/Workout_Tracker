# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Custom workout tracker with reporting and history tracking. Full-stack: FastAPI + SQLite backend, React frontend. Intended to be deployed on AWS for mobile access.

## Architecture

```
backend/
  main.py           FastAPI app entry point — CORS, lifespan (runs migrations then seeds), router registration
  database.py       SQLAlchemy engine + SessionLocal + get_db dependency
  models.py         ORM models: Exercise, WorkoutTemplate, WorkoutTemplateExercise,
                    WorkoutSession, SessionExercise, CompletedSet,
                    UserProfile, WeightLog, BodyMeasurement
  schemas.py        Pydantic v2 schemas (model_config = {"from_attributes": True})
  seed.py           Seeds exercises + workout templates + ~45 days of fake sessions on first startup.
                    No-ops if exercises table is non-empty. Uses 4-tuple (name, muscle_group, tracking_type, description).
  routers/
    workouts.py     GET/POST /api/workouts, GET /api/workouts/{id}
    sessions.py     GET /api/sessions, GET /api/sessions/calendar, GET /api/sessions/body-areas,
                    GET /api/sessions/{id}, POST /api/sessions (complete workout with per-set data)
    exercises.py    GET/POST /api/exercises, PUT /api/exercises/{id}
    profile.py      GET/PUT /api/profile, GET/POST /api/profile/weight, GET/POST /api/profile/measurements
  workout_tracker.db  SQLite file (gitignored, created on first run)

frontend/workout-tracker/
  src/
    api.js                     Thin fetch wrapper — api.get(path) / api.post(path, data) / api.put(path, data)
    App.js                     BrowserRouter + route definitions (/, /workouts, /builder/:id, /exercises, /do/:id, /sessions/:id, /profile)
    components/
      Sidebar.js / .css        Nav sidebar (Dashboard, Workouts, Builder, Exercises, Profile links)
      MonthlyCalendar.js / .css  Calendar grid, highlights workout days, calls onDayClick for clickable days
      BodyAreaChart.js         Recharts PieChart (donut) of completed sets per muscle group
      DayWorkoutsModal.js / .css  Modal listing a clicked day's sessions; click to navigate to session detail
    pages/
      Dashboard.js / .css      Landing: navigable monthly calendar (up to 12 months back) + body area chart + clickable recent sessions
      WorkoutList.js / .css    Grid of workout cards with separate Start / Edit buttons
      WorkoutBuilder.js / .css Two-column: exercise selector (right) + sets/reps editor (left)
      Exercises.js / .css      Table of all exercises with search + muscle-group filter; edit modal with tracking_type select
      DoWorkout.js / .css      Active workout: stopwatch with pause/resume, per-set cardio-aware inputs, save as CompletedSession
      SessionDetail.js / .css  Displays a completed session with tracking-type-aware set table (pace auto-calc for distance_pace)
      Profile.js / .css        Name/age/height card, weight history AreaChart (Recharts) with timeframe selector, body measurements log
```

**Tracking types** for exercises: `strength` (weight + reps), `distance_pace` (km + min:sec → auto-pace), `distance_calories` (km + kcal), `duration` (min:sec), `custom` (single value + label). Stored in `Exercise.tracking_type`; per-set data stored in `CompletedSet`.

**DB migrations:** `run_migrations()` in `main.py` runs `ALTER TABLE ADD COLUMN` statements wrapped in `try/except` (silently skips if column already exists) and `CREATE TABLE IF NOT EXISTS` for new tables. This means schema changes are backward-compatible — no need to delete the DB.

**Seeding:** `seed.py` runs once at startup. Delete `backend/workout_tracker.db` to re-seed from scratch.

**Muscle-group colour coding:** CSS classes `tag-{muscle_group.toLowerCase()}` defined globally in `App.css`. The `.chip` / `.filter-chips` classes are defined in `Exercises.css` but available globally (CRA bundles all CSS).

## Running locally

### Backend

```powershell
# Venv lives inside backend/ — activate from repo root:
.\backend\.venv\Scripts\Activate.ps1

# Install dependencies (once)
pip install -r backend/requirements.txt

# Start API server on http://localhost:8000
cd backend
uvicorn main:app --reload
```

### Frontend

```powershell
cd frontend/workout-tracker

# Install dependencies (once)
npm install

# Start dev server on http://localhost:3000
npm start
```
