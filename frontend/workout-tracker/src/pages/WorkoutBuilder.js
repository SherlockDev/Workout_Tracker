import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import "./WorkoutBuilder.css";

const GROUPS = ["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"];

export default function WorkoutBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [allExercises, setAllExercises] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState([]); // [{exercise_id, exercise, sets, reps, weight}]
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterGroup, setFilterGroup] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const exs = await api.get("/api/exercises");
      setAllExercises(exs);
      if (id) {
        const w = await api.get(`/api/workouts/${id}`);
        setName(w.name);
        setDescription(w.description ?? "");
        setSelected(
          w.exercises.map((we) => ({
            exercise_id: we.exercise_id,
            exercise: we.exercise,
            sets: we.sets,
            reps: we.reps,
            weight: we.weight ?? "",
          }))
        );
      }
      setLoading(false);
    };
    load().catch(console.error);
  }, [id]);

  const selectedIds = new Set(selected.map((s) => s.exercise_id));

  const filtered = allExercises.filter(
    (ex) =>
      !selectedIds.has(ex.id) &&
      (filterGroup === "All" || ex.muscle_group === filterGroup) &&
      ex.name.toLowerCase().includes(search.toLowerCase())
  );

  const addExercise = (ex) =>
    setSelected((prev) => [
      ...prev,
      { exercise_id: ex.id, exercise: ex, sets: 3, reps: 10, weight: "" },
    ]);

  const removeExercise = (idx) =>
    setSelected((prev) => prev.filter((_, i) => i !== idx));

  const updateField = (idx, field, value) =>
    setSelected((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex))
    );

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post("/api/workouts", {
        name: name.trim(),
        description: description.trim() || null,
        exercises: selected.map((ex, i) => ({
          exercise_id: ex.exercise_id,
          sets: Number(ex.sets) || 3,
          reps: Number(ex.reps) || 10,
          weight: ex.weight !== "" ? Number(ex.weight) : null,
          order: i,
        })),
      });
      navigate("/workouts");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="builder-page">
      <div className="page-header">
        <h1>{id ? "View Workout" : "Build Workout"}</h1>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || !name.trim()}
        >
          {saving ? "Saving…" : "Save Workout"}
        </button>
      </div>

      <div className="builder-layout">
        {/* Left column */}
        <div className="builder-left">
          <div className="card">
            <div className="form-group">
              <label>Workout Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Push Day"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>

          <div className="card">
            <h2>
              Selected Exercises{" "}
              <span className="sel-count">{selected.length}</span>
            </h2>

            {selected.length === 0 ? (
              <p className="empty-state">Add exercises from the panel on the right.</p>
            ) : (
              <ul className="sel-list">
                {selected.map((ex, idx) => (
                  <li key={idx} className="sel-item">
                    <div className="sel-top">
                      <span className="sel-name">{ex.exercise.name}</span>
                      <span className={`tag tag-${ex.exercise.muscle_group.toLowerCase()}`}>
                        {ex.exercise.muscle_group}
                      </span>
                      <button className="btn-remove" onClick={() => removeExercise(idx)}>
                        ✕
                      </button>
                    </div>
                    <div className="sel-inputs">
                      <label>
                        Sets
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={ex.sets}
                          onChange={(e) => updateField(idx, "sets", e.target.value)}
                        />
                      </label>
                      <label>
                        Reps
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={ex.reps}
                          onChange={(e) => updateField(idx, "reps", e.target.value)}
                        />
                      </label>
                      <label>
                        Weight (kg)
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={ex.weight}
                          onChange={(e) => updateField(idx, "weight", e.target.value)}
                          placeholder="—"
                        />
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="card exercise-panel">
          <h2>Exercises</h2>
          <input
            className="ex-search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="filter-chips">
            {GROUPS.map((g) => (
              <button
                key={g}
                className={`chip${filterGroup === g ? " active" : ""}`}
                onClick={() => setFilterGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <ul className="ex-pool">
            {filtered.map((ex) => (
              <li key={ex.id} className="ex-pool-item" onClick={() => addExercise(ex)}>
                <span className="ex-pool-name">{ex.name}</span>
                <span className={`tag tag-${ex.muscle_group.toLowerCase()}`}>
                  {ex.muscle_group}
                </span>
                <span className="btn-add-ex">+</span>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="empty-state">No exercises found</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
