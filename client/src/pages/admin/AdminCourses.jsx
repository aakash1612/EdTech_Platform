import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiStar, FiVideo, FiUsers } from "react-icons/fi";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/courses/all")
      .then(r => setCourses(r.data.courses))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const togglePublish = async (id) => {
    try {
      const { data } = await axios.put(`/admin/courses/${id}/publish`);
      setCourses(cs => cs.map(c => c._id === id ? { ...c, isPublished: data.course.isPublished } : c));
      toast.success(data.course.isPublished ? "Course published" : "Course unpublished");
    } catch { toast.error("Failed"); }
  };

  const toggleFeatured = async (id) => {
    try {
      const { data } = await axios.put(`/admin/courses/${id}/feature`);
      setCourses(cs => cs.map(c => c._id === id ? { ...c, isFeatured: data.course.isFeatured } : c));
      toast.success(data.course.isFeatured ? "Marked as featured" : "Removed from featured");
    } catch { toast.error("Failed"); }
  };

  const deleteCourse = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This will also delete all lectures.`)) return;
    try {
      await axios.delete(`/courses/${id}`);
      setCourses(cs => cs.filter(c => c._id !== id));
      toast.success("Course deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.6rem", marginBottom: 4 }}>Courses</h1>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>{courses.length} total courses</p>
        </div>
        <Link to="/admin/courses/new" className="btn btn-primary">
          <FiPlus /> New Course
        </Link>
      </div>

      {/* Search */}
      <input
        type="text" placeholder="Search courses..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 20, maxWidth: 340 }}
      />

      {/* Table */}
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", overflow: "hidden"
      }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: "48px 24px" }}>
            <div style={{ fontSize: 48 }}>📚</div>
            <h3>No courses found</h3>
            <Link to="/admin/courses/new" className="btn btn-primary" style={{ marginTop: 16 }}>
              <FiPlus /> Create First Course
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  {["Course", "Category", "Price", "Students", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "var(--text2)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((course, i) => (
                  <tr key={course._id} style={{ borderTop: "1px solid var(--border)", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 48, height: 36, borderRadius: 6, background: "var(--surface)", overflow: "hidden", flexShrink: 0 }}>
                          {course.thumbnail && (
                            <img src={course.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {course.title}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text3)" }}>{course.level} · {course.instructor}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="badge badge-primary" style={{ fontSize: 11 }}>{course.category}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                      {course.price === 0 ? <span className="badge badge-success">Free</span> : `₹${course.price.toLocaleString()}`}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text2)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <FiUsers size={13} /> {course.enrolledCount || 0}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span className={`badge ${course.isPublished ? "badge-success" : "badge-danger"}`} style={{ fontSize: 11 }}>
                          {course.isPublished ? "Published" : "Draft"}
                        </span>
                        {course.isFeatured && <span className="badge badge-warning" style={{ fontSize: 11 }}>Featured</span>}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <ActionBtn icon={<FiEdit2 size={13} />} title="Edit"
                          onClick={() => navigate(`/admin/courses/${course._id}/edit`)} />
                        <ActionBtn icon={<FiVideo size={13} />} title="Lectures"
                          onClick={() => navigate(`/admin/courses/${course._id}/lectures`)} />
                        <ActionBtn
                          icon={course.isPublished ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                          title={course.isPublished ? "Unpublish" : "Publish"}
                          onClick={() => togglePublish(course._id)}
                          color={course.isPublished ? "var(--accent)" : "var(--text2)"}
                        />
                        <ActionBtn
                          icon={<FiStar size={13} />} title={course.isFeatured ? "Unfeature" : "Feature"}
                          onClick={() => toggleFeatured(course._id)}
                          color={course.isFeatured ? "var(--accent)" : "var(--text2)"}
                        />
                        <ActionBtn icon={<FiTrash2 size={13} />} title="Delete"
                          onClick={() => deleteCourse(course._id, course.title)}
                          color="#FF6B6B" hoverBg="rgba(255,107,107,0.1)" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const ActionBtn = ({ icon, title, onClick, color, hoverBg }) => (
  <button onClick={onClick} title={title}
    style={{
      width: 30, height: 30, borderRadius: 6, border: "1px solid var(--border2)",
      background: "transparent", color: color || "var(--text2)", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.15s"
    }}
    onMouseEnter={e => { e.currentTarget.style.background = hoverBg || "var(--surface2)"; e.currentTarget.style.color = color || "var(--text)"; }}
    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = color || "var(--text2)"; }}
  >{icon}</button>
);
