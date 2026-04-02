import { useState, useEffect } from "react";
import axios from "axios";
import { FiUsers, FiBookOpen, FiShoppingBag, FiDollarSign, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchStats = () => {
    setLoading(true);
    axios.get("/admin/stats")
      .then(r => setStats(r.data.stats))
      .catch(() => toast.error("Failed to load stats"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);

  const seedData = async () => {
    setSeeding(true);
    try {
      const { data } = await axios.post("/admin/seed");
      toast.success(data.message);
      fetchStats();
    } catch { toast.error("Seeding failed"); }
    finally { setSeeding(false); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div style={{ padding: "32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.6rem", marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: "var(--text2)", fontSize: 14 }}>Platform overview & analytics</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={seedData} disabled={seeding} className="btn btn-ghost btn-sm">
            <FiRefreshCw size={14} /> {seeding ? "Seeding..." : "Seed Demo Data"}
          </button>
          <button onClick={fetchStats} className="btn btn-outline btn-sm">
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { icon: <FiUsers size={20} />, label: "Total Students", val: stats?.totalUsers || 0, color: "#6C63FF", bg: "rgba(108,99,255,0.1)" },
          { icon: <FiBookOpen size={20} />, label: "Total Courses", val: stats?.totalCourses || 0, color: "#FFD93D", bg: "rgba(255,217,61,0.1)" },
          { icon: <FiShoppingBag size={20} />, label: "Total Orders", val: stats?.totalOrders || 0, color: "#6BCB77", bg: "rgba(107,203,119,0.1)" },
          { icon: <FiDollarSign size={20} />, label: "Revenue (₹)", val: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, color: "#FF6B6B", bg: "rgba(255,107,107,0.1)" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: 20
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: s.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: s.color, marginBottom: 14
            }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-display)" }}>{s.val}</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart (simple bar) */}
      {stats?.monthlyRevenue?.length > 0 && (
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: 24, marginBottom: 24
        }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: "1rem" }}>Monthly Revenue</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {stats.monthlyRevenue.map((m, i) => {
              const max = Math.max(...stats.monthlyRevenue.map(x => x.revenue));
              const height = max > 0 ? Math.max(8, (m.revenue / max) * 100) : 8;
              const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>₹{m.revenue > 999 ? `${(m.revenue/1000).toFixed(1)}k` : m.revenue}</div>
                  <div style={{
                    width: "100%", height: `${height}px`,
                    background: "linear-gradient(180deg, var(--primary), rgba(108,99,255,0.4))",
                    borderRadius: "4px 4px 0 0", transition: "height 0.3s ease"
                  }} title={`₹${m.revenue}`} />
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{months[m._id.month - 1]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {stats?.recentOrders?.length > 0 && (
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden"
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>Recent Orders</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  {["Student", "Course", "Amount", "Method", "Date"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, color: "var(--text2)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500 }}>{order.user?.name || "—"}</div>
                      <div style={{ fontSize: 12, color: "var(--text3)" }}>{order.user?.email}</div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text2)", maxWidth: 180 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {order.course?.title || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--success)" }}>
                      ₹{order.amount?.toLocaleString() || 0}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className={`badge ${order.paymentMethod === "free" ? "badge-success" : "badge-primary"}`}>
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text3)", fontSize: 13 }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats?.recentOrders?.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>📊</div>
          <h3>No data yet</h3>
          <p>Click "Seed Demo Data" to add sample courses and see the dashboard in action</p>
        </div>
      )}
    </div>
  );
}
