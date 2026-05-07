import { useNavigate } from "react-router-dom";
import "./DayWorkoutsModal.css";

export default function DayWorkoutsModal({ date, sessions, onClose }) {
  const navigate = useNavigate();

  const formatted = new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  const handleSelect = (id) => {
    onClose();
    navigate(`/sessions/${id}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal day-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{formatted}</h2>
        {sessions.length === 0 ? (
          <p className="empty-state">No workouts logged on this day.</p>
        ) : (
          <ul className="day-session-list">
            {sessions.map((s) => (
              <li key={s.id} className="day-session-item" onClick={() => handleSelect(s.id)}>
                <div className="day-session-name">{s.workout_name ?? "Custom Workout"}</div>
                <div className="day-session-meta">
                  {s.duration_minutes && <span>{s.duration_minutes} min</span>}
                  <div className="day-session-tags">
                    {s.muscle_groups.map((mg) => (
                      <span key={mg} className={`tag tag-${mg.toLowerCase()}`}>{mg}</span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button className="btn-secondary day-modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
