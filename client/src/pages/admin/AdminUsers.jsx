import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiSearch, FiToggleLeft, FiToggleRight, FiX, FiTrash2,
  FiUser, FiBook, FiShoppingBag, FiCalendar, FiEye,
  FiAlertTriangle, FiCheckCircle, FiLoader
} from "react-icons/fi";

// ─────────────────────────────────────────────────────
// Main AdminUsers page
// ─────────────────────────────────────────────────────
export function AdminUsers() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [selectedUser, setSelectedUser] = useState(null); // opens drawer

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    axios.get("/admin/users")
      .then(r => setUsers(r.data.users))
      .catch(() => toast.error("Failed to load students"))
      .finally(() => setLoading(false));
  };

  const toggleActive = async (id) => {
    try {
      const { data } = await axios.put(`/admin/users/${id}/toggle`);
      setUsers(us => us.map(u => u._id === id ? { ...u, isActive: data.user.isActive } : u));
      toast.success(data.user.isActive ? "✅ User activated" : "🚫 User blocked");
    } catch { toast.error("Failed to update user status"); }
  };

  // Called from drawer after revoke — refreshes count in table
  const handleEnrollmentRevoked = (userId, courseId) => {
    setUsers(us => us.map(u => {
      if (u._id !== userId) return u;
      return {
        ...u,
        enrolledCourses: u.enrolledCourses.filter(
          e => (e.course?._id || e.course) !== courseId
        )
      };
    }));
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div style={{ padding: 32 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.6rem", marginBottom: 4 }}>Students</h1>
        <p style={{ color: "var(--text2)", fontSize: 14 }}>
          {users.length} registered students · click a row to manage enrollments
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 360 }}>
        <FiSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
        <input
          type="text" placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 38 }}
        />
      </div>

      {/* Table */}
      <div style={{
        background: "var(--bg2)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", overflow: "hidden"
      }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <div style={{ fontSize: 48 }}>👥</div>
            <h3>No students found</h3>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  {["Student", "Email", "Enrollments", "Joined", "Status", "Actions"].map(h => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: "left",
                      fontSize: 12, color: "var(--text2)", fontWeight: 600
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr
                    key={user._id}
                    style={{ borderTop: "1px solid var(--border)", cursor: "pointer", transition: "background 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Name */}
                    <td style={{ padding: "12px 16px" }} onClick={() => setSelectedUser(user)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={user.name} />
                        <span style={{ fontWeight: 500 }}>{user.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: "12px 16px", color: "var(--text2)" }}
                      onClick={() => setSelectedUser(user)}>
                      {user.email}
                    </td>

                    {/* Enrollment count */}
                    <td style={{ padding: "12px 16px" }} onClick={() => setSelectedUser(user)}>
                      <span
                        className="badge badge-primary"
                        style={{ cursor: "pointer" }}
                        title="Click row to manage enrollments"
                      >
                        {user.enrolledCourses?.length || 0} courses
                      </span>
                    </td>

                    {/* Joined */}
                    <td style={{ padding: "12px 16px", color: "var(--text3)", fontSize: 13 }}
                      onClick={() => setSelectedUser(user)}>
                      {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }} onClick={() => setSelectedUser(user)}>
                      <span className={`badge ${user.isActive ? "badge-success" : "badge-danger"}`}>
                        {user.isActive ? "Active" : "Blocked"}
                      </span>
                    </td>

                    {/* Actions — stop propagation so row click doesn't fire */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedUser(user); }}
                          title="Manage enrollments"
                          style={iconBtnStyle}
                        >
                          <FiEye size={14} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); toggleActive(user._id); }}
                          title={user.isActive ? "Block user" : "Activate user"}
                          style={{
                            ...iconBtnStyle,
                            color: user.isActive ? "#FF6B6B" : "var(--success)",
                            borderColor: user.isActive ? "rgba(255,107,107,0.3)" : "rgba(107,203,119,0.3)"
                          }}
                        >
                          {user.isActive ? <FiToggleRight size={14} /> : <FiToggleLeft size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Enrollment Drawer */}
      {selectedUser && (
        <StudentDrawer
          userId={selectedUser._id}
          onClose={() => setSelectedUser(null)}
          onRevoked={handleEnrollmentRevoked}
          onToggleActive={(id, val) => {
            toggleActive(id);
            setSelectedUser(u => ({ ...u, isActive: !u.isActive }));
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// StudentDrawer — slide-in panel showing full profile
// + enrolled courses with per-course revoke buttons
// ─────────────────────────────────────────────────────
function StudentDrawer({ userId, onClose, onRevoked, onToggleActive }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [revoking, setRevoking] = useState(null); // courseId being revoked
  const [confirmId, setConfirmId] = useState(null); // courseId awaiting confirm

  useEffect(() => {
    axios.get(`/admin/users/${userId}`)
      .then(r => setData(r.data))
      .catch(() => toast.error("Failed to load student details"))
      .finally(() => setLoading(false));
  }, [userId]);

  const revokeEnrollment = async (courseId, courseTitle) => {
    setRevoking(courseId);
    setConfirmId(null);
    try {
      await axios.delete(`/admin/users/${userId}/enrollment/${courseId}`);
      toast.success(`Enrollment removed: ${courseTitle}`);
      // Update local state
      setData(d => ({
        ...d,
        user: {
          ...d.user,
          enrolledCourses: d.user.enrolledCourses.filter(
            e => (e.course?._id || e.course) !== courseId
          )
        },
        orders: d.orders.map(o =>
          (o.course?._id || o.course) === courseId && o.status === "completed"
            ? { ...o, status: "refunded" }
            : o
        )
      }));
      onRevoked(userId, courseId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke enrollment");
    } finally {
      setRevoking(null);
    }
  };

  const user = data?.user;
  const orders = data?.orders || [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
          animation: "fadeIn 0.2s ease"
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
        width: "min(520px, 100vw)",
        background: "var(--bg2)", borderLeft: "1px solid var(--border2)",
        display: "flex", flexDirection: "column",
        animation: "slideInRight 0.25s ease",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.4)"
      }}>

        {/* Drawer header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0
        }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Student Details</h2>
          <button onClick={onClose} style={{
            background: "var(--surface)", border: "none", color: "var(--text2)",
            width: 32, height: 32, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 18
          }}>×</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", paddingTop: 60 }}>
              <div className="spinner" style={{ margin: "0 auto" }} />
            </div>
          ) : !user ? (
            <div className="empty-state"><h3>Student not found</h3></div>
          ) : (
            <>
              {/* Profile card */}
              <div style={{
                background: "var(--surface)", borderRadius: "var(--radius)",
                padding: 20, marginBottom: 24,
                border: "1px solid var(--border)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                  <Avatar name={user.name} size={52} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>{user.name}</div>
                    <div style={{ color: "var(--text2)", fontSize: 13 }}>{user.email}</div>
                    <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                      <span className={`badge ${user.isActive ? "badge-success" : "badge-danger"}`} style={{ fontSize: 11 }}>
                        {user.isActive ? "Active" : "Blocked"}
                      </span>
                      <span className="badge badge-primary" style={{ fontSize: 11 }}>Student</span>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[
                    { icon: <FiBook size={14} />, label: "Enrolled", val: user.enrolledCourses?.length || 0 },
                    { icon: <FiShoppingBag size={14} />, label: "Orders", val: orders.length },
                    { icon: <FiCalendar size={14} />, label: "Joined", val: new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) },
                  ].map((s, i) => (
                    <div key={i} style={{
                      background: "var(--bg2)", borderRadius: 8, padding: "10px 12px",
                      border: "1px solid var(--border)", textAlign: "center"
                    }}>
                      <div style={{ color: "var(--text3)", marginBottom: 4, display: "flex", justifyContent: "center" }}>{s.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Enrolled Courses ── */}
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 14
                }}>
                  <h3 style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                    Enrolled Courses
                    <span style={{
                      marginLeft: 8, fontSize: 12, fontWeight: 500,
                      color: "var(--text3)"
                    }}>({user.enrolledCourses?.length || 0})</span>
                  </h3>
                </div>

                {!user.enrolledCourses?.length ? (
                  <div style={{
                    border: "1px dashed var(--border2)", borderRadius: "var(--radius)",
                    padding: "28px 16px", textAlign: "center", color: "var(--text3)", fontSize: 13
                  }}>
                    Not enrolled in any courses
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {user.enrolledCourses.map((enrollment) => {
                      const c = enrollment.course;
                      if (!c) return null;
                      const courseId = c._id || c;
                      const isRevoking = revoking === courseId;
                      const isConfirming = confirmId === courseId;

                      return (
                        <div key={courseId} style={{
                          background: "var(--surface)", border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)", padding: "14px 16px",
                          display: "flex", alignItems: "flex-start", gap: 12,
                          transition: "border-color 0.15s",
                          borderColor: isConfirming ? "rgba(255,107,107,0.4)" : "var(--border)"
                        }}>
                          {/* Thumbnail */}
                          <div style={{
                            width: 52, height: 38, borderRadius: 6, flexShrink: 0,
                            background: "var(--bg2)", overflow: "hidden"
                          }}>
                            {c.thumbnail
                              ? <img src={c.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
                              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📖</div>
                            }
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {c.title || "Unknown course"}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3, display: "flex", gap: 10 }}>
                              {c.instructor && <span>{c.instructor}</span>}
                              {enrollment.progress !== undefined && (
                                <span style={{ color: enrollment.progress === 100 ? "var(--success)" : "var(--text2)" }}>
                                  {enrollment.progress}% complete
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                              Enrolled {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                            </div>

                            {/* Progress bar */}
                            {enrollment.progress !== undefined && (
                              <div style={{ marginTop: 8 }}>
                                <div className="progress-bar" style={{ height: 4 }}>
                                  <div className="progress-fill" style={{ width: `${enrollment.progress || 0}%` }} />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Revoke button / confirm flow */}
                          <div style={{ flexShrink: 0 }}>
                            {isRevoking ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text3)", fontSize: 12 }}>
                                <div style={{ width: 14, height: 14, border: "2px solid var(--text3)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                                Revoking…
                              </div>
                            ) : isConfirming ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                                <div style={{ fontSize: 11, color: "#FF6B6B", fontWeight: 600, textAlign: "right" }}>
                                  Remove access?
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button
                                    onClick={() => setConfirmId(null)}
                                    style={{ ...smallBtnStyle, borderColor: "var(--border2)", color: "var(--text2)" }}
                                  >No</button>
                                  <button
                                    onClick={() => revokeEnrollment(courseId, c.title)}
                                    style={{ ...smallBtnStyle, background: "rgba(255,107,107,0.15)", borderColor: "rgba(255,107,107,0.4)", color: "#FF6B6B" }}
                                  >Yes, revoke</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmId(courseId)}
                                title="Revoke enrollment"
                                style={{
                                  display: "flex", alignItems: "center", gap: 6,
                                  padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,107,107,0.3)",
                                  background: "rgba(255,107,107,0.07)", color: "#FF6B6B",
                                  cursor: "pointer", fontSize: 12, fontWeight: 500,
                                  transition: "all 0.15s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,107,107,0.15)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,107,107,0.07)"}
                              >
                                <FiTrash2 size={12} /> Revoke
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Order History ── */}
              {orders.length > 0 && (
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 14 }}>
                    Order History
                    <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: "var(--text3)" }}>
                      ({orders.length})
                    </span>
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {orders.map(order => (
                      <div key={order._id} style={{
                        background: "var(--surface)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)", padding: "12px 14px",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12
                      }}>
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {order.course?.title || "—"}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {" · "}{order.paymentMethod}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>
                            {order.amount === 0 ? "Free" : `₹${order.amount.toLocaleString()}`}
                          </span>
                          <span className={`badge ${
                            order.status === "completed" ? "badge-success" :
                            order.status === "refunded" ? "badge-warning" :
                            order.status === "pending"  ? "badge-primary" : "badge-danger"
                          }`} style={{ fontSize: 11 }}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer footer actions */}
        {user && (
          <div style={{
            padding: "16px 24px", borderTop: "1px solid var(--border)",
            display: "flex", gap: 10, flexShrink: 0
          }}>
            <button
              onClick={() => {
                axios.put(`/admin/users/${userId}/toggle`)
                  .then(r => {
                    setData(d => ({ ...d, user: { ...d.user, isActive: r.data.user.isActive } }));
                    toast.success(r.data.user.isActive ? "User activated" : "User blocked");
                  })
                  .catch(() => toast.error("Failed"));
              }}
              style={{
                flex: 1, padding: "10px", borderRadius: 8, fontWeight: 600, fontSize: 13,
                cursor: "pointer", border: `1px solid ${user.isActive ? "rgba(255,107,107,0.4)" : "rgba(107,203,119,0.4)"}`,
                background: user.isActive ? "rgba(255,107,107,0.08)" : "rgba(107,203,119,0.08)",
                color: user.isActive ? "#FF6B6B" : "var(--success)"
              }}
            >
              {user.isActive ? "🚫 Block Student" : "✅ Activate Student"}
            </button>
            <button onClick={onClose} style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border2)",
              background: "transparent", color: "var(--text2)", cursor: "pointer",
              fontWeight: 500, fontSize: 13
            }}>Close</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn     { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes spin        { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────
// AdminOrders — unchanged from before
// ─────────────────────────────────────────────────────
export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/payment/all-orders")
      .then(r => setOrders(r.data.orders))
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders
    .filter(o => o.status === "completed")
    .reduce((acc, o) => acc + o.amount, 0);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.6rem", marginBottom: 4 }}>Orders</h1>
        <p style={{ color: "var(--text2)", fontSize: 14 }}>
          {orders.length} total orders ·{" "}
          <span style={{ color: "var(--success)", fontWeight: 600 }}>
            ₹{totalRevenue.toLocaleString()} revenue
          </span>
        </p>
      </div>

      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        {orders.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <div style={{ fontSize: 48 }}>🛍️</div>
            <h3>No orders yet</h3>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  {["Student", "Course", "Amount", "Method", "Status", "Date"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500 }}>{order.user?.name || "—"}</div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>{order.user?.email}</div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text2)", maxWidth: 200 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {order.course?.title || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--success)" }}>
                      {order.amount === 0
                        ? <span className="badge badge-success">Free</span>
                        : `₹${order.amount.toLocaleString()}`}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="badge badge-primary">{order.paymentMethod}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className={`badge ${
                        order.status === "completed" ? "badge-success" :
                        order.status === "refunded"  ? "badge-warning" :
                        order.status === "pending"   ? "badge-primary" : "badge-danger"
                      }`}>{order.status}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text3)", fontSize: 13 }}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
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

// ─────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────
function Avatar({ name, size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, var(--primary), #9D97FF)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.38, color: "#fff"
    }}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

const iconBtnStyle = {
  width: 30, height: 30, borderRadius: 6,
  border: "1px solid var(--border2)",
  background: "transparent", color: "var(--text2)",
  cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center",
  transition: "all 0.15s"
};

const smallBtnStyle = {
  padding: "4px 10px", borderRadius: 6,
  border: "1px solid var(--border2)",
  background: "transparent", color: "var(--text2)",
  cursor: "pointer", fontSize: 12, fontWeight: 500
};

export default AdminUsers;