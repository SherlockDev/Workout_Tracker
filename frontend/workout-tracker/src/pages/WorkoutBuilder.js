import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import "./WorkoutBuilder.css";

const GROUPS = ["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core", "Cardio"];

export default function WorkoutBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [allExercises, setAllExercises] = useState([]);
  const [pbWeights, setPbWeights] = useState({}); // { exercise_id: best_weight } for strength exercises
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState([]); // [{exercise_id, exercise, sets, reps, weight, label, weightMode, weightPct}]
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterGroup, setFilterGroup] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const [exs, pbs] = await Promise.all([
        api.get("/api/exercises"),
        api.get("/api/profile/personal-bests"),
      ]);
      setAllExercises(exs);

      const pbMap = {};
      for (const pb of pbs) {
        if (pb.tracking_type === "strength") {
          const vals = [pb.auto_weight, pb.manual_weight].filter((v) => v != null);
          if (vals.length > 0) pbMap[pb.exercise_id] = Math.max(...vals);
        }
      }
      setPbWeights(pbMap);

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
            label: we.label ?? "",
            weightMode: "custom",
            weightPct: 80,
            target_distance_km: we.target_distance_km ?? "",
            target_dur_mins: we.target_duration_secs != null ? Math.floor(we.target_duration_secs / 60) : "",
            target_dur_secs: we.target_duration_secs != null ? we.target_duration_secs % 60 : "",
            target_calories: we.target_calories ?? "",
            target_custom: we.target_custom ?? "",
          }))
        );
      }
      setLoading(false);
    };
    load().catch(console.error);
  }, [id]);

  const filtered = allExercises.filter(
    (ex) =>
      (filterGroup === "All" || ex.muscle_group === filterGroup) &&
      ex.name.toLowerCase().includes(search.toLowerCase())
  );

  const addExercise = (ex) =>
    setSelected((prev) => [
      ...prev,
      {
        exercise_id: ex.id, exercise: ex, sets: 3, reps: 10, weight: "", label: "",
        weightMode: "custom", weightPct: 80,
        target_distance_km: "", target_dur_mins: "", target_dur_secs: "",
        target_calories: "", target_custom: "",
      },
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
        exercises: selected.map((ex, i) => {
          let weight = ex.weight !== "" ? Number(ex.weight) : null;
          if (ex.weightMode === "pct" && pbWeights[ex.exercise_id] != null) {
            weight = Math.round(pbWeights[ex.exercise_id] * (Number(ex.weightPct) || 80) / 100 * 2) / 2;
          }
          const durSecs =
            ((Number(ex.target_dur_mins) || 0) * 60 + (Number(ex.target_dur_secs) || 0)) || null;
          return {
            exercise_id: ex.exercise_id,
            sets: Number(ex.sets) || 3,
            reps: Number(ex.reps) || 10,
            weight,
            order: i,
            label: ex.label.trim() || null,
            target_distance_km: ex.target_distance_km !== "" ? Number(ex.target_distance_km) : null,
            target_duration_secs: durSecs,
            target_calories: ex.target_calories !== "" ? Number(ex.target_calories) : null,
            target_custom: ex.target_custom !== "" ? Number(ex.target_custom) : null,
          };
        }),
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
                    <div className="sel-label-row">
                      <input
                        className="sel-label-input"
                        value={ex.label}
                        onChange={(e) => updateField(idx, "label", e.target.value)}
                        placeholder="Label (e.g. Warm-up, Working Sets)"
                      />
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
                      {ex.exercise.tracking_type === "strength" && (
                        <>
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
                            <div className="sel-weight-label-row">
                              <span>Weight</span>
                              <div className="sel-weight-tabs">
                                <button
                                  type="button"
                                  className={`sel-wtab${ex.weightMode === "custom" ? " active" : ""}`}
                                  onClick={() => updateField(idx, "weightMode", "custom")}
                                >kg</button>
                                <button
                                  type="button"
                                  className={`sel-wtab${ex.weightMode === "pct" ? " active" : ""}`}
                                  onClick={() => updateField(idx, "weightMode", "pct")}
                                >%</button>
                              </div>
                            </div>
                            {ex.weightMode === "pct" ? (
                              pbWeights[ex.exercise_id] != null ? (
                                <div className="sel-pct-row">
                                  <input
                                    type="number"
                                    min="1"
                                    max="200"
                                    value={ex.weightPct}
                                    onChange={(e) => updateField(idx, "weightPct", e.target.value)}
                                    className="sel-pct-input"
                                  />
                                  <span className="sel-pct-result">
                                    % = {Math.round(pbWeights[ex.exercise_id] * (Number(ex.weightPct) || 80) / 100 * 2) / 2} kg
                                  </span>
                                </div>
                              ) : (
                                <span className="sel-no-pb">No PB set — add one in Profile</span>
                              )
                            ) : (
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={ex.weight}
                                onChange={(e) => updateField(idx, "weight", e.target.value)}
                                placeholder="—"
                              />
                            )}
                          </label>
                        </>
                      )}
                      {(ex.exercise.tracking_type === "distance_pace" ||
                        ex.exercise.tracking_type === "distance_calories") && (
                        <label>
                          Distance (km)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ex.target_distance_km}
                            onChange={(e) => updateField(idx, "target_distance_km", e.target.value)}
                            placeholder="—"
                          />
                        </label>
                      )}
                      {(ex.exercise.tracking_type === "distance_pace" ||
                        ex.exercise.tracking_type === "duration") && (
                        <>
                          <label>
                            Min
                            <input
                              type="number"
                              min="0"
                              value={ex.target_dur_mins}
                              onChange={(e) => updateField(idx, "target_dur_mins", e.target.value)}
                              placeholder="0"
                            />
                          </label>
                          <label>
                            Sec
                            <input
                              type="number"
                              min="0"
                              max="59"
                              value={ex.target_dur_secs}
                              onChange={(e) => updateField(idx, "target_dur_secs", e.target.value)}
                              placeholder="00"
                            />
                          </label>
                        </>
                      )}
                      {ex.exercise.tracking_type === "distance_calories" && (
                        <label>
                          Calories
                          <input
                            type="number"
                            min="0"
                            value={ex.target_calories}
                            onChange={(e) => updateField(idx, "target_calories", e.target.value)}
                            placeholder="—"
                          />
                        </label>
                      )}
                      {ex.exercise.tracking_type === "custom" && (
                        <label>
                          {ex.exercise.custom_metric_label || "Value"}
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={ex.target_custom}
                            onChange={(e) => updateField(idx, "target_custom", e.target.value)}
                            placeholder="—"
                          />
                        </label>
                      )}
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
