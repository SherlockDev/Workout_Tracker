from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
import models

EXERCISES = [
    ("Bench Press",           "Chest",     "strength",          "Lie flat on bench, grip bar slightly wider than shoulder-width. Lower to mid-chest, press back up. Keep shoulder blades retracted throughout."),
    ("Incline Dumbbell Press","Chest",     "strength",          "Set bench to 30-45°. Press dumbbells up from chest level, squeeze at top. Controls the negative for full chest stretch."),
    ("Cable Fly",             "Chest",     "strength",          "Set cables to chest height. Slight bend in elbows, bring hands together in a hugging motion. Feel the stretch at full extension."),
    ("Push-up",               "Chest",     "strength",          "Hands slightly wider than shoulders. Lower chest to floor under control, press back up. Keep core tight and hips in line."),
    ("Overhead Press",        "Shoulders", "strength",          "Press barbell or dumbbells from shoulder height to full lockout overhead. Keep core braced and avoid arching lower back."),
    ("Lateral Raise",         "Shoulders", "strength",          "Raise dumbbells out to sides to shoulder height, slight bend in elbows. Lead with elbows, control the descent."),
    ("Front Raise",           "Shoulders", "strength",          "Raise dumbbells or plate straight in front to shoulder height. Keep arms nearly straight, avoid swinging."),
    ("Face Pull",             "Shoulders", "strength",          "Cable set to upper chest height with rope. Pull toward face, elbows high and out, external rotate at end position."),
    ("Pull-up",               "Back",      "strength",          "Dead hang, pull until chin clears bar. Full extension at bottom. Can use band assistance or weighted belt."),
    ("Barbell Row",           "Back",      "strength",          "Hinge at hips ~45°, row bar to lower chest/upper abdomen. Squeeze lats at top, full stretch at bottom."),
    ("Lat Pulldown",          "Back",      "strength",          "Pull bar to upper chest, elbows down and back. Lean back slightly, focus on driving elbows rather than pulling with hands."),
    ("Cable Row",             "Back",      "strength",          "Sit upright, pull handle to abdomen. Squeeze shoulder blades together at end, full stretch at front."),
    ("Deadlift",              "Back",      "strength",          "Bar over mid-foot, grip just outside shins. Push floor away, keep bar close to body, lock out hips and knees together."),
    ("Bicep Curl",            "Arms",      "strength",          "Curl dumbbells or barbell from full extension to full contraction. Keep elbows fixed at sides, supinate at top."),
    ("Hammer Curl",           "Arms",      "strength",          "Neutral grip (palms facing each other). Curl up, targets brachialis and brachioradialis as well as biceps."),
    ("Tricep Pushdown",       "Arms",      "strength",          "Cable set high, push bar or rope down to full lockout. Keep elbows fixed at sides, squeeze triceps hard at bottom."),
    ("Skull Crusher",         "Arms",      "strength",          "Lying on bench, lower bar or dumbbells toward forehead by hinging at elbows. Press back to lockout. Keep upper arms vertical."),
    ("Squat",                 "Legs",      "strength",          "Bar on upper traps, squat until thighs are parallel or below. Drive knees out, keep chest up. Full depth preferred."),
    ("Leg Press",             "Legs",      "strength",          "Feet shoulder-width on platform. Lower until knees are at 90°, press back without locking out at top. Keep lower back on pad."),
    ("Romanian Deadlift",     "Legs",      "strength",          "Hinge at hips, push them back, lower bar along legs until hamstring stretch. Drive hips forward to return."),
    ("Leg Extension",         "Legs",      "strength",          "Extend knees to full lockout, hold briefly, lower under control. Adjust pad to sit just above ankle."),
    ("Leg Curl",              "Legs",      "strength",          "Curl heels toward glutes, hold at peak contraction, lower slowly. Keep hips pressed into pad."),
    ("Calf Raise",            "Legs",      "strength",          "Full range of motion: full stretch at bottom, full contraction at top. Pause at top. Can be done seated or standing."),
    ("Plank",                 "Core",      "duration",          "Forearms and toes on floor, body in straight line. Squeeze glutes and abs, breathe steadily. Avoid hips dropping or rising."),
    ("Crunches",              "Core",      "strength",          "Feet flat, hands behind head. Curl shoulders off floor using abs, not neck. Lower under control."),
    ("Russian Twist",         "Core",      "strength",          "Seated, lean back slightly, feet off floor. Rotate torso side to side. Add weight for progression."),
    ("Leg Raise",             "Core",      "strength",          "Lying flat, raise legs from floor to vertical, lower slowly without touching floor. Keep lower back pressed down."),
    ("Running",               "Cardio",    "distance_pace",     "Track distance in km and total duration. Pace (min/km) is auto-calculated. Aim for conversational effort for base, or intervals for intensity."),
    ("Cycling",               "Cardio",    "distance_pace",     "Track distance in km and total duration. Aim for 80-100 rpm cadence. Adjust resistance to hit target heart rate zone."),
    ("Jump Rope",             "Cardio",    "duration",          "Keep elbows close to sides, wrists do the rotation. Land softly on balls of feet. Great for warm-up or HIIT intervals."),
]

