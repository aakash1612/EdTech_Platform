import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiMenu, FiX, FiUser, FiLogOut, FiBookOpen, FiLayout, FiHome } from "react-icons/fi";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setDropOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: "rgba(15,15,26,0.95)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #6C63FF, #FF6B6B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "#fff"
          }}>E</div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--text)" }}>
            Edu<span style={{ color: "var(--primary)" }}>Learn</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="desktop-nav">
          <NavLink to="/" label="Home" active={isActive("/")} />
          <NavLink to="/courses" label="Courses" active={isActive("/courses")} />
          {user?.role === "student" && <NavLink to="/dashboard" label="Dashboard" active={isActive("/dashboard")} />}
          {user?.role === "admin" && <NavLink to="/admin" label="Admin Panel" active={location.pathname.startsWith("/admin")} />}
        </div>

        {/* Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!user ? (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm" style={{ display: "flex" }}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          ) : (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setDropOpen(!dropOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "var(--surface)", border: "1px solid var(--border2)",
                  borderRadius: 100, padding: "6px 14px 6px 6px", cursor: "pointer",
                  color: "var(--text)", transition: "all 0.2s"
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary), #9D97FF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#fff"
                }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{user.name?.split(" ")[0]}</span>
              </button>

              {dropOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  background: "var(--bg2)", border: "1px solid var(--border2)",
                  borderRadius: 12, padding: 8, minWidth: 180,
                  boxShadow: "var(--shadow)", zIndex: 200
                }}>
                  <div style={{ padding: "8px 12px 12px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>{user.email}</div>
                    <span className="badge badge-primary" style={{ marginTop: 6, fontSize: 11 }}>{user.role}</span>
                  </div>
                  <DropItem icon={<FiUser />} label="Profile" onClick={() => { navigate("/profile"); setDropOpen(false); }} />
                  {user.role === "student" && <DropItem icon={<FiBookOpen />} label="My Courses" onClick={() => { navigate("/my-courses"); setDropOpen(false); }} />}
                  {user.role === "admin" && <DropItem icon={<FiLayout />} label="Admin Panel" onClick={() => { navigate("/admin"); setDropOpen(false); }} />}
                  <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
                  <DropItem icon={<FiLogOut />} label="Logout" onClick={handleLogout} danger />
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: "none", border: "none", color: "var(--text)", fontSize: 22, display: "none" }}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          background: "var(--bg2)", borderTop: "1px solid var(--border)",
          padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8
        }}>
          <MobileNavLink to="/" label="Home" onClick={() => setMenuOpen(false)} />
          <MobileNavLink to="/courses" label="Courses" onClick={() => setMenuOpen(false)} />
          {user?.role === "student" && <MobileNavLink to="/dashboard" label="Dashboard" onClick={() => setMenuOpen(false)} />}
          {user?.role === "student" && <MobileNavLink to="/my-courses" label="My Courses" onClick={() => setMenuOpen(false)} />}
          {user?.role === "admin" && <MobileNavLink to="/admin" label="Admin Panel" onClick={() => setMenuOpen(false)} />}
          {!user ? (
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Link to="/login" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setMenuOpen(false)}>Register</Link>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ justifyContent: "center", marginTop: 8 }}>
              <FiLogOut /> Logout
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

const NavLink = ({ to, label, active }) => (
  <Link to={to} style={{
    padding: "6px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500,
    color: active ? "var(--primary)" : "var(--text2)",
    background: active ? "rgba(108,99,255,0.1)" : "transparent",
    textDecoration: "none", transition: "all 0.2s"
  }}>{label}</Link>
);

const MobileNavLink = ({ to, label, onClick }) => (
  <Link to={to} onClick={onClick} style={{
    padding: "10px 14px", borderRadius: 8, fontSize: 15,
    color: "var(--text)", textDecoration: "none",
    background: "var(--surface)", display: "block"
  }}>{label}</Link>
);

const DropItem = ({ icon, label, onClick, danger }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 10, width: "100%",
    padding: "9px 12px", borderRadius: 8, border: "none",
    background: "transparent", color: danger ? "#FF6B6B" : "var(--text)",
    fontSize: 14, cursor: "pointer", transition: "background 0.15s", textAlign: "left"
  }}
    onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
  >
    {icon} {label}
  </button>
);
