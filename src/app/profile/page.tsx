"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [saveLoading, setSaveLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><span className="spinner" /></div>;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setResult(null);

    try {
      const payload: any = {};
      if (password) payload.password = password;
      if (user.role === 'admin' && email !== user.email) {
        payload.email = email;
      }

      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setResult({ type: "success", message: "Profile updated successfully." });
      setPassword(""); // Clear password field after success
    } catch (err: any) {
      setResult({ type: "error", message: err.message });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div className="logo">
            <div className="logo-icon">👤</div>
            My Profile
          </div>
          <div className="nav-links" style={{ flex: 1, display: "flex", gap: 24, marginLeft: 32 }}>
            <a href="/" className="nav-link">Search</a>
            {user.role === 'admin' && <a href="/admin" className="nav-link">Admin</a>}
            {user.role !== 'admin' && <a href="/request-hotel" className="nav-link">Request Hotel</a>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{user.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="container page-content" style={{ maxWidth: 500, marginTop: 48 }}>
        <div className="card">
          <h2 style={{ marginBottom: 24, fontSize: 20 }}>Account Settings</h2>
          
          <form onSubmit={handleSave}>
            {user.role === 'admin' ? (
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="input" 
                  defaultValue={user.email}
                  onChange={(e) => setEmail(e.target.value)} 
                />
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
                  As an admin, you are permitted to change your email address.
                </div>
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="input" 
                  value={user.email} 
                  disabled 
                  style={{ opacity: 0.7 }}
                />
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
                  Email modifications are not allowed for regular users.
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>New Password</label>
              <input 
                type="password" 
                className="input" 
                placeholder="Leave blank to keep current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            {result && (
              <div className={`toast ${result.type === "success" ? "toast-success" : "toast-error"}`} style={{ position: "relative", bottom: "auto", right: "auto", marginBottom: 16, maxWidth: "100%" }}>
                {result.message}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={saveLoading || (!password && email === user.email)}>
              {saveLoading ? <span className="spinner" /> : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
