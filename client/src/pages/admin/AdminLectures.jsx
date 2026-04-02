import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiEdit2, FiArrowLeft, FiSave, FiX } from "react-icons/fi";

export default function AdminLectures() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editLecture, setEditLecture] = useState(null);

  const empty = {
    title: "", description: "", videoUrl: "", videoType: "youtube",
    order: 1, section: "Main Content", isPreview: false, duration: 0
  };
  const [form, setForm] = useState(empty);

  useEffect(() => {
    Promise.all([
      axios.get(`/courses/${courseId}`),
      axios.get(`/lectures/course/${courseId}`)
    ]).then(([cRes, lRes]) => {
      setCourse(cRes.data.course);
      setLectures(lRes.data.lectures);
    }).catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [courseId]);

  const openAdd = () => {
    setEditLecture(null);
    setForm({ ...empty, order: lectures.length + 1 });
    setShowForm(true);
  };

  const openEdit = (lec) => {
    setEditLecture(lec);
    setForm({
      title: lec.title, description: lec.description || "",
      videoUrl: lec.videoUrl, videoType: lec.videoType || "youtube",
      order: lec.order, section: lec.section || "Main Content",
      isPreview: lec.isPreview || false, duration: lec.duration || 0
    });
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title || !form.videoUrl) return toast.error("Title and video URL required");
    try {
      if (editLecture) {
        const { data } = await axios.put(`/lectures/${editLecture._id}`, form);
        setLectures(ls => ls.map(l => l._id === editLecture._id ? data.lecture : l));
        toast.success("Lecture updated");
      } else {
        const { data } = await axios.post("/lectures", { ...form, courseId });
        setLectures(ls => [...ls, data.lecture].sort((a, b) => a.order - b.order));
        toast.success("Lecture added");
      }
      setShowForm(false);
      setEditLecture(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const deleteLecture = async (lid, title) => {
    if (!window.confirm(`Delete lecture "${title}"?`)) return;
    try {
      await axios.delete(`/lectures/${lid}`);
      setLectures(ls => ls.filter(l => l._id !== lid));
      toast.success("Lecture deleted");
    } catch { toast.error("Failed to delete"); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <button onClick={() => navigate("/admin/courses")} className="btn btn-ghost btn-sm"><FiArrowLeft /></button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontWeight: 800, fontSize: "1.5rem" }}>Lectures</h1>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>{course?.title}</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary"><FiPlus /> Add Lecture</button>
      </div>

      {/* Lecture List */}
      <div style={{ marginBottom: 24 }}>
        {lectures.length === 0 ? (
          <div style={{
            background: "var(--bg2)", border: "1px dashed var(--border2)",
            borderRadius: "var(--radius)", padding: "48px 24px", textAlign: "center"
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <h3>No lectures yet</h3>
            <p style={{ color: "var(--text2)", marginBottom: 16 }}>Add your first lecture to get started</p>
            <button onClick={openAdd} className="btn btn-primary"><FiPlus /> Add First Lecture</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...new Set(lectures.map(l => l.section || "Main Content"))].map(section => (
              <div key={section}>
                <div style={{
                  padding: "8px 16px", background: "var(--surface)",
                  borderRadius: 8, fontSize: 13, fontWeight: 700,
                  color: "var(--text2)", letterSpacing: "0.03em", marginBottom: 6,
                  border: "1px solid var(--border)"
                }}>📂 {section}</div>
                {lectures.filter(l => (l.section || "Main Content") === section).map((lec, i) => (
                  <div key={lec._id} style={{
                    background: "var(--bg2)", border: "1px solid var(--border)",
                    borderRadius: 8, padding: "14px 16px", marginBottom: 6,
                    display: "flex", alignItems: "center", gap: 14
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                      background: "rgba(108,99,255,0.15)", color: "var(--primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 13
                    }}>{lec.order}</div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{lec.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3, display: "flex", gap: 12 }}>
                        <span>{lec.videoType || "youtube"}</span>
                        {lec.duration > 0 && <span>{Math.floor(lec.duration / 60)}m</span>}
                        {lec.isPreview && <span style={{ color: "var(--success)" }}>Preview</span>}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEdit(lec)} style={iconBtn}>
                        <FiEdit2 size={13} />
                      </button>
                      <button onClick={() => deleteLecture(lec._id, lec.title)} style={{ ...iconBtn, color: "#FF6B6B" }}>
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>{editLecture ? "Edit Lecture" : "Add Lecture"}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}><FiX /></button>
            </div>

            <form onSubmit={save}>
              <div className="form-group">
                <label>Lecture Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Introduction to React Hooks" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief overview of this lecture..." rows={2} style={{ resize: "vertical" }} />
              </div>
              <div className="form-group">
                <label>Video URL *</label>
                <input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=... or any URL" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Video Type</label>
                  <select value={form.videoType} onChange={e => setForm(f => ({ ...f, videoType: e.target.value }))}>
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="external">External URL</option>
                    <option value="upload">Uploaded File</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration (seconds)</label>
                  <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 0 }))} min="0" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Section</label>
                  <input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="Main Content" />
                </div>
                <div className="form-group">
                  <label>Order</label>
                  <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 1 }))} min="1" />
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 20 }}>
                <input type="checkbox" checked={form.isPreview} onChange={e => setForm(f => ({ ...f, isPreview: e.target.checked }))}
                  style={{ width: 16, height: 16 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Free Preview</div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>Non-enrolled students can watch this lecture</div>
                </div>
              </label>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" className="btn btn-primary">
                  <FiSave /> {editLecture ? "Update" : "Add Lecture"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtn = {
  width: 30, height: 30, borderRadius: 6, border: "1px solid var(--border2)",
  background: "transparent", color: "var(--text2)", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center"
};