WORKOUT_TEMPLATES = [
    {
        "name": "Push Day",
        "description": "Chest, shoulders, and triceps",
        "exercises": ["Bench Press","Incline Dumbbell Press","Overhead Press","Lateral Raise","Tricep Pushdown","Skull Crusher"],
    },
    {
        "name": "Pull Day",
        "description": "Back and biceps",
        "exercises": ["Pull-up","Barbell Row","Lat Pulldown","Cable Row","Bicep Curl","Hammer Curl"],
    },
    {
        "name": "Leg Day",
        "description": "Quads, hamstrings, and calves",
        "exercises": ["Squat","Leg Press","Romanian Deadlift","Leg Extension","Leg Curl","Calf Raise"],
    },
    {
        "name": "Upper Body",
        "description": "Full upper body workout",
        "exercises": ["Bench Press","Barbell Row","Overhead Press","Pull-up","Bicep Curl","Tricep Pushdown"],
    },
    {
        "name": "Core & Cardio",
        "description": "Core strength and cardio conditioning",
        "exercises": ["Plank","Crunches","Russian Twist","Leg Raise","Running","Jump Rope"],
    },
]


def seed_database(db: Session):
    if db.query(models.Exercise).count() > 0:
        return

    exercise_map = {}
    for name, muscle_group, tracking_type, description in EXERCISES:
        ex = models.Exercise(
            name=name, muscle_group=muscle_group,
            tracking_type=tracking_type, description=description,
        )
        db.add(ex)
        db.flush()
        exercise_map[name] = ex

    template_map = {}
    for t in WORKOUT_TEMPLATES:
        template = models.WorkoutTemplate(name=t["name"], description=t["description"])
        db.add(template)
        db.flush()
        for i, ex_name in enumerate(t["exercises"]):
            ex = exercise_map[ex_name]
            wte = models.WorkoutTemplateExercise(
                workout_template_id=template.id,
                exercise_id=ex.id,
                sets=3 if ex.muscle_group not in ("Cardio", "Core") else 1,
                reps=10 if ex.muscle_group not in ("Cardio", "Core") else 30,
                weight=None if ex.muscle_group in ("Cardio", "Core", "Shoulders")
                       else random.choice([40, 50, 60, 70, 80, 100]),
                order=i,
            )
            db.add(wte)
        template_map[t["name"]] = template

    templates = list(template_map.values())
    now = datetime.utcnow()
    session_dates = set()
    current = now - timedelta(days=45)
    while current <= now:
        if random.random() < 0.55:
            session_dates.add(current.date())
        current += timedelta(days=1)

    for d in sorted(session_dates):
        template = random.choice(templates)
        session_dt = datetime(d.year, d.month, d.day,
                              random.randint(6, 20), random.choice([0, 15, 30, 45]))
        session = models.WorkoutSession(
            workout_template_id=template.id,
            date=session_dt,
            duration_minutes=random.randint(35, 75),
        )
        db.add(session)
        db.flush()

        template_exercises = (
            db.query(models.WorkoutTemplateExercise)
            .filter(models.WorkoutTemplateExercise.workout_template_id == template.id)
            .all()
        )
        for wte in template_exercises:
            ex = exercise_map[wte.exercise.name]
            se = models.SessionExercise(
                session_id=session.id, exercise_id=wte.exercise_id,
                sets=wte.sets, reps=wte.reps, weight=wte.weight,
            )
            db.add(se)
            db.flush()

            for set_num in range(1, wte.sets + 1):
                if ex.tracking_type == "distance_pace":
                    dist = round(random.uniform(3, 10), 2)
                    dur = int(dist * random.uniform(250, 360))  # secs/km × km
                    db.add(models.CompletedSet(
                        session_exercise_id=se.id, set_number=set_num,
                        distance_km=dist, duration_secs=dur,
                    ))
                elif ex.tracking_type == "duration":
                    db.add(models.CompletedSet(
                        session_exercise_id=se.id, set_number=set_num,
                        duration_secs=random.randint(30, 120),
                    ))
                else:
                    reps_var = random.randint(-2, 2) if wte.reps and wte.reps > 2 else 0
                    w_var = random.choice([-2.5, 0, 0, 0, 2.5]) if wte.weight else 0
                    db.add(models.CompletedSet(
                        session_exercise_id=se.id, set_number=set_num,
                        reps=max(1, (wte.reps or 0) + reps_var),
                        weight=max(0, wte.weight + w_var) if wte.weight else None,
                    ))

    db.commit()
