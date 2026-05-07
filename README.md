# Workout Tracker

A personal workout tracking app with history, reporting, and body measurement tracking. Built with a FastAPI + SQLite backend and a React frontend.

## What it does

- **Dashboard** — monthly calendar showing workout days, muscle group breakdown chart, and recent session history. Navigate back up to 12 months to review past activity.
- **Workout Builder** — create and edit workout templates with a searchable exercise library. Set target sets, reps, and weight per exercise.
- **Do Workout** — run through a workout template in real time with a pause/resume stopwatch. Log weight and reps independently per set. Cardio exercises (running, cycling, etc.) show distance and time inputs instead, with pace auto-calculated.
- **Session History** — click any workout day on the calendar or any entry in the recent sessions list to view the full session detail, including every set logged.
- **Exercises** — browse and edit all exercises. Each exercise has a muscle group, description, and a tracking type (Strength, Distance & Pace, Distance & Calories, Duration, or Custom).
- **Profile** — set your name, age, and height. Log body weight over time and view it on a chart with selectable timeframes (1 month, 3 months, 1 year). Log body measurements (arms, chest, waist, hips, thighs).

On first run the app seeds itself with 30 exercises, 5 workout templates, and ~45 days of sample session history so there is data to explore immediately.

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm

## Running locally

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Workout_Tracker.git
cd Workout_Tracker
```

### 2. Start the backend

```bash
# Create and activate a virtual environment
cd backend
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the API server (runs on http://localhost:8000)
uvicorn main:app --reload
```

The database file (`workout_tracker.db`) is created automatically on first run, and sample data is seeded.

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend/workout-tracker
npm install
npm start
```

The app opens at **http://localhost:3000**.

## Project structure

```
backend/
  main.py           API entry point — starts server, runs migrations, seeds data
  models.py         Database models (SQLAlchemy)
  schemas.py        Request/response shapes (Pydantic v2)
  seed.py           Sample exercises, templates, and session history
  routers/
    workouts.py     Workout template endpoints
    sessions.py     Completed session endpoints
    exercises.py    Exercise library endpoints
    profile.py      Profile, weight log, and body measurement endpoints

frontend/workout-tracker/
  src/
    api.js          Fetch wrapper for all API calls
    App.js          Route definitions
    components/     Sidebar, calendar, charts, modals
    pages/          Dashboard, Workouts, Builder, Exercises, DoWorkout, SessionDetail, Profile
```

## Resetting sample data

To wipe the database and re-seed from scratch, delete the database file and restart the backend:

```bash
rm backend/workout_tracker.db
# then restart uvicorn
```
