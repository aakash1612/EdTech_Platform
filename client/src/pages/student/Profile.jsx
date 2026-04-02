import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { FiUser, FiMail, FiLock, FiSave } from "react-icons/fi";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", avatar: user?.avatar || "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.put("/auth/update-profile", form);
      updateUser(data.user);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error("Passwords don't match");
    setSavingPw(true);
    try {
      await axios.post("/auth/change-password", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success("Password changed!");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSavingPw(false); }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "40px 0" }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.8rem", marginBottom: 32 }}>My Profile</h1>

        {/* Avatar + Info */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: 28, marginBottom: 24
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary), #9D97FF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "#fff", flexShrink: 0
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: "1.2rem" }}>{user?.name}</h2>
              <p style={{ color: "var(--text2)", fontSize: 14 }}>{user?.email}</p>
              <span className="badge badge-primary" style={{ marginTop: 6 }}>{user?.role}</span>
            </div>
          </div>

          <form onSubmit={saveProfile}>
            <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: "1rem" }}>Edit Profile</h3>
            <div className="form-group">
              <label>Full Name</label>
              <div style={{ position: "relative" }}>
                <FiUser style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your name" style={{ paddingLeft: 38 }} />
              </div>
            </div>
            <div className="form-group">
              <label>Avatar URL (optional)</label>
              <input value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
                placeholder="https://..." />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              <FiSave /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: 28
        }}>
          <h3 style={{ fontWeight: 600, marginBottom: 20, fontSize: "1rem" }}>Change Password</h3>
          <form onSubmit={changePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <div style={{ position: "relative" }}>
                <FiLock style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
                <input type="password" value={pwForm.currentPassword}
                  onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                  placeholder="••••••••" style={{ paddingLeft: 38 }} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={pwForm.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Min 6 characters" required />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Confirm password" required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingPw}>
              <FiLock /> {savingPw ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
