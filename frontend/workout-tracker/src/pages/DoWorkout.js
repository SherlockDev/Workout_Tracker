import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import "./DoWorkout.css";

const fmt = (secs) =>
  `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

const COL_CONFIG = {
  strength:           { cols: "36px 1fr 1fr 28px",        heads: ["Set", "kg", "reps", ""] },
  distance_pace:      { cols: "36px 1fr 52px 52px 28px",  heads: ["Set", "km", "min", "sec", ""] },
  distance_calories:  { cols: "36px 1fr 1fr 28px",        heads: ["Set", "km", "kcal", ""] },
  duration:           { cols: "36px 1fr 1fr 28px",         heads: ["Set", "min", "sec", ""] },
  custom:             { cols: "36px 1fr 28px",             heads: ["Set", "value", ""] },
};

const makeSet = (ex, we) => {
  switch (ex.tracking_type) {
    case "distance_pace":     return { distance_km: "", dur_mins: "", dur_secs: "" };
    case "distance_calories": return { distance_km: "", calories: "" };
    case "duration":          return { dur_mins: "", dur_secs: "" };
    case "custom":            return { custom_value: "" };
    default:                  return { reps: we.reps ?? "", weight: we.weight ?? "" };
  }
};

const buildSetPayload = (s, trackingType, idx) => {
  const base = { set_number: idx + 1 };
  switch (trackingType) {
    case "distance_pace":
      return {
        ...base,
        distance_km: parseFloat(s.distance_km) || null,
        duration_secs:
          ((parseInt(s.dur_mins, 10) || 0) * 60 + (parseInt(s.dur_secs, 10) || 0)) || null,
      };
    case "distance_calories":
      return {
        ...base,
        distance_km: parseFloat(s.distance_km) || null,
        calories: parseInt(s.calories, 10) || null,
      };
    case "duration":
      return {
        ...base,
        duration_secs:
          ((parseInt(s.dur_mins, 10) || 0) * 60 + (parseInt(s.dur_secs, 10) || 0)) || null,
      };
    case "custom":
      return { ...base, custom_value: parseFloat(s.custom_value) || null };
    default:
      return {
        ...base,
        reps: parseInt(s.reps, 10) || 0,
        weight: s.weight !== "" ? parseFloat(s.weight) : null,
      };
  }
};

function SetInputs({ trackingType, set, onChange }) {
  const u = (field) => (e) => onChange(field, e.target.value);
  switch (trackingType) {
    case "distance_pace":
      return (
        <>
          <input type="number" min="0" step="0.01" value={set.distance_km} onChange={u("distance_km")} placeholder="0.0" className="set-input" />
          <input type="number" min="0" value={set.dur_mins} onChange={u("dur_mins")} placeholder="0" className="set-input" />
          <input type="number" min="0" max="59" value={set.dur_secs} onChange={u("dur_secs")} placeholder="00" className="set-input" />
        </>
      );
    case "distance_calories":
      return (
        <>
          <input type="number" min="0" step="0.01" value={set.distance_km} onChange={u("distance_km")} placeholder="0.0" className="set-input" />
          <input type="number" min="0" value={set.calories} onChange={u("calories")} placeholder="0" className="set-input" />
        </>
      );
    case "duration":
      return (
        <>
          <input type="number" min="0" value={set.dur_mins} onChange={u("dur_mins")} placeholder="0" className="set-input" />
          <input type="number" min="0" max="59" value={set.dur_secs} onChange={u("dur_secs")} placeholder="00" className="set-input" />
        </>
      );
    case "custom":
      return (
        <input type="number" min="0" step="any" value={set.custom_value} onChange={u("custom_value")} placeholder="0" className="set-input" />
      );
    default:
      return (
        <>
          <input type="number" min="0" step="0.5" value={set.weight} onChange={u("weight")} placeholder="—" className="set-input" />
          <input type="number" min="0" value={set.reps} onChange={u("reps")} className="set-input" />
        </>
      );
  }
}

export default function DoWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState(null);
  const [rows, setRows] = useState([]);
  const [notes, setNotes] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const startRef = useRef(Date.now());
  const pausedElapsedRef = useRef(0);
  const pausedAtRef = useRef(null);

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(
      () =>
        setElapsed(
          Math.floor((Date.now() - startRef.current) / 1000) - pausedElapsedRef.current
        ),
      1000
    );
    return () => clearInterval(t);
  }, [isPaused]);

  useEffect(() => {
    api
      .get(`/api/workouts/${id}`)
      .then((w) => {
        setWorkout(w);
        const sorted = [...w.exercises].sort((a, b) => a.order - b.order);
        setRows(
          sorted.map((we) => ({
            exercise: we.exercise,
            sets: Array.from({ length: we.sets }, () => makeSet(we.exercise, we)),
          }))
        );
        setLoading(false);
      })
      .catch(() => navigate("/workouts"));
  }, [id, navigate]);

  const togglePause = () => {
    if (!isPaused) {
      pausedAtRef.current = Date.now();
    } else {
      pausedElapsedRef.current += Math.floor((Date.now() - pausedAtRef.current) / 1000);
      pausedAtRef.current = null;
    }
    setIsPaused((p) => !p);
  };

  const addSet = (ri) =>
    setRows((prev) =>
      prev.map((r, i) =>
        i !== ri ? r : { ...r, sets: [...r.sets, { ...r.sets[r.sets.length - 1] }] }
      )
    );

  const removeSet = (ri, si) =>
    setRows((prev) =>
      prev.map((r, i) =>
        i !== ri || r.sets.length <= 1 ? r : { ...r, sets: r.sets.filter((_, j) => j !== si) }
      )
    );

  const updateSet = (ri, si, field, val) =>
    setRows((prev) =>
      prev.map((r, i) =>
        i !== ri
          ? r
          : { ...r, sets: r.sets.map((s, j) => (j !== si ? s : { ...s, [field]: val })) }
      )
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/api/sessions", {
        workout_template_id: workout.id,
        date: new Date().toISOString(),
        duration_minutes: Math.max(1, Math.round(elapsed / 60)),
        notes: notes.trim() || null,
        exercises: rows.map((row) => ({
          exercise_id: row.exercise.id,
          sets: row.sets.map((s, si) =>
            buildSetPayload(s, row.exercise.tracking_type, si)
          ),
        })),
      });
      navigate("/");
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="dw-page">
      <div className="dw-header">
        <div className="dw-title">
          <h1>{workout.name}</h1>
          {workout.description && <p className="dw-subtitle">{workout.description}</p>}
        </div>
        <div className="dw-timer-block">
          <div className={`dw-timer${isPaused ? " paused" : ""}`}>{fmt(elapsed)}</div>
          <button
            className={`btn-pause${isPaused ? " resumed" : ""}`}
            onClick={togglePause}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Workout"}
        </button>
      </div>

      <div className="dw-exercises">
        {rows.map((row, ri) => {
          const cfg = COL_CONFIG[row.exercise.tracking_type] || COL_CONFIG.strength;
          return (
            <div key={ri} className="card dw-ex-card">
              <div className="dw-ex-top">
                <span className="dw-ex-name">{row.exercise.name}</span>
                <span className={`tag tag-${row.exercise.muscle_group.toLowerCase()}`}>
                  {row.exercise.muscle_group}
                </span>
              </div>

              {row.exercise.description && (
                <p className="dw-ex-desc">{row.exercise.description}</p>
              )}

              <div className="dw-sets-table">
                <div
                  className="dw-sets-head"
                  style={{ gridTemplateColumns: cfg.cols }}
                >
                  {cfg.heads.map((h, i) => <span key={i}>{h}</span>)}
                </div>
                {row.sets.map((set, si) => (
                  <div
                    key={si}
                    className="dw-set-row"
                    style={{ gridTemplateColumns: cfg.cols }}
                  >
                    <span className="set-num">{si + 1}</span>
                    <SetInputs
                      trackingType={row.exercise.tracking_type}
                      set={set}
                      onChange={(field, val) => updateSet(ri, si, field, val)}
                    />
                    <button
                      className="btn-rm-set"
                      onClick={() => removeSet(ri, si)}
                      disabled={row.sets.length <= 1}
                      title="Remove set"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button className="btn-add-set" onClick={() => addSet(ri)}>
                + Add Set
              </button>
            </div>
          );
        })}
      </div>

      <div className="card dw-notes-card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Any PRs, form notes, etc."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
