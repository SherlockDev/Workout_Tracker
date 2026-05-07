import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconList = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="6" x2="20" y2="6" />
    <line x1="9" y1="12" x2="20" y2="12" />
    <line x1="9" y1="18" x2="20" y2="18" />
    <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const IconBuilder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const IconExercises = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6.5" cy="12" r="2" />
    <circle cx="17.5" cy="12" r="2" />
    <line x1="1" y1="12" x2="4.5" y2="12" />
    <line x1="8.5" y1="12" x2="15.5" y2="12" />
    <line x1="19.5" y1="12" x2="23" y2="12" />
    <line x1="6.5" y1="10" x2="6.5" y2="5" />
    <line x1="17.5" y1="10" x2="17.5" y2="5" />
    <line x1="6.5" y1="14" x2="6.5" y2="19" />
    <line x1="17.5" y1="14" x2="17.5" y2="19" />
  </svg>
);

const IconProfile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const NAV = [
  { to: "/", icon: <IconDashboard />, label: "Dashboard", end: true },
  { to: "/workouts", icon: <IconList />, label: "Workouts" },
  { to: "/builder", icon: <IconBuilder />, label: "Builder" },
  { to: "/exercises", icon: <IconExercises />, label: "Exercises" },
  { to: "/profile", icon: <IconProfile />, label: "Profile" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">💪</span>
        <span className="brand-name">WorkoutTracker</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
