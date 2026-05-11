import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import "./WorkoutList.css";

export default function WorkoutList() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // workout to delete
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/api/workouts")
      .then(setWorkouts)
      .finally(() => setLoading(false));
  }, []);

  const openModal = () => {
    setNewName("");
    setNewDesc("");
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const created = await api.post("/api/workouts", {
        name: newName.trim(),
        description: newDesc.trim() || null,
        exercises: [],
      });
      setWorkouts((prev) => [created, ...prev]);
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await api.del(`/api/workouts/${confirmDelete.id}`);
    setWorkouts((prev) => prev.filter((w) => w.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="wl-page">
      <div className="page-header">
        <h1>Workouts</h1>
        <button className="btn-primary" onClick={openModal}>
          + New Workout
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>New Workout</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Push Day"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving || !newName.trim()}>
                  {saving ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {workouts.length === 0 ? (
        <div className="wl-empty">
          <p>No workouts yet.</p>
          <button className="btn-primary" onClick={openModal}>
            Create your first workout
          </button>
        </div>
      ) : (
        <div className="wl-grid">
          {workouts.map((w) => (
            <div key={w.id} className="wl-card">
              <div className="wl-card-top">
                <h3 onClick={() => navigate(`/builder/${w.id}`)}>{w.name}</h3>
                <span className="ex-badge">{w.exercise_count} ex</span>
              </div>
              {w.description && <p className="wl-desc">{w.description}</p>}
              <div className="wl-card-footer">
                <span className="wl-date">
                  {new Date(w.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <div className="wl-actions">
                  <button
                    className="btn-delete btn-sm"
                    onClick={() => setConfirmDelete(w)}
                    title="Delete workout"
                  >
                    Delete
                  </button>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => navigate(`/builder/${w.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => navigate(`/do/${w.id}`)}
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Workout</h2>
            <p style={{ marginBottom: 20, color: "#475569", fontSize: 14 }}>
              Delete <strong>{confirmDelete.name}</strong>? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="btn-delete" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
