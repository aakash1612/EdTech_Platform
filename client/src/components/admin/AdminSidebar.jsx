import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import {
  FiGrid, FiBookOpen, FiUsers, FiShoppingBag,
  FiLogOut, FiChevronLeft, FiChevronRight, FiHome
} from "react-icons/fi";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: <FiGrid /> },
  { to: "/admin/courses", label: "Courses", icon: <FiBookOpen /> },
  { to: "/admin/users", label: "Students", icon: <FiUsers /> },
  { to: "/admin/orders", label: "Orders", icon: <FiShoppingBag /> },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <aside style={{
      width: collapsed ? 64 : 220, background: "var(--bg2)",
      borderRight: "1px solid var(--border)", display: "flex",
      flexDirection: "column", flexShrink: 0,
      transition: "width 0.25s ease", overflow: "hidden",
      position: "sticky", top: 0, height: "100vh"
    }}>
      {/* Logo */}
      <div style={{
        height: 60, display: "flex", alignItems: "center",
        padding: collapsed ? "0 16px" : "0 20px",
        borderBottom: "1px solid var(--border)", gap: 10, flexShrink: 0
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, #6C63FF, #FF6B6B)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "#fff"
        }}>E</div>
        {!collapsed && (
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>
            Admin Panel
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to}
              title={collapsed ? item.label : ""}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: collapsed ? "10px 12px" : "10px 12px",
                borderRadius: 8, marginBottom: 4,
                color: active ? "var(--primary)" : "var(--text2)",
                background: active ? "rgba(108,99,255,0.12)" : "transparent",
                textDecoration: "none", fontSize: 14, fontWeight: 500,
                transition: "all 0.15s", whiteSpace: "nowrap",
                justifyContent: collapsed ? "center" : "flex-start"
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--surface)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        <div style={{ height: 1, background: "var(--border)", margin: "8px 0" }} />

        <Link to="/" title={collapsed ? "View Site" : ""}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 12px", borderRadius: 8,
            color: "var(--text2)", textDecoration: "none", fontSize: 14,
            transition: "all 0.15s", whiteSpace: "nowrap",
            justifyContent: collapsed ? "center" : "flex-start"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <FiHome style={{ fontSize: 17, flexShrink: 0 }} />
          {!collapsed && <span>View Site</span>}
        </Link>
      </nav>

      {/* User + Collapse */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        {!collapsed && (
          <div style={{
            padding: "10px 12px", borderRadius: 8,
            background: "var(--surface)", marginBottom: 8
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>Administrator</div>
          </div>
        )}

        <button onClick={handleLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 8, border: "none",
            background: "transparent", color: "#FF6B6B", fontSize: 14,
            cursor: "pointer", transition: "background 0.15s", marginBottom: 8,
            justifyContent: collapsed ? "center" : "flex-start"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,107,107,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <FiLogOut style={{ flexShrink: 0 }} /> {!collapsed && "Logout"}
        </button>

        <button onClick={() => setCollapsed(!collapsed)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 8, border: "none",
            background: "transparent", color: "var(--text3)", fontSize: 14,
            cursor: "pointer", transition: "background 0.15s",
            justifyContent: collapsed ? "center" : "flex-start"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          {collapsed ? <FiChevronRight /> : <><FiChevronLeft /> <span style={{ fontSize: 13 }}>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
