"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [saveLoading, setSaveLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{ cancelAtPeriodEnd: boolean, currentPeriodEnd: number } | null>(null);

  useEffect(() => {
    if (user?.isSubscribed && user.stripeSubscriptionId && user.stripeSubscriptionId !== "free_granted_by_admin") {
      fetch("/api/stripe/subscription")
        .then(res => res.json())
        .then(data => {
          if (data.subscription) {
            setSubscriptionInfo(data.subscription);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><span className="spinner" /></div>;
  }

  if (!user) {
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
  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? It will remain active until the end of the billing period.")) return;
    setCancelLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel subscription");
      setResult({ type: "success", message: data.message });
      setSubscriptionInfo(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : null);
    } catch (err: any) {
      setResult({ type: "error", message: err.message });
    } finally {
      setCancelLoading(false);
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

      <div className="container page-content" style={{ maxWidth: 600, marginTop: 48 }}>
        <div className="card">
          
          {user.isSubscribed && (
            <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid var(--border-color)" }}>
              <h2 style={{ marginBottom: 16, fontSize: 20 }}>Subscription</h2>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-glass)", padding: 24, borderRadius: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--green)", fontSize: 16 }}>Unlimited Searches Active</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>You have full access to our database.</div>
                </div>
                {user.stripeSubscriptionId && user.stripeSubscriptionId !== "free_granted_by_admin" && (
                  <div>
                    {subscriptionInfo === null ? (
                      <div className="loading-skeleton" style={{ width: 80, height: 36, borderRadius: 8 }} />
                    ) : subscriptionInfo.cancelAtPeriodEnd ? (
                      <div style={{ textAlign: "right" }}>
                        <button className="btn btn-ghost" disabled style={{ color: "var(--text-tertiary)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 8, opacity: 0.5, cursor: "not-allowed" }}>
                          Canceled
                        </button>
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6 }}>
                          Subscription will end at {new Date(subscriptionInfo.currentPeriodEnd * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-ghost" onClick={handleCancelSubscription} disabled={cancelLoading} style={{ color: "var(--red)", border: "1px solid rgba(255, 59, 48, 0.2)", borderRadius: 8 }}>
                        {cancelLoading ? <span className="spinner" /> : "Cancel"}
                      </button>
                    )}
                  </div>
                )}
                {user.stripeSubscriptionId === "free_granted_by_admin" && (
                  <span className="badge badge-google" style={{ background: "rgba(10,132,255,0.1)", color: "var(--blue)", border: "none", fontSize: 12, padding: "4px 8px" }}>Gifted by Admin</span>
                )}
              </div>
            </div>
          )}

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
