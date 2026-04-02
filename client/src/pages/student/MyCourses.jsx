// MyCourses.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiPlay, FiBook } from "react-icons/fi";
import { Link } from "react-router-dom";

export function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/student/my-courses")
      .then(r => setCourses(r.data.courses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div style={{ minHeight: "100vh", padding: "40px 0" }}>
      <div className="container">
        <h1 style={{ fontWeight: 800, fontSize: "1.8rem", marginBottom: 8 }}>My Courses</h1>
        <p style={{ color: "var(--text2)", marginBottom: 32 }}>{courses.length} courses enrolled</p>

        {courses.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 56 }}>📚</div>
            <h3>No courses yet</h3>
            <p>Explore and enroll in courses to start learning</p>
            <Link to="/courses" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Courses</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {courses.map((enrollment) => {
              const c = enrollment.course;
              if (!c) return null;
              return (
                <div key={c._id} style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: 20,
                  display: "flex", gap: 20, alignItems: "center"
                }}>
                  <div style={{ width: 100, height: 70, borderRadius: 8, background: "var(--surface)", overflow: "hidden", flexShrink: 0 }}>
                    {c.thumbnail
                      ? <img src={c.thumbnail} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📖</div>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{c.title}</h3>
                    <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 10 }}>{c.instructor} · {c.category}</p>
                    <div style={{ maxWidth: 300 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 5 }}>
                        <span>Progress</span><span>{enrollment.progress || 0}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${enrollment.progress || 0}%` }} />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/learn/${c._id}`)} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                    <FiPlay /> {enrollment.progress > 0 ? "Continue" : "Start"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyCourses;
