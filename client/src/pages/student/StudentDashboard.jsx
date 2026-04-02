import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { FiBook, FiTrendingUp, FiCheckCircle, FiHeart, FiPlay, FiArrowRight } from "react-icons/fi";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/student/dashboard")
      .then(r => setDashboard(r.data.dashboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const stats = dashboard?.stats || {};
  const enrolledCourses = dashboard?.enrolledCourses || [];

  return (
    <div style={{ minHeight: "100vh", padding: "40px 0" }}>
      <div className="container">
        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 6 }}>
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "var(--text2)" }}>Continue your learning journey</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 36 }}>
          {[
            { icon: <FiBook />, label: "Enrolled", val: stats.enrolled || 0, color: "var(--primary)", bg: "rgba(108,99,255,0.1)" },
            { icon: <FiTrendingUp />, label: "In Progress", val: stats.inProgress || 0, color: "#FFD93D", bg: "rgba(255,217,61,0.1)" },
            { icon: <FiCheckCircle />, label: "Completed", val: stats.completed || 0, color: "var(--success)", bg: "rgba(107,203,119,0.1)" },
            { icon: <FiHeart />, label: "Wishlist", val: stats.wishlist || 0, color: "var(--secondary)", bg: "rgba(255,107,107,0.1)" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: 20
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: s.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: s.color, fontSize: 20, marginBottom: 12
              }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-display)" }}>{s.val}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* My Courses */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontWeight: 700, fontSize: "1.2rem" }}>My Courses</h2>
            <Link to="/my-courses" className="btn btn-ghost btn-sm">View All <FiArrowRight /></Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div style={{
              background: "var(--bg2)", border: "1px dashed var(--border2)",
              borderRadius: "var(--radius-lg)", padding: "48px 24px", textAlign: "center"
            }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
              <h3 style={{ marginBottom: 8 }}>No courses yet</h3>
              <p style={{ color: "var(--text2)", marginBottom: 20, fontSize: 14 }}>Start learning today — explore our courses</p>
              <Link to="/courses" className="btn btn-primary">Browse Courses</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {enrolledCourses.slice(0, 6).map((enrollment) => {
                const c = enrollment.course;
                if (!c) return null;
                return (
                  <div key={c._id} style={{
                    background: "var(--bg2)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius)", overflow: "hidden"
                  }}>
                    <div style={{ position: "relative", paddingTop: "52%", background: "var(--surface)" }}>
                      {c.thumbnail ? (
                        <img src={c.thumbnail} alt={c.title}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                          onError={e => e.target.style.display = "none"} />
                      ) : (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>📖</div>
                      )}
                    </div>
                    <div style={{ padding: 16 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {c.title}
                      </h4>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>
                          <span>Progress</span>
                          <span>{enrollment.progress || 0}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${enrollment.progress || 0}%` }} />
                        </div>
                      </div>
                      <button onClick={() => navigate(`/learn/${c._id}`)} className="btn btn-primary btn-sm btn-full">
                        <FiPlay size={13} /> {enrollment.progress > 0 ? "Continue" : "Start Learning"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Wishlist */}
        {dashboard?.wishlist?.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: "1.2rem" }}>❤️ Wishlist</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {dashboard.wishlist.map(c => (
                <Link key={c._id} to={`/courses/${c._id}`} style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: 16, textDecoration: "none",
                  display: "flex", gap: 12, alignItems: "center"
                }}>
                  <div style={{ width: 60, height: 44, borderRadius: 8, background: "var(--surface)", overflow: "hidden", flexShrink: 0 }}>
                    {c.thumbnail && <img src={c.thumbnail} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                      {c.price === 0 ? "Free" : `₹${c.price?.toLocaleString()}`}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
