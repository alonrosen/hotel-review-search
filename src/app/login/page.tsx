"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [tab, setTab] = useState<"login" | "register" | "verify">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google login failed");
      await refreshUser();
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "Please verify your email first") {
          setTab("verify");
        } else {
          throw new Error(data.error || "Login failed");
        }
      } else {
        await refreshUser();
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setTab("verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      // verification successful, now try logging in
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!loginRes.ok) throw new Error("Verification succeeded, but login failed. Please try logging in.");
      await refreshUser();
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" style={{ maxWidth: 400, width: "100%" }}>
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>Hotel Review Search</h2>
        
        {tab !== "verify" && (
          <div style={{ display: "flex", marginBottom: 20, borderBottom: "1px solid var(--border-color)" }}>
            <button
              style={{ flex: 1, padding: "10px", background: "none", border: "none", color: tab === "login" ? "var(--text-primary)" : "var(--text-tertiary)", borderBottom: tab === "login" ? "2px solid var(--accent)" : "none", cursor: "pointer" }}
              onClick={() => { setTab("login"); setError(""); }}
            >
              Login
            </button>
            <button
              style={{ flex: 1, padding: "10px", background: "none", border: "none", color: tab === "register" ? "var(--text-primary)" : "var(--text-tertiary)", borderBottom: tab === "register" ? "2px solid var(--accent)" : "none", cursor: "pointer" }}
              onClick={() => { setTab("register"); setError(""); }}
            >
              Register
            </button>
          </div>
        )}

        {error && <div className="toast toast-error" style={{ position: "relative", marginBottom: 20, right: "auto", bottom: "auto", maxWidth: "100%" }}>{error}</div>}

        {tab !== "verify" && (
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google login failed")}
                useOneTap
              />
            </div>
            
            <div style={{ display: "flex", alignItems: "center", margin: "20px 0", color: "var(--text-tertiary)" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
              <span style={{ padding: "0 10px", fontSize: 12, textTransform: "uppercase" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
            </div>
          </GoogleOAuthProvider>
        )}

        {tab === "login" && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required className="input" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Password</label>
              <input type="password" required className="input" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Name</label>
              <input type="text" required className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required className="input" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Password</label>
              <input type="password" required className="input" value={password} onChange={e => setPassword(e.target.value)} minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Please wait..." : "Register"}
            </button>
          </form>
        )}

        {tab === "verify" && (
          <form onSubmit={handleVerify}>
            <p style={{ textAlign: "center", marginBottom: 20, color: "var(--text-secondary)" }}>
              We've sent a 6-digit code to <strong>{email}</strong>. Please enter it below.
            </p>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Verification Code</label>
              <input type="text" required className="input" value={code} onChange={e => setCode(e.target.value)} placeholder="000000" style={{ textAlign: "center", fontSize: 24, letterSpacing: 8 }} maxLength={6} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Please wait..." : "Verify & Login"}
            </button>
            <button type="button" className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => setTab("login")}>
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
