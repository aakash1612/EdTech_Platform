import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";

const AuthLayout = ({ children, title, subtitle, linkText, linkTo, linkLabel }) => (
  <div style={{
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--bg)", padding: 20, position: "relative", overflow: "hidden"
  }}>
    <div style={{
      position: "absolute", width: 600, height: 600, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)",
      top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none"
    }} />
    <div style={{ position: "absolute", top: 20, left: 20 }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text2)", fontSize: 14 }}>
        <FiArrowLeft /> Back to Home
      </Link>
    </div>
    <div className="fade-up" style={{
      width: "100%", maxWidth: 420,
      background: "var(--bg2)", border: "1px solid var(--border2)",
      borderRadius: "var(--radius-lg)", padding: "36px 32px",
      boxShadow: "var(--shadow)", position: "relative"
    }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #6C63FF, #FF6B6B)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "#fff"
          }}>E</div>
        </Link>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 6 }}>{title}</h1>
        <p style={{ color: "var(--text2)", fontSize: 14 }}>{subtitle}</p>
      </div>
      {children}
      <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text2)" }}>
        {linkText} <Link to={linkTo} style={{ color: "var(--primary)", fontWeight: 600 }}>{linkLabel}</Link>
      </p>
    </div>
  </div>
);

export function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === "admin") setForm({ email: "admin@edtech.com", password: "Admin@123" });
    else setForm({ email: "student@test.com", password: "Student@123" });
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account" linkText="Don't have an account?" linkTo="/register" linkLabel="Sign up free">
      {/* Demo buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button type="button" onClick={() => fillDemo("admin")} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center", fontSize: 12 }}>
          🔑 Admin Demo
        </button>
        <button type="button" onClick={() => fillDemo("student")} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center", fontSize: 12 }}>
          👨‍🎓 Student Demo
        </button>
      </div>

      <form onSubmit={submit}>
        <div className="form-group">
          <label>Email</label>
          <div style={{ position: "relative" }}>
            <FiMail style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
            <input
              type="email" placeholder="you@example.com" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              style={{ paddingLeft: 38 }}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Password</label>
          <div style={{ position: "relative" }}>
            <FiLock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
            <input
              type={showPw ? "text" : "password"} placeholder="••••••••" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ paddingLeft: 38, paddingRight: 40 }}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text3)", cursor: "pointer" }}>
              {showPw ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </AuthLayout>
  );
}

export function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created! Welcome aboard 🎉");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Start your learning journey today" linkText="Already have an account?" linkTo="/login" linkLabel="Sign in">
      <form onSubmit={submit}>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" placeholder="John Doe" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <div style={{ position: "relative" }}>
            <FiMail style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
            <input type="email" placeholder="you@example.com" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ paddingLeft: 38 }} />
          </div>
        </div>
        <div className="form-group">
          <label>Password</label>
          <div style={{ position: "relative" }}>
            <FiLock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
            <input
              type={showPw ? "text" : "password"} placeholder="Min 6 characters" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ paddingLeft: 38, paddingRight: 40 }}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text3)", cursor: "pointer" }}>
              {showPw ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;
