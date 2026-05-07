import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import MonthlyCalendar from "../components/MonthlyCalendar";
import BodyAreaChart from "../components/BodyAreaChart";
import DayWorkoutsModal from "../components/DayWorkoutsModal";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [calendarDates, setCalendarDates] = useState([]);
  const [monthSessions, setMonthSessions] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [bodyAreaStats, setBodyAreaStats] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [calLoading, setCalLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const minDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const viewMonthStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = viewDate.toLocaleString("default", { month: "long", year: "numeric" });

  const canGoPrev = viewDate > minDate;
  const canGoNext = viewDate < currentMonthDate;

  const goToPrev = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToNext = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  useEffect(() => {
    setCalLoading(true);
    Promise.all([
      api.get(`/api/sessions/calendar?month=${viewMonthStr}`),
      api.get(`/api/sessions?month=${viewMonthStr}&limit=50`),
    ])
      .then(([calendar, sessions]) => {
        setCalendarDates(calendar);
        setMonthSessions(sessions);
      })
      .finally(() => setCalLoading(false));
  }, [viewMonthStr]);

  useEffect(() => {
    Promise.all([
      api.get("/api/sessions?limit=6"),
      api.get("/api/sessions/body-areas?days=30"),
    ])
      .then(([sessions, bodyAreas]) => {
        setRecentSessions(sessions);
        setBodyAreaStats(bodyAreas);
      })
      .finally(() => setLoading(false));
  }, []);

  const daySessions = selectedDay
    ? monthSessions.filter((s) => s.date.split("T")[0] === selectedDay)
    : [];

  const dateLabel = now.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <span className="page-date">{dateLabel}</span>
      </div>

      <div className="dashboard-grid">
        <div className="card calendar-card">
          <div className="cal-nav">
            <button
              className="cal-nav-btn"
              onClick={goToPrev}
              disabled={!canGoPrev}
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="cal-nav-center">
              <h2>{monthLabel}</h2>
              <p className="card-subtitle">
                {calLoading
                  ? "Loading…"
                  : `${calendarDates.length} workout${calendarDates.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              className="cal-nav-btn"
              onClick={goToNext}
              disabled={!canGoNext}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
          <MonthlyCalendar
            workoutDates={calendarDates}
            year={viewDate.getFullYear()}
            month={viewDate.getMonth()}
            onDayClick={setSelectedDay}
          />
        </div>

        <div className="card chart-card">
          <h2>Body Areas</h2>
          <p className="card-subtitle">Last 30 days</p>
          <BodyAreaChart data={bodyAreaStats} />
        </div>

        <div className="card sessions-card">
          <h2>Recent Workouts</h2>
          {recentSessions.length === 0 ? (
            <p className="empty-state">No workouts logged yet.</p>
          ) : (
            <ul className="session-list">
              {recentSessions.map((s) => (
                <li
                  key={s.id}
                  className="session-item clickable"
                  onClick={() => navigate(`/sessions/${s.id}`)}
                >
                  <div className="session-info">
                    <span className="session-name">{s.workout_name ?? "Custom Workout"}</span>
                    <div className="session-tags">
                      {s.muscle_groups.map((mg) => (
                        <span key={mg} className={`tag tag-${mg.toLowerCase()}`}>{mg}</span>
                      ))}
                    </div>
                  </div>
                  <div className="session-meta">
                    <span className="session-date">
                      {new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                    {s.duration_minutes && (
                      <span className="session-duration">{s.duration_minutes} min</span>
                    )}
                    <span className="session-arrow">›</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {selectedDay && (
        <DayWorkoutsModal
          date={selectedDay}
          sessions={daySessions}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
