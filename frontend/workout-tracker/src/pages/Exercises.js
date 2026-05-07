import { useState, useEffect, useMemo } from "react";
import { api } from "../api";
import "./Exercises.css";

const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"];
const ALL_GROUPS = ["All", ...MUSCLE_GROUPS];

const TRACKING_TYPES = [
  { value: "strength", label: "Strength" },
  { value: "distance_pace", label: "Distance & Pace" },
  { value: "distance_calories", label: "Distance & Calories" },
  { value: "duration", label: "Duration" },
  { value: "custom", label: "Custom" },
];

const TRACKING_LABELS = {
  strength: "Strength",
  distance_pace: "Dist & Pace",
  distance_calories: "Dist & Cal",
  duration: "Duration",
  custom: "Custom",
};

const BLANK_FORM = {
  name: "",
  muscle_group: "Chest",
  description: "",
  tracking_type: "strength",
  custom_metric_label: "",
};

export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState("All");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/api/exercises").then(setExercises).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      exercises.filter(
        (ex) =>
          (filterGroup === "All" || ex.muscle_group === filterGroup) &&
          ex.name.toLowerCase().includes(search.toLowerCase())
      ),
    [exercises, filterGroup, search]
  );

  const openCreate = () => {
    setForm(BLANK_FORM);
    setModal("create");
  };

  const openEdit = (ex) => {
    setForm({
      name: ex.name,
      muscle_group: ex.muscle_group,
      description: ex.description ?? "",
      tracking_type: ex.tracking_type ?? "strength",
      custom_metric_label: ex.custom_metric_label ?? "",
    });
    setModal(ex);
  };

  const closeModal = () => setModal(null);
  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        muscle_group: form.muscle_group,
        description: form.description || null,
        tracking_type: form.tracking_type,
        custom_metric_label: form.tracking_type === "custom" ? form.custom_metric_label || null : null,
      };
      if (modal === "create") {
        const created = await api.post("/api/exercises", payload);
        setExercises((prev) => [...prev, created]);
      } else {
        const updated = await api.put(`/api/exercises/${modal.id}`, payload);
        setExercises((prev) => prev.map((ex) => (ex.id === updated.id ? updated : ex)));
      }
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  const isEditing = modal && modal !== "create";

  return (
    <div className="ex-page">
      <div className="page-header">
        <h1>Exercises</h1>
        <button className="btn-primary" onClick={openCreate}>
          + Add Exercise
        </button>
      </div>

      <div className="card">
        <div className="ex-controls">
          <input
            className="ex-search"
            placeholder="Search exercises…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="filter-chips">
            {ALL_GROUPS.map((g) => (
              <button
                key={g}
                className={`chip${filterGroup === g ? " active" : ""}`}
                onClick={() => setFilterGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <table className="ex-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Group</th>
              <th>Type</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ex) => (
              <tr key={ex.id}>
                <td className="ex-name-cell">{ex.name}</td>
                <td>
                  <span className={`tag tag-${ex.muscle_group.toLowerCase()}`}>
                    {ex.muscle_group}
                  </span>
                </td>
                <td className="ex-type-cell">
                  {TRACKING_LABELS[ex.tracking_type] ?? "Strength"}
                </td>
                <td className="ex-desc-cell">
                  {ex.description ? (
                    <span className="ex-desc-preview">{ex.description}</span>
                  ) : (
                    <span className="ex-no-desc">No description</span>
                  )}
                </td>
                <td>
                  <button className="btn-secondary btn-sm" onClick={() => openEdit(ex)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="ex-empty-row">
                  No exercises found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{isEditing ? `Edit — ${modal.name}` : "New Exercise"}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g. Bench Press"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label>Muscle Group</label>
                <select
                  value={form.muscle_group}
                  onChange={(e) => setField("muscle_group", e.target.value)}
                >
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tracking Type</label>
                <select
                  value={form.tracking_type}
                  onChange={(e) => setField("tracking_type", e.target.value)}
                >
                  {TRACKING_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              {form.tracking_type === "custom" && (
                <div className="form-group">
                  <label>Custom Metric Label</label>
                  <input
                    value={form.custom_metric_label}
                    onChange={(e) => setField("custom_metric_label", e.target.value)}
                    placeholder="e.g. reps, calories, level…"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Describe the movement, technique cues, common mistakes…"
                  rows={5}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving || !form.name.trim()}
                >
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
