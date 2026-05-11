import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import "./SessionDetail.css";

const fmtDuration = (secs) => {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const fmtPace = (secs, km) => {
  if (!secs || !km) return "—";
  const pace = secs / km;
  const m = Math.floor(pace / 60);
  const s = Math.round(pace % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
};

const HEADERS = {
  strength:           ["Set", "Weight", "Reps"],
  distance_pace:      ["Set", "Distance", "Time", "Pace"],
  distance_calories:  ["Set", "Distance", "Calories"],
  duration:           ["Set", "Duration"],
  custom:             ["Set", "Value"],
};

function SetRow({ set, trackingType }) {
  switch (trackingType) {
    case "distance_pace":
      return (
        <tr>
          <td className="set-num-cell">{set.set_number}</td>
          <td>{set.distance_km != null ? `${set.distance_km} km` : "—"}</td>
          <td>{fmtDuration(set.duration_secs)}</td>
          <td className="pace-cell">{fmtPace(set.duration_secs, set.distance_km)}</td>
        </tr>
      );
    case "distance_calories":
      return (
        <tr>
          <td className="set-num-cell">{set.set_number}</td>
          <td>{set.distance_km != null ? `${set.distance_km} km` : "—"}</td>
          <td>{set.calories != null ? `${set.calories} kcal` : "—"}</td>
        </tr>
      );
    case "duration":
      return (
        <tr>
          <td className="set-num-cell">{set.set_number}</td>
          <td>{fmtDuration(set.duration_secs)}</td>
        </tr>
      );
    case "custom":
      return (
        <tr>
          <td className="set-num-cell">{set.set_number}</td>
          <td>{set.custom_value ?? "—"}</td>
        </tr>
      );
    default:
      return (
        <tr>
          <td className="set-num-cell">{set.set_number}</td>
          <td>{set.weight != null ? `${set.weight} kg` : "—"}</td>
          <td>{set.reps ?? "—"}</td>
        </tr>
      );
  }
}

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/sessions/${id}`)
      .then((s) => {
        setSession(s);
        setLoading(false);
      })
      .catch(() => navigate("/"));
  }, [id, navigate]);

  if (loading) return <div className="page-loading">Loading…</div>;

  const dateStr = new Date(session.date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = new Date(session.date).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="sd-page">
      <div className="sd-back-row">
        <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="card sd-summary-card">
        <div className="sd-header">
          <div className="sd-header-left">
            <h1 className="sd-title">{session.workout_name ?? "Custom Workout"}</h1>
            <p className="sd-date">{dateStr} at {timeStr}</p>
          </div>
          <div className="sd-stats">
            {session.duration_minutes && (
              <div className="sd-stat">
                <span className="sd-stat-val">{session.duration_minutes}</span>
                <span className="sd-stat-label">min</span>
              </div>
            )}
            <div className="sd-stat">
              <span className="sd-stat-val">{session.exercises.length}</span>
              <span className="sd-stat-label">exercises</span>
            </div>
          </div>
        </div>
        <div className="sd-tags">
          {session.muscle_groups.map((mg) => (
            <span key={mg} className={`tag tag-${mg.toLowerCase()}`}>{mg}</span>
          ))}
        </div>
        {session.notes && <p className="sd-notes">{session.notes}</p>}
      </div>

      <div className="sd-exercises">
        {session.exercises.map((exDetail, i) => {
          const { exercise, label, sets } = exDetail;
          const headers = HEADERS[exercise.tracking_type] || HEADERS.strength;
          return (
            <div key={i} className="card sd-ex-card">
              <div className="sd-ex-header">
                <div className="sd-ex-name-group">
                  <span className="sd-ex-name">{exercise.name}</span>
                  {label && <span className="sd-ex-label">{label}</span>}
                </div>
                <span className={`tag tag-${exercise.muscle_group.toLowerCase()}`}>
                  {exercise.muscle_group}
                </span>
              </div>
              <table className="sd-sets-table">
                <thead>
                  <tr>
                    {headers.map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sets.map((set, si) => (
                    <SetRow key={si} set={set} trackingType={exercise.tracking_type} />
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
