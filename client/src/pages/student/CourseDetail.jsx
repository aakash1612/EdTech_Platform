import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import PaymentModal from "../../components/common/PaymentModal";
import { FiStar, FiUsers, FiClock, FiPlay, FiLock, FiCheck, FiArrowLeft } from "react-icons/fi";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isEnrolled, fetchMe } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    axios.get(`/courses/${id}`)
      .then(r => setCourse(r.data.course))
      .catch(() => toast.error("Course not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const enrolled = isEnrolled(id);

  const handleEnroll = () => {
    if (!user) return navigate("/login");
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    toast.success("Enrolled successfully! 🎉");
    await fetchMe();
    navigate(`/learn/${id}`);
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!course) return (
    <div className="empty-state" style={{ minHeight: "80vh" }}>
      <div style={{ fontSize: 56 }}>😕</div>
      <h3>Course not found</h3>
      <Link to="/courses" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Courses</Link>
    </div>
  );

  const discount = course.originalPrice > course.price
    ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0F0F1A, #181829)",
        borderBottom: "1px solid var(--border)", padding: "40px 20px"
      }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "start" }}>
          <div>
            <Link to="/courses" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text2)", fontSize: 13, marginBottom: 16 }}>
              <FiArrowLeft size={14} /> Back to courses
            </Link>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <span className="badge badge-primary">{course.category}</span>
              <span className="badge" style={{ background: "var(--surface)", color: "var(--text2)" }}>{course.level}</span>
              {course.isFeatured && <span className="badge badge-warning">⭐ Featured</span>}
            </div>
            <h1 style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 800, marginBottom: 12 }}>{course.title}</h1>
            <p style={{ color: "var(--text2)", fontSize: 15, marginBottom: 16, lineHeight: 1.7 }}>
              {course.shortDescription || course.description?.slice(0, 160) + "..."}
            </p>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 14, color: "var(--text2)" }}>
              {course.rating?.count > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>{Number(course.rating.average).toFixed(1)}</span>
                  <span style={{ color: "var(--accent)" }}>{'★'.repeat(Math.round(course.rating.average))}</span>
                  <span style={{ color: "var(--text3)" }}>({course.rating.count} reviews)</span>
                </span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <FiUsers size={14} /> {course.enrolledCount?.toLocaleString() || 0} students
              </span>
              {course.duration && (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <FiClock size={14} /> {course.duration}
                </span>
              )}
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: "var(--text3)" }}>
              By <strong style={{ color: "var(--text2)" }}>{course.instructor}</strong> · {course.language || "English"}
            </p>
          </div>

          {/* Enrollment Card - Desktop */}
          <EnrollCard
            course={course} discount={discount} enrolled={enrolled}
            enrolling={enrolling} onEnroll={handleEnroll}
            onLearn={() => navigate(`/learn/${id}`)}
            className="desktop-only"
          />
        </div>
      </div>

      {/* Mobile Enroll Card */}
      <div style={{ padding: "20px", borderBottom: "1px solid var(--border)" }} className="mobile-enroll">
        <EnrollCard
          course={course} discount={discount} enrolled={enrolled}
          enrolling={enrolling} onEnroll={handleEnroll}
          onLearn={() => navigate(`/learn/${id}`)}
        />
      </div>

      {/* Tabs */}
      <div className="container" style={{ padding: "32px 20px" }}>
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 28 }}>
          {["overview", "curriculum", "reviews"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
                color: activeTab === tab ? "var(--primary)" : "var(--text2)",
                borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
                fontWeight: 500, fontSize: 14, transition: "all 0.2s", textTransform: "capitalize"
              }}>{tab}</button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 40 }}>
            <div>
              {course.whatYouLearn?.length > 0 && (
                <Section title="What you'll learn">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {course.whatYouLearn.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}>
                        <FiCheck style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }} />
                        <span style={{ color: "var(--text2)" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
              <Section title="About this course">
                <p style={{ color: "var(--text2)", lineHeight: 1.8, fontSize: 14 }}>{course.description}</p>
              </Section>
              {course.requirements?.length > 0 && (
                <Section title="Requirements">
                  <ul style={{ paddingLeft: 18 }}>
                    {course.requirements.map((r, i) => (
                      <li key={i} style={{ color: "var(--text2)", fontSize: 14, marginBottom: 6 }}>{r}</li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
            <div>
              <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20 }}>
                <h4 style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>Course Info</h4>
                {[
                  { label: "Level", val: course.level },
                  { label: "Duration", val: course.duration || "Self-paced" },
                  { label: "Lectures", val: `${course.lectures?.length || 0} videos` },
                  { label: "Language", val: course.language || "English" },
                  { label: "Students", val: (course.enrolledCount || 0).toLocaleString() },
                ].map((info, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "10px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none",
                    fontSize: 13
                  }}>
                    <span style={{ color: "var(--text3)" }}>{info.label}</span>
                    <span style={{ fontWeight: 500 }}>{info.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "curriculum" && (
          <CurriculumTab courseId={id} enrolled={enrolled} />
        )}

        {activeTab === "reviews" && (
          <ReviewsTab course={course} enrolled={enrolled} courseId={id} onUpdate={setCourse} />
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && course && (
        <PaymentModal
          course={course}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .mobile-enroll { display: none !important; }
        }
      `}</style>
    </div>
  );
}

const EnrollCard = ({ course, discount, enrolled, enrolling, onEnroll, onLearn }) => (
  <div style={{
    background: "var(--bg2)", border: "1px solid var(--border2)",
    borderRadius: "var(--radius-lg)", padding: 24, minWidth: 280, maxWidth: 340,
    boxShadow: "var(--shadow)"
  }}>
    {course.thumbnail && (
      <img src={course.thumbnail} alt={course.title}
        style={{ width: "100%", borderRadius: "var(--radius-sm)", marginBottom: 16, aspectRatio: "16/9", objectFit: "cover" }}
        onError={e => e.target.style.display = "none"} />
    )}
    <div style={{ marginBottom: 16 }}>
      {course.price === 0 ? (
        <span style={{ fontSize: 28, fontWeight: 800, color: "var(--success)" }}>FREE</span>
      ) : (
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 800 }}>₹{course.price.toLocaleString()}</span>
          {course.originalPrice > course.price && (
            <>
              <span style={{ color: "var(--text3)", textDecoration: "line-through", fontSize: 16 }}>
                ₹{course.originalPrice.toLocaleString()}
              </span>
              <span style={{ color: "var(--secondary)", fontWeight: 700 }}>{discount}% off</span>
            </>
          )}
        </div>
      )}
    </div>

    {enrolled ? (
      <button onClick={onLearn} className="btn btn-primary btn-full btn-lg">
        <FiPlay /> Continue Learning
      </button>
    ) : (
      <button onClick={onEnroll} disabled={enrolling} className="btn btn-primary btn-full btn-lg">
        {enrolling ? "Processing..." : course.price === 0 ? "Enroll for Free" : "Buy Now"}
      </button>
    )}

    <p style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", marginTop: 10 }}>
      {enrolled ? "You're enrolled ✓" : "30-day money-back guarantee"}
    </p>

    {!enrolled && (
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600, marginBottom: 8 }}>This course includes:</p>
        {[
          `${course.lectures?.length || 0} video lectures`,
          "Full lifetime access",
          "Certificate of completion",
          "Mobile & desktop access"
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>
            <FiCheck style={{ color: "var(--success)", flexShrink: 0 }} /> {item}
          </div>
        ))}
      </div>
    )}
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 14 }}>{title}</h3>
    {children}
  </div>
);

const CurriculumTab = ({ courseId, enrolled }) => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    axios.get(`/lectures/course/${courseId}`)
      .then(r => setLectures(r.data.lectures))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, user]);

  if (!user) return (
    <div className="empty-state">
      <div style={{ fontSize: 40 }}>🔒</div>
      <h3>Login to view curriculum</h3>
      <Link to="/login" className="btn btn-primary" style={{ marginTop: 12 }}>Login</Link>
    </div>
  );

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const sections = [...new Set(lectures.map(l => l.section || "Main Content"))];

  return (
    <div>
      <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
        {lectures.length} lectures · {enrolled ? "Full access" : "Preview available"}
      </p>
      {sections.map(section => (
        <div key={section} style={{ marginBottom: 20 }}>
          <div style={{
            background: "var(--surface)", padding: "10px 16px",
            borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: 14,
            marginBottom: 2, border: "1px solid var(--border)"
          }}>{section}</div>
          {lectures.filter(l => (l.section || "Main Content") === section).map((lec, i) => (
            <div key={lec._id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderBottom: "1px solid var(--border)",
              background: "var(--bg2)"
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: lec.locked ? "var(--surface2)" : "rgba(108,99,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: lec.locked ? "var(--text3)" : "var(--primary)"
              }}>
                {lec.locked ? <FiLock size={14} /> : <FiPlay size={14} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: lec.locked ? "var(--text3)" : "var(--text)" }}>
                  {lec.title}
                </div>
                {lec.isPreview && !lec.locked && (
                  <span className="badge badge-success" style={{ fontSize: 10, marginTop: 3 }}>Preview</span>
                )}
              </div>
              {lec.duration > 0 && (
                <span style={{ fontSize: 12, color: "var(--text3)" }}>{Math.floor(lec.duration / 60)}:{String(lec.duration % 60).padStart(2, "0")}</span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const ReviewsTab = ({ course, enrolled, courseId, onUpdate }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/courses/${courseId}/review`, form);
      onUpdate(data.course);
      toast.success("Review submitted!");
      setForm({ rating: 5, comment: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {enrolled && user && (
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, marginBottom: 24 }}>
          <h4 style={{ fontWeight: 600, marginBottom: 14 }}>Write a Review</h4>
          <form onSubmit={submitReview}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[1,2,3,4,5].map(r => (
                <button key={r} type="button" onClick={() => setForm(f => ({ ...f, rating: r }))}
                  style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer",
                    color: r <= form.rating ? "var(--accent)" : "var(--border2)" }}>★</button>
              ))}
            </div>
            <textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Share your experience..." rows={3} style={{ marginBottom: 10, resize: "vertical" }} />
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      )}

      {course.reviews?.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 36 }}>⭐</div>
          <h3>No reviews yet</h3>
          <p>Be the first to review this course</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {course.reviews?.map((rev, i) => (
            <div key={i} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary), #9D97FF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14, color: "#fff"
                }}>{rev.name?.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{rev.name}</div>
                  <div style={{ color: "var(--accent)", fontSize: 13 }}>{'★'.repeat(rev.rating)}</div>
                </div>
              </div>
              <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6 }}>{rev.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
