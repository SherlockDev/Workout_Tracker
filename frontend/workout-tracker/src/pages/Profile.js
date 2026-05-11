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

function fmtPaceSecs(secs) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

function fmtDuration(secs) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getBestValue(pb) {
  switch (pb.tracking_type) {
    case "strength": {
      const vals = [pb.auto_weight, pb.manual_weight].filter((v) => v != null);
      const best = vals.length > 0 ? Math.max(...vals) : null;
      return { display: best != null ? `${best} kg` : null, raw: best, secondary: null };
    }
    case "distance_pace": {
      const paceVals = [pb.auto_pace_secs_per_km, pb.manual_pace_secs_per_km].filter((v) => v != null);
      const bestPace = paceVals.length > 0 ? Math.min(...paceVals) : null;
      const distVals = [pb.auto_distance_km, pb.manual_distance_km].filter((v) => v != null);
      const bestDist = distVals.length > 0 ? Math.max(...distVals) : null;
      return {
        display: bestPace != null ? fmtPaceSecs(bestPace) : null,
        secondary: bestDist != null ? `${bestDist} km best distance` : null,
        raw: bestPace,
      };
    }
    case "distance_calories": {
      const vals = [pb.auto_distance_km, pb.manual_distance_km].filter((v) => v != null);
      const best = vals.length > 0 ? Math.max(...vals) : null;
      return { display: best != null ? `${best} km` : null, raw: best, secondary: null };
    }
    case "duration": {
      const vals = [pb.auto_duration_secs, pb.manual_duration_secs].filter((v) => v != null);
      const best = vals.length > 0 ? Math.max(...vals) : null;
      return { display: best != null ? fmtDuration(best) : null, raw: best, secondary: null };
    }
    case "custom": {
      const vals = [pb.auto_custom, pb.manual_custom].filter((v) => v != null);
      const best = vals.length > 0 ? Math.max(...vals) : null;
      const suffix = pb.custom_metric_label ? ` ${pb.custom_metric_label}` : "";
      return { display: best != null ? `${best}${suffix}` : null, raw: best, secondary: null };
    }
    default:
      return { display: null, raw: null, secondary: null };
  }
}

function initEditForm(pb) {
  switch (pb.tracking_type) {
    case "strength":
      return { weight: pb.manual_weight != null ? String(pb.manual_weight) : "" };
    case "distance_pace": {
      const p = pb.manual_pace_secs_per_km;
      return {
        paceMin: p ? String(Math.floor(p / 60)) : "",
        paceSec: p ? String(Math.round(p % 60)).padStart(2, "0") : "",
        distance_km: pb.manual_distance_km != null ? String(pb.manual_distance_km) : "",
      };
    }
    case "distance_calories":
      return { distance_km: pb.manual_distance_km != null ? String(pb.manual_distance_km) : "" };
    case "duration": {
      const d = pb.manual_duration_secs;
      return {
        durMin: d ? String(Math.floor(d / 60)) : "",
        durSec: d ? String(d % 60).padStart(2, "0") : "",
      };
    }
    case "custom":
      return { custom: pb.manual_custom != null ? String(pb.manual_custom) : "" };
    default:
      return {};
  }
}

function buildPbPayload(trackingType, form) {
  switch (trackingType) {
    case "strength":
      return { manual_weight: form.weight !== "" ? parseFloat(form.weight) : null };
    case "distance_pace": {
      const hasPace = form.paceMin !== "" || form.paceSec !== "";
      const secs = hasPace
        ? (parseInt(form.paceMin) || 0) * 60 + (parseInt(form.paceSec) || 0)
        : null;
      return {
        manual_pace_secs_per_km: secs || null,
        manual_distance_km: form.distance_km !== "" ? parseFloat(form.distance_km) : null,
      };
    }
    case "distance_calories":
      return { manual_distance_km: form.distance_km !== "" ? parseFloat(form.distance_km) : null };
    case "duration": {
      const hasDur = form.durMin !== "" || form.durSec !== "";
      const secs = hasDur
        ? (parseInt(form.durMin) || 0) * 60 + (parseInt(form.durSec) || 0)
        : null;
      return { manual_duration_secs: secs || null };
    }
    case "custom":
      return { manual_custom: form.custom !== "" ? parseFloat(form.custom) : null };
    default:
      return {};
  }
}

