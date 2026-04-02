import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import CourseCard from "../components/common/CourseCard";
import { FiArrowRight, FiPlay, FiAward, FiUsers, FiBookOpen, FiStar } from "react-icons/fi";

const CATEGORIES = [
  { name: "Web Development", icon: "💻" },
  { name: "Machine Learning", icon: "🤖" },
  { name: "Data Science", icon: "📊" },
  { name: "Design", icon: "🎨" },
  { name: "DevOps", icon: "⚙️" },
  { name: "Mobile Development", icon: "📱" },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/courses/featured")
      .then(r => setFeatured(r.data.courses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(160deg, #0F0F1A 0%, #181829 50%, #0F0F1A 100%)",
        padding: "90px 20px 80px", position: "relative", overflow: "hidden"
      }}>
        {/* Glow blobs */}
        <div style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)",
          top: -100, left: "60%", transform: "translateX(-50%)", pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,107,0.08) 0%, transparent 70%)",
          bottom: 0, left: "20%", pointerEvents: "none"
        }} />

        <div className="container" style={{ position: "relative", maxWidth: 750, margin: "0 auto", textAlign: "center" }}>
          <div className="fade-up">
            <span style={{
              display: "inline-block", background: "rgba(108,99,255,0.15)", color: "var(--primary)",
              border: "1px solid rgba(108,99,255,0.3)", borderRadius: 100, padding: "6px 18px",
              fontSize: 13, fontWeight: 500, marginBottom: 24
            }}>🚀 The Future of Learning is Here</span>

            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
              fontWeight: 800, lineHeight: 1.1, marginBottom: 20
            }}>
              Learn Without <span style={{
                background: "linear-gradient(135deg, var(--primary), #FF6B6B)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>Limits</span>
            </h1>

            <p style={{ fontSize: "clamp(15px, 2.5vw, 18px)", color: "var(--text2)", marginBottom: 36, lineHeight: 1.7 }}>
              Master in-demand skills with expert-led courses. From web development to machine learning — 
              your journey to mastery starts today.
            </p>

            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/courses" className="btn btn-primary btn-lg">
                Explore Courses <FiArrowRight />
              </Link>
              <Link to="/register" className="btn btn-ghost btn-lg">
                <FiPlay size={16} /> Start Free
              </Link>
            </div>

            {/* Stats */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20,
              marginTop: 56, paddingTop: 40, borderTop: "1px solid var(--border)"
            }}>
              {[
                { icon: <FiUsers />, val: "50,000+", label: "Students" },
                { icon: <FiBookOpen />, val: "200+", label: "Courses" },
                { icon: <FiAward />, val: "4.8★", label: "Avg Rating" },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", fontFamily: "var(--font-display)" }}>{s.val}</div>
                  <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    {s.icon} {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: "64px 20px", background: "var(--bg)" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 6 }}>Browse Categories</h2>
              <p style={{ color: "var(--text2)", fontSize: 14 }}>Find the perfect course for your goals</p>
            </div>
            <Link to="/courses" className="btn btn-outline btn-sm">View All</Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
            {CATEGORIES.map((cat, i) => (
              <Link key={i} to={`/courses?category=${encodeURIComponent(cat.name)}`}
                style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "20px 16px", textAlign: "center",
                  textDecoration: "none", transition: "all 0.2s", display: "block"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(108,99,255,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>{cat.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section style={{ padding: "64px 20px", background: "var(--bg2)" }}>
        <div className="container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 6 }}>Featured Courses</h2>
              <p style={{ color: "var(--text2)", fontSize: 14 }}>Handpicked by our expert team</p>
            </div>
            <Link to="/courses" className="btn btn-outline btn-sm">See All <FiArrowRight /></Link>
          </div>

          {loading ? (
            <div className="loading-page"><div className="spinner" /></div>
          ) : featured.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48 }}>📚</div>
              <h3>No courses yet</h3>
              <p>Courses will appear here once added by admin</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {featured.map(c => <CourseCard key={c._id} course={c} />)}
            </div>
          )}
        </div>
      </section>

      {/* Why EduLearn */}
      <section style={{ padding: "72px 20px", background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <h2 style={{ textAlign: "center", fontSize: "1.7rem", fontWeight: 700, marginBottom: 12 }}>
            Why Choose EduLearn?
          </h2>
          <p style={{ textAlign: "center", color: "var(--text2)", marginBottom: 48 }}>
            Everything you need to level up your career
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
            {[
              { icon: "🎯", title: "Expert Instructors", desc: "Learn from industry professionals with real-world experience" },
              { icon: "📱", title: "Learn Anywhere", desc: "Fully responsive — desktop, tablet, or mobile" },
              { icon: "🏆", title: "Certificates", desc: "Earn certificates to boost your career prospects" },
              { icon: "♾️", title: "Lifetime Access", desc: "Buy once, access forever — including all updates" },
            ].map((f, i) => (
              <div key={i} style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: 24, textAlign: "center"
              }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>{f.icon}</div>
                <h4 style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>{f.title}</h4>
                <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "72px 20px", textAlign: "center",
        background: "linear-gradient(135deg, rgba(108,99,255,0.1), rgba(255,107,107,0.05))",
        borderTop: "1px solid var(--border)"
      }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 800, marginBottom: 16 }}>
            Ready to start learning?
          </h2>
          <p style={{ color: "var(--text2)", marginBottom: 32, fontSize: 16 }}>
            Join thousands of students already learning on EduLearn. Start your journey today — it's free!
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: "var(--bg2)", borderTop: "1px solid var(--border)",
        padding: "32px 20px", textAlign: "center",
        color: "var(--text3)", fontSize: 13
      }}>
        <div className="container">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--text)", marginBottom: 8 }}>
            Edu<span style={{ color: "var(--primary)" }}>Learn</span>
          </div>
          <p>© 2025 EduLearn. Built with ❤️ using MERN Stack.</p>
        </div>
      </footer>
    </div>
  );
}
