import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
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

const MAIN_NAV = [
  { to: "/", icon: <IconDashboard />, label: "Dashboard", end: true },
  { to: "/workouts", icon: <IconList />, label: "Workouts" },
  { to: "/builder", icon: <IconBuilder />, label: "Builder" },
  { to: "/exercises", icon: <IconExercises />, label: "Exercises" },
];

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function Sidebar() {
  const { profiles, activeProfile, switchProfile, createProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const p = await createProfile(newName.trim());
    setNewName("");
    setCreating(false);
    switchProfile(p);
    setOpen(false);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">💪</span>
        <span className="brand-name">WorkoutTracker</span>
      </div>

      <nav className="sidebar-nav">
        {MAIN_NAV.map(({ to, icon, label, end }) => (
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

      <div className="sidebar-bottom">
        <div className="profile-switcher">
          <button
            className="profile-switcher-btn"
            onClick={() => { setOpen((o) => !o); setCreating(false); }}
          >
            <span className="profile-avatar">{initials(activeProfile?.name)}</span>
            <span className="profile-switcher-name">{activeProfile?.name || "Profile"}</span>
            <span className="profile-switcher-chevron">▾</span>
          </button>

          {open && (
            <div className="profile-dropdown">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  className={`profile-option${p.id === activeProfile?.id ? " active" : ""}`}
                  onClick={() => { switchProfile(p); setOpen(false); }}
                >
                  <span className="profile-avatar sm">{initials(p.name)}</span>
                  <span>{p.name}</span>
                </button>
              ))}
              <div className="profile-dropdown-divider" />
              {creating ? (
                <form className="profile-create-form" onSubmit={handleCreate}>
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Profile name"
                    className="profile-create-input"
                  />
                  <button type="submit" className="profile-create-submit">Add</button>
                </form>
              ) : (
                <button className="profile-option new" onClick={() => setCreating(true)}>
                  <span className="profile-add-icon">+</span>
                  <span>New profile</span>
                </button>
              )}
            </div>
          )}
        </div>

        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <span className="nav-icon"><IconProfile /></span>
          <span>Profile</span>
        </NavLink>
      </div>
    </aside>
  );
}
