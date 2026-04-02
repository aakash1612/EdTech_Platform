import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { FiCheck, FiPlay, FiChevronLeft, FiMenu, FiX, FiExternalLink } from "react-icons/fi";

export default function CourseLearn() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, fetchMe } = useAuth();
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [courseRes, lecturesRes, progressRes] = await Promise.all([
          axios.get(`/courses/${courseId}`),
          axios.get(`/lectures/course/${courseId}`),
          axios.get(`/student/course/${courseId}/progress`).catch(() => ({ data: { progress: 0, completedLectures: [] } }))
        ]);
        setCourse(courseRes.data.course);
        setLectures(lecturesRes.data.lectures);
        setCompleted(progressRes.data.completedLectures || []);
        setProgress(progressRes.data.progress || 0);
        if (lecturesRes.data.lectures.length > 0) {
          setCurrentLecture(lecturesRes.data.lectures[0]);
        }
      } catch (err) {
        toast.error("Failed to load course");
        navigate("/my-courses");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, navigate]);

  const markComplete = async (lectureId) => {
    if (completed.includes(lectureId)) return;
    try {
      const { data } = await axios.post(`/lectures/${lectureId}/complete`);
      setCompleted(prev => [...prev, lectureId]);
      setProgress(data.progress);
      if (data.progress === 100) {
        toast.success("🎉 Course completed! Congratulations!");
        fetchMe();
      }
    } catch {}
  };

  const selectLecture = (lec) => {
    if (lec.locked) return toast.error("Purchase the course to access this lecture");
    setCurrentLecture(lec);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const getYoutubeId = (url) => {
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?\/]+)/);
    return match ? match[1] : null;
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const sections = [...new Set(lectures.map(l => l.section || "Main Content"))];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* Top Bar */}
      <div style={{
        height: 58, background: "var(--bg2)", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/my-courses" style={{ color: "var(--text2)", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <FiChevronLeft /> Back
          </Link>
          <div style={{ width: 1, height: 18, background: "var(--border)" }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>
            {course?.title}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <div className="progress-bar" style={{ width: 120 }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span style={{ color: "var(--text2)" }}>{progress}%</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 8, color: "var(--text)", padding: "6px 10px", cursor: "pointer" }}>
            {sidebarOpen ? <FiX size={16} /> : <FiMenu size={16} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Video Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {currentLecture ? (
            <>
              {/* Video Player */}
              <div style={{ background: "#000", flex: "0 0 auto" }}>
                {currentLecture.videoType === "youtube" || getYoutubeId(currentLecture.videoUrl) ? (
                  <div style={{ aspectRatio: "16/9", maxHeight: "calc(100vh - 200px)" }}>
                    <ReactPlayer
                      url={currentLecture.videoUrl}
                      width="100%" height="100%"
                      controls
                      onEnded={() => markComplete(currentLecture._id)}
                      config={{ youtube: { playerVars: { modestbranding: 1, rel: 0 } } }}
                    />
                  </div>
                ) : (
                  <div style={{
                    aspectRatio: "16/9", maxHeight: "calc(100vh - 200px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "linear-gradient(135deg, #0F0F1A, #181829)", flexDirection: "column", gap: 16
                  }}>
                    <div style={{ fontSize: 64 }}>🎬</div>
                    <p style={{ color: "var(--text2)", fontSize: 14 }}>Video: {currentLecture.videoUrl}</p>
                    <a href={currentLecture.videoUrl} target="_blank" rel="noreferrer"
                      className="btn btn-primary btn-sm">
                      <FiExternalLink /> Open Video
                    </a>
                  </div>
                )}
              </div>

              {/* Lecture Info */}
              <div style={{ padding: 20, borderTop: "1px solid var(--border)", flex: 1, overflowY: "auto" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
                  <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 6 }}>{currentLecture.title}</h2>
                    <p style={{ color: "var(--text2)", fontSize: 14 }}>Section: {currentLecture.section}</p>
                  </div>
                  <button
                    onClick={() => markComplete(currentLecture._id)}
                    className={`btn btn-sm ${completed.includes(currentLecture._id) ? "btn-success" : "btn-outline"}`}
                    style={completed.includes(currentLecture._id) ? { background: "rgba(107,203,119,0.15)", color: "var(--success)", border: "1px solid rgba(107,203,119,0.3)" } : {}}
                  >
                    <FiCheck /> {completed.includes(currentLecture._id) ? "Completed" : "Mark Complete"}
                  </button>
                </div>

                {currentLecture.description && (
                  <p style={{ color: "var(--text2)", lineHeight: 1.7, fontSize: 14, marginBottom: 16 }}>
                    {currentLecture.description}
                  </p>
                )}

                {currentLecture.resources?.length > 0 && (
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Resources</h4>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {currentLecture.resources.map((r, i) => (
                        <a key={i} href={r.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                          <FiExternalLink size={13} /> {r.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Lecture Button */}
                {(() => {
                  const idx = lectures.findIndex(l => l._id === currentLecture._id);
                  const next = lectures[idx + 1];
                  return next && !next.locked ? (
                    <button onClick={() => selectLecture(next)} className="btn btn-primary btn-sm" style={{ marginTop: 20 }}>
                      Next: {next.title} →
                    </button>
                  ) : null;
                })()}
              </div>
            </>
          ) : (
            <div className="flex-center" style={{ flex: 1, flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 64 }}>📚</div>
              <h3>Select a lecture to begin</h3>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{
            width: 320, borderLeft: "1px solid var(--border)",
            background: "var(--bg2)", overflowY: "auto", flexShrink: 0
          }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Course Content</h4>
              <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
                {completed.length}/{lectures.length} completed
              </p>
            </div>

            {sections.map(section => (
              <div key={section}>
                <div style={{
                  padding: "10px 16px", background: "var(--surface)",
                  fontSize: 12, fontWeight: 700, color: "var(--text2)",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  borderBottom: "1px solid var(--border)"
                }}>{section}</div>

                {lectures.filter(l => (l.section || "Main Content") === section).map((lec) => {
                  const isCurrent = currentLecture?._id === lec._id;
                  const isDone = completed.includes(lec._id);
                  return (
                    <div key={lec._id}
                      onClick={() => selectLecture(lec)}
                      style={{
                        padding: "12px 16px", borderBottom: "1px solid var(--border)",
                        cursor: lec.locked ? "not-allowed" : "pointer",
                        background: isCurrent ? "rgba(108,99,255,0.1)" : "transparent",
                        borderLeft: isCurrent ? "3px solid var(--primary)" : "3px solid transparent",
                        transition: "all 0.15s"
                      }}
                      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = "var(--surface)"; }}
                      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                          background: isDone ? "var(--success)" : lec.locked ? "var(--surface2)" : "rgba(108,99,255,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: isDone ? "#fff" : lec.locked ? "var(--text3)" : "var(--primary)",
                          fontSize: 10
                        }}>
                          {isDone ? <FiCheck size={11} /> : lec.locked ? <span>🔒</span> : <FiPlay size={10} />}
                        </div>
                        <div>
                          <div style={{
                            fontSize: 13, fontWeight: isCurrent ? 600 : 400,
                            color: lec.locked ? "var(--text3)" : isCurrent ? "var(--primary)" : "var(--text)"
                          }}>{lec.title}</div>
                          {lec.duration > 0 && (
                            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                              {Math.floor(lec.duration / 60)}:{String(lec.duration % 60).padStart(2, "0")} min
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          [data-sidebar] { position: fixed; right: 0; top: 58px; bottom: 0; z-index: 200; }
        }
      `}</style>
    </div>
  );
}
