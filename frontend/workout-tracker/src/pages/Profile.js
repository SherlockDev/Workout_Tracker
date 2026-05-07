import { useState, useEffect } from "react";
import { api } from "../api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import "./Profile.css";

const TIMEFRAMES = [
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "1 year", days: 365 },
];

const MEASURE_FIELDS = [
  { key: "arms_cm", label: "Arms (cm)" },
  { key: "chest_cm", label: "Chest (cm)" },
  { key: "waist_cm", label: "Waist (cm)" },
  { key: "hips_cm", label: "Hips (cm)" },
  { key: "thighs_cm", label: "Thighs (cm)" },
];

const BLANK_MEASURE = { arms_cm: "", chest_cm: "", waist_cm: "", hips_cm: "", thighs_cm: "", notes: "" };

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [weightDays, setWeightDays] = useState(30);
  const [weightHistory, setWeightHistory] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", age: "", height_cm: "" });
  const [weightInput, setWeightInput] = useState("");
  const [measureForm, setMeasureForm] = useState(BLANK_MEASURE);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/profile"),
      api.get("/api/profile/measurements"),
    ]).then(([prof, meas]) => {
      setProfile(prof);
      setMeasurements(meas);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    api.get(`/api/profile/weight?days=${weightDays}`).then(setWeightHistory);
  }, [weightDays]);

  const openEdit = () => {
    setProfileForm({
      name: profile?.name ?? "",
      age: profile?.age ?? "",
      height_cm: profile?.height_cm ?? "",
    });
    setEditModal(true);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.put("/api/profile", {
        name: profileForm.name || null,
        age: profileForm.age ? parseInt(profileForm.age, 10) : null,
        height_cm: profileForm.height_cm ? parseFloat(profileForm.height_cm) : null,
      });
      setProfile(updated);
      setEditModal(false);
    } finally {
      setSaving(false);
    }
  };

  const logWeight = async (e) => {
    e.preventDefault();
    if (!weightInput) return;
    setSaving(true);
    try {
      await api.post("/api/profile/weight", { weight_kg: parseFloat(weightInput) });
      setWeightInput("");
      const updated = await api.get(`/api/profile/weight?days=${weightDays}`);
      setWeightHistory(updated);
    } finally {
      setSaving(false);
    }
  };

  const logMeasurement = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      MEASURE_FIELDS.forEach(({ key }) => {
        if (measureForm[key]) payload[key] = parseFloat(measureForm[key]);
      });
      if (measureForm.notes) payload.notes = measureForm.notes;
      const created = await api.post("/api/profile/measurements", payload);
      setMeasurements((prev) => [created, ...prev]);
      setMeasureForm(BLANK_MEASURE);
    } finally {
      setSaving(false);
    }
  };

  const chartData = weightHistory.map((w) => ({
    date: new Date(w.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    weight: w.weight_kg,
  }));

  const latestMeasurement = measurements[0] || null;

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Profile</h1>
      </div>

      <div className="card profile-card">
        <div className="profile-info">
          <div className="profile-avatar">
            {profile?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="profile-details">
            <h2>{profile?.name || "Name not set"}</h2>
            <div className="profile-stats">
              {profile?.age && <span><strong>{profile.age}</strong> yrs</span>}
              {profile?.height_cm && <span><strong>{profile.height_cm}</strong> cm</span>}
            </div>
          </div>
        </div>
        <button className="btn-secondary" onClick={openEdit}>Edit Profile</button>
      </div>

      <div className="card weight-card">
        <div className="weight-card-top">
          <div>
            <h2>Weight</h2>
            <p className="card-subtitle">Body weight over time</p>
          </div>
          <div className="filter-chips">
            {TIMEFRAMES.map(({ label, days }) => (
              <button
                key={days}
                className={`chip${weightDays === days ? " active" : ""}`}
                onClick={() => setWeightDays(days)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 13 }}
                formatter={(v) => [`${v} kg`, "Weight"]}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#weightGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#10b981" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="empty-state">No weight data for this period.</p>
        )}

        <form className="log-weight-form" onSubmit={logWeight}>
          <input
            type="number"
            min="0"
            step="0.1"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="Weight (kg)"
            className="weight-input"
          />
          <button type="submit" className="btn-primary btn-sm" disabled={!weightInput || saving}>
            Log Weight
          </button>
        </form>
      </div>

      <div className="card measurements-card">
        <h2>Body Measurements</h2>
        <p className="card-subtitle">Log measurements to track changes over time</p>

        {latestMeasurement && (
          <div className="latest-measurements">
            <p className="latest-label">
              Latest —{" "}
              {new Date(latestMeasurement.date).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
            <div className="measure-grid">
              {MEASURE_FIELDS.map(({ key, label }) =>
                latestMeasurement[key] ? (
                  <div key={key} className="measure-item">
                    <span className="measure-val">{latestMeasurement[key]}</span>
                    <span className="measure-label">{label.split(" ")[0]}</span>
                  </div>
                ) : null
              )}
            </div>
            {latestMeasurement.notes && (
              <p className="measure-notes">{latestMeasurement.notes}</p>
            )}
          </div>
        )}

        <form className="measure-form" onSubmit={logMeasurement}>
          <div className="measure-inputs">
            {MEASURE_FIELDS.map(({ key, label }) => (
              <div key={key} className="form-group">
                <label>{label}</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={measureForm[key]}
                  onChange={(e) =>
                    setMeasureForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder="cm"
                />
              </div>
            ))}
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={measureForm.notes}
              onChange={(e) =>
                setMeasureForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Any notes about this measurement…"
              rows={2}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Log Measurement"}
          </button>
        </form>
      </div>

      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Your name"
                />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={profileForm.age}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, age: e.target.value }))
                  }
                  placeholder="Years"
                />
              </div>
              <div className="form-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  min="50"
                  max="300"
                  step="0.1"
                  value={profileForm.height_cm}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, height_cm: e.target.value }))
                  }
                  placeholder="cm"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
