import { Link } from "react-router-dom";
import { FiStar, FiUsers, FiClock, FiHeart } from "react-icons/fi";

export default function CourseCard({ course, onWishlist, isWishlisted }) {
  const discount = course.originalPrice > course.price
    ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
    : 0;

  return (
    <div className="course-card" style={{
      background: "var(--bg2)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden",
      transition: "all 0.25s", cursor: "pointer",
      display: "flex", flexDirection: "column"
    }}>
      {/* Thumbnail */}
      <Link to={`/courses/${course._id}`} style={{ display: "block", position: "relative" }}>
        <div style={{ paddingTop: "56.25%", position: "relative", background: "var(--surface)", overflow: "hidden" }}>
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
              onError={e => { e.target.style.display = "none"; }}
            />
          ) : (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, #1E1E32, #252538)",
              fontSize: 48, color: "var(--primary)"
            }}>📚</div>
          )}
          {course.isFeatured && (
            <span style={{
              position: "absolute", top: 10, left: 10,
              background: "var(--accent)", color: "#1a1a00",
              fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6
            }}>⭐ FEATURED</span>
          )}
          {discount > 0 && (
            <span style={{
              position: "absolute", top: 10, right: 10,
              background: "#FF6B6B", color: "#fff",
              fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6
            }}>{discount}% OFF</span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span className="badge badge-primary" style={{ fontSize: 11 }}>{course.category}</span>
          <span className="badge" style={{ fontSize: 11, background: "var(--surface)", color: "var(--text2)" }}>{course.level}</span>
        </div>

        <Link to={`/courses/${course._id}`} style={{ textDecoration: "none" }}>
          <h3 style={{
            fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
          }}>{course.title}</h3>
        </Link>

        <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 10, flex: 1 }}>
          {course.instructor}
        </p>

        {/* Rating */}
        {course.rating?.count > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 13 }}>
              {Number(course.rating.average).toFixed(1)}
            </span>
            <div className="stars">
              {[1,2,3,4,5].map(i => (
                <span key={i} style={{ color: i <= Math.round(course.rating.average) ? "var(--accent)" : "var(--text3)" }}>★</span>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "var(--text3)" }}>({course.rating.count})</span>
          </div>
        )}

        {/* Meta */}
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text3)", marginBottom: 14 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <FiUsers size={12} /> {course.enrolledCount?.toLocaleString() || 0}
          </span>
          {course.duration && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <FiClock size={12} /> {course.duration}
            </span>
          )}
        </div>

        {/* Price & Action */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <div>
            {course.price === 0 ? (
              <span className="badge badge-free" style={{ fontSize: 14, padding: "4px 12px" }}>FREE</span>
            ) : (
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>
                  ₹{course.price.toLocaleString()}
                </span>
                {course.originalPrice > course.price && (
                  <span style={{ fontSize: 13, color: "var(--text3)", textDecoration: "line-through" }}>
                    ₹{course.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
          {onWishlist && (
            <button
              onClick={(e) => { e.preventDefault(); onWishlist(course._id); }}
              style={{
                background: "var(--surface)", border: "1px solid var(--border2)",
                color: isWishlisted ? "#FF6B6B" : "var(--text2)",
                width: 34, height: 34, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <FiHeart size={16} fill={isWishlisted ? "#FF6B6B" : "none"} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        .course-card:hover { border-color: rgba(108,99,255,0.3); transform: translateY(-3px); box-shadow: 0 12px 40px rgba(108,99,255,0.1); }
        .course-card:hover img { transform: scale(1.04); }
      `}</style>
    </div>
  );
}
