import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiSave, FiArrowLeft, FiPlus, FiX } from "react-icons/fi";

const CATEGORIES = ["Web Development", "Mobile Development", "Data Science", "Machine Learning", "DevOps", "Design", "Business", "Marketing", "Photography", "Music", "Other"];

export default function AdminCourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState({
    title: "", description: "", shortDescription: "",
    instructor: "", category: "Web Development", level: "Beginner",
    price: 0, originalPrice: 0, thumbnail: "",
    language: "English", duration: "",
    requirements: [""], whatYouLearn: [""], tags: [],
    isPublished: false, isFeatured: false
  });

  useEffect(() => {
    if (isEdit) {
      axios.get(`/courses/${id}`)
        .then(r => {
          const c = r.data.course;
          setForm({
            title: c.title || "", description: c.description || "",
            shortDescription: c.shortDescription || "",
            instructor: c.instructor || "", category: c.category || "Web Development",
            level: c.level || "Beginner", price: c.price || 0,
            originalPrice: c.originalPrice || 0, thumbnail: c.thumbnail || "",
            language: c.language || "English", duration: c.duration || "",
            requirements: c.requirements?.length ? c.requirements : [""],
            whatYouLearn: c.whatYouLearn?.length ? c.whatYouLearn : [""],
            tags: c.tags || [], isPublished: c.isPublished || false,
            isFeatured: c.isFeatured || false
          });
        })
        .catch(() => toast.error("Course not found"))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const updateList = (key, idx, val) => {
    const arr = [...form[key]];
    arr[idx] = val;
    set(key, arr);
  };

  const addListItem = (key) => set(key, [...form[key], ""]);
  const removeListItem = (key, idx) => set(key, form[key].filter((_, i) => i !== idx));

  const addTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim()))
        set("tags", [...form.tags, tagInput.trim().toLowerCase()]);
      setTagInput("");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.instructor || !form.category)
      return toast.error("Fill in all required fields");

    setSaving(true);
    const payload = {
      ...form,
      requirements: form.requirements.filter(r => r.trim()),
      whatYouLearn: form.whatYouLearn.filter(r => r.trim()),
      price: Number(form.price),
      originalPrice: Number(form.originalPrice)
    };

    try {
      if (isEdit) {
        await axios.put(`/courses/${id}`, payload);
        toast.success("Course updated!");
      } else {
        const { data } = await axios.post("/courses", payload);
        toast.success("Course created!");
        navigate(`/admin/courses/${data.course._id}/lectures`);
        return;
      }
      navigate("/admin/courses");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <button onClick={() => navigate("/admin/courses")} className="btn btn-ghost btn-sm">
          <FiArrowLeft />
        </button>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.5rem" }}>{isEdit ? "Edit Course" : "New Course"}</h1>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>{isEdit ? "Update course details" : "Create a new course"}</p>
        </div>
      </div>

      <form onSubmit={submit}>
        {/* Basic Info */}
        <Card title="Basic Information">
          <div className="form-group">
            <label>Course Title *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Complete React Developer Course" required />
          </div>
          <div className="form-group">
            <label>Short Description</label>
            <input value={form.shortDescription} onChange={e => set("shortDescription", e.target.value)} placeholder="One-line summary (max 300 chars)" maxLength={300} />
          </div>
          <div className="form-group">
            <label>Full Description *</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Detailed course description..." rows={5} required style={{ resize: "vertical" }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Instructor Name *</label>
              <input value={form.instructor} onChange={e => set("instructor", e.target.value)} placeholder="e.g. John Doe" required />
            </div>
            <div className="form-group">
              <label>Language</label>
              <input value={form.language} onChange={e => set("language", e.target.value)} placeholder="English" />
            </div>
          </div>
        </Card>

        {/* Category & Level */}
        <Card title="Category & Level">
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Level</label>
              <select value={form.level} onChange={e => set("level", e.target.value)}>
                {["Beginner", "Intermediate", "Advanced"].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card title="Pricing">
          <div className="form-row">
            <div className="form-group">
              <label>Price (₹) *</label>
              <input type="number" min="0" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0 for free" />
            </div>
            <div className="form-group">
              <label>Original Price (₹) — for discount display</label>
              <input type="number" min="0" value={form.originalPrice} onChange={e => set("originalPrice", e.target.value)} />
            </div>
          </div>
        </Card>

        {/* Media */}
        <Card title="Media">
          <div className="form-group">
            <label>Thumbnail URL</label>
            <input value={form.thumbnail} onChange={e => set("thumbnail", e.target.value)} placeholder="https://images.unsplash.com/..." />
            {form.thumbnail && (
              <img src={form.thumbnail} alt="Thumbnail preview"
                style={{ marginTop: 10, height: 100, borderRadius: 8, objectFit: "cover" }}
                onError={e => e.target.style.display = "none"} />
            )}
          </div>
          <div className="form-group">
            <label>Duration (e.g. "12h 30m")</label>
            <input value={form.duration} onChange={e => set("duration", e.target.value)} placeholder="Self-paced" />
          </div>
        </Card>

        {/* What you'll learn */}
        <Card title="What Students Will Learn">
          {form.whatYouLearn.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={item} onChange={e => updateList("whatYouLearn", i, e.target.value)} placeholder={`Learning outcome ${i + 1}`} style={{ flex: 1 }} />
              {form.whatYouLearn.length > 1 && (
                <button type="button" onClick={() => removeListItem("whatYouLearn", i)}
                  style={{ background: "none", border: "none", color: "#FF6B6B", cursor: "pointer", padding: "0 8px" }}>
                  <FiX />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addListItem("whatYouLearn")} className="btn btn-ghost btn-sm">
            <FiPlus /> Add Item
          </button>
        </Card>

        {/* Requirements */}
        <Card title="Requirements">
          {form.requirements.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={item} onChange={e => updateList("requirements", i, e.target.value)} placeholder={`Requirement ${i + 1}`} style={{ flex: 1 }} />
              {form.requirements.length > 1 && (
                <button type="button" onClick={() => removeListItem("requirements", i)}
                  style={{ background: "none", border: "none", color: "#FF6B6B", cursor: "pointer", padding: "0 8px" }}>
                  <FiX />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addListItem("requirements")} className="btn btn-ghost btn-sm">
            <FiPlus /> Add Requirement
          </button>
        </Card>

        {/* Tags */}
        <Card title="Tags">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {form.tags.map(tag => (
              <span key={tag} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(108,99,255,0.15)", color: "var(--primary)",
                padding: "4px 12px", borderRadius: 100, fontSize: 13
              }}>
                {tag}
                <button type="button" onClick={() => set("tags", form.tags.filter(t => t !== tag))}
                  style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
              </span>
            ))}
          </div>
          <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
            placeholder="Type a tag and press Enter..." style={{ maxWidth: 300 }} />
        </Card>

        {/* Settings */}
        <Card title="Settings">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { key: "isPublished", label: "Published", desc: "Make this course visible to students" },
              { key: "isFeatured", label: "Featured", desc: "Show on homepage featured section" },
            ].map(s => (
              <label key={s.key} style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
                <div
                  onClick={() => set(s.key, !form[s.key])}
                  style={{
                    width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                    background: form[s.key] ? "var(--primary)" : "var(--surface2)",
                    position: "relative", transition: "background 0.2s", cursor: "pointer"
                  }}
                >
                  <div style={{
                    position: "absolute", top: 3, left: form[s.key] ? 22 : 2,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "#fff", transition: "left 0.2s"
                  }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>{s.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <FiSave /> {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Course"}
          </button>
          <button type="button" onClick={() => navigate("/admin/courses")} className="btn btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const Card = ({ title, children }) => (
  <div style={{
    background: "var(--bg2)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", padding: 24, marginBottom: 20
  }}>
    <h3 style={{ fontWeight: 700, marginBottom: 18, fontSize: "1rem", paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>{title}</h3>
    {children}
  </div>
);