function PbEditInline({ pb, onSave, onCancel }) {
  const [form, setForm] = useState(() => initEditForm(pb));
  const [saving, setSaving] = useState(false);

  const u = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = buildPbPayload(pb.tracking_type, form);
      const updated = await api.put(`/api/profile/personal-bests/${pb.exercise_id}`, payload);
      onSave(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-edit-inline">
      <div className="pb-edit-header">
        <span className="pb-ex-name">{pb.exercise_name}</span>
        <span className="pb-edit-hint">Enter manual PB</span>
      </div>
      <div className="pb-edit-inputs">
        {pb.tracking_type === "strength" && (
          <label className="pb-edit-field">
            <span>Weight (kg)</span>
            <input type="number" min="0" step="0.5" value={form.weight} onChange={u("weight")} placeholder="0.0" />
          </label>
        )}
        {pb.tracking_type === "distance_pace" && (
          <>
            <label className="pb-edit-field">
              <span>Best pace (min/km)</span>
              <div className="pb-time-inputs">
                <input type="number" min="0" value={form.paceMin} onChange={u("paceMin")} placeholder="min" />
                <span>:</span>
                <input type="number" min="0" max="59" value={form.paceSec} onChange={u("paceSec")} placeholder="sec" />
              </div>
            </label>
            <label className="pb-edit-field">
              <span>Best distance (km)</span>
              <input type="number" min="0" step="0.01" value={form.distance_km} onChange={u("distance_km")} placeholder="0.0" />
            </label>
          </>
        )}
        {pb.tracking_type === "distance_calories" && (
          <label className="pb-edit-field">
            <span>Best distance (km)</span>
            <input type="number" min="0" step="0.01" value={form.distance_km} onChange={u("distance_km")} placeholder="0.0" />
          </label>
        )}
        {pb.tracking_type === "duration" && (
          <label className="pb-edit-field">
            <span>Best duration</span>
            <div className="pb-time-inputs">
              <input type="number" min="0" value={form.durMin} onChange={u("durMin")} placeholder="min" />
              <span>:</span>
              <input type="number" min="0" max="59" value={form.durSec} onChange={u("durSec")} placeholder="sec" />
            </div>
          </label>
        )}
        {pb.tracking_type === "custom" && (
          <label className="pb-edit-field">
            <span>{pb.custom_metric_label || "Value"}</span>
            <input type="number" min="0" step="any" value={form.custom} onChange={u("custom")} placeholder="0" />
          </label>
        )}
      </div>
      <div className="pb-edit-actions">
        <button className="btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        <button className="btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [weightDays, setWeightDays] = useState(30);
  const [weightHistory, setWeightHistory] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [personalBests, setPersonalBests] = useState([]);
  const [pbModalOpen, setPbModalOpen] = useState(false);
  const [pbModalExercises, setPbModalExercises] = useState([]);
  const [pbModalSearch, setPbModalSearch] = useState("");
  const [pbModalLoading, setPbModalLoading] = useState(false);
  const [editingPbId, setEditingPbId] = useState(null);
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
      api.get("/api/profile/personal-bests"),
    ]).then(([prof, meas, pbs]) => {
      setProfile(prof);
      setMeasurements(meas);
      setPersonalBests(pbs);
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

  const openPbModal = async () => {
    setPbModalOpen(true);
    if (pbModalExercises.length === 0) {
      setPbModalLoading(true);
      const exs = await api.get("/api/exercises");
      setPbModalExercises(exs);
      setPbModalLoading(false);
    }
  };

  const addPb = async (exercise) => {
    try {
      const pb = await api.post("/api/profile/personal-bests", { exercise_id: exercise.id });
      setPersonalBests((prev) =>
        [...prev, pb].sort((a, b) => a.exercise_name.localeCompare(b.exercise_name))
      );
    } catch {
      // already tracked — ignore
    }
    setPbModalOpen(false);
    setPbModalSearch("");
  };

  const updatePb = (updated) => {
    setPersonalBests((prev) =>
      prev.map((p) => (p.exercise_id === updated.exercise_id ? updated : p))
    );
    setEditingPbId(null);
  };

  const deletePb = async (exerciseId) => {
    await api.del(`/api/profile/personal-bests/${exerciseId}`);
    setPersonalBests((prev) => prev.filter((p) => p.exercise_id !== exerciseId));
    if (editingPbId === exerciseId) setEditingPbId(null);
  };

  const chartData = weightHistory.map((w) => ({
    date: new Date(w.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    weight: w.weight_kg,
  }));

  const latestMeasurement = measurements[0] || null;
  const trackedIds = new Set(personalBests.map((pb) => pb.exercise_id));
  const filteredModalExercises = pbModalExercises.filter(
    (ex) =>
      !trackedIds.has(ex.id) &&
      ex.name.toLowerCase().includes(pbModalSearch.toLowerCase())
  );

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

      {/* Personal Bests */}
      <div className="card pb-card">
        <div className="pb-card-top">
          <div>
            <h2>Personal Bests</h2>
            <p className="card-subtitle">Track your best performances — pulled from workouts or set manually</p>
          </div>
          <div className="pb-controls">
            <button className="btn-primary btn-sm" onClick={openPbModal}>+ Track</button>
          </div>
        </div>

        {personalBests.length === 0 ? (
          <p className="empty-state">No exercises tracked yet. Click "+ Track" to add one.</p>
        ) : (
          <ul className="pb-list">
            {personalBests.map((pb) => (
              <li key={pb.exercise_id} className="pb-item">
                {editingPbId === pb.exercise_id ? (
                  <PbEditInline
                    pb={pb}
                    onSave={updatePb}
                    onCancel={() => setEditingPbId(null)}
                  />
                ) : (
                  <div className="pb-row">
                    <div className="pb-ex-info">
                      <span className="pb-ex-name">{pb.exercise_name}</span>
                      <span className={`tag tag-${pb.muscle_group.toLowerCase()}`}>
                        {pb.muscle_group}
                      </span>
                    </div>
                    {(() => {
                      const { display, secondary } = getBestValue(pb);
                      return (
                        <div className="pb-values">
                          {display ? (
                            <>
                              <span className="pb-main">{display}</span>
                              {secondary && <span className="pb-secondary">{secondary}</span>}
                            </>
                          ) : (
                            <span className="pb-no-value">Not set — click ✎ to add</span>
                          )}
                        </div>
                      );
                    })()}
                    <div className="pb-actions">
                      <button
                        className="pb-btn-edit"
                        onClick={() => setEditingPbId(pb.exercise_id)}
                        title="Set manual PB"
                      >
                        ✎
                      </button>
                      <button
                        className="pb-btn-del"
                        onClick={() => deletePb(pb.exercise_id)}
                        title="Stop tracking"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Track Exercise Modal */}
      {pbModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => { setPbModalOpen(false); setPbModalSearch(""); }}
        >
          <div className="modal pb-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Track Exercise</h2>
            <input
              autoFocus
              className="pb-modal-search"
              placeholder="Search exercises…"
              value={pbModalSearch}
              onChange={(e) => setPbModalSearch(e.target.value)}
            />
            {pbModalLoading ? (
              <p className="page-loading" style={{ height: 80 }}>Loading…</p>
            ) : (
              <ul className="pb-modal-list">
                {filteredModalExercises.map((ex) => (
                  <li key={ex.id} className="pb-modal-item" onClick={() => addPb(ex)}>
                    <span className="pb-modal-name">{ex.name}</span>
                    <span className={`tag tag-${ex.muscle_group.toLowerCase()}`}>
                      {ex.muscle_group}
                    </span>
                  </li>
                ))}
                {filteredModalExercises.length === 0 && (
                  <li className="empty-state">
                    {pbModalSearch ? "No exercises match your search" : "All exercises are already tracked"}
                  </li>
                )}
              </ul>
            )}
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => { setPbModalOpen(false); setPbModalSearch(""); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
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
                  onChange={(e) => setProfileForm((p) => ({ ...p, age: e.target.value }))}
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
                  onChange={(e) => setProfileForm((p) => ({ ...p, height_cm: e.target.value }))}
                  placeholder="cm"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditModal(false)}>
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
