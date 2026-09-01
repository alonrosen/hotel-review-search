"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import AppleSignin from 'react-apple-signin-auth';

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

  const handleAppleSuccess = async (response: any) => {
    if (!response.authorization?.id_token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token: response.authorization.id_token,
          name: response.user?.name // only present on first login
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Apple login failed");
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
              
              <AppleSignin
                authOptions={{
                  clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "",
                  scope: 'email name',
                  redirectURI: typeof window !== 'undefined' ? window.location.origin + '/login' : '',
                  state: 'state',
                  nonce: 'nonce',
                  usePopup: true
                }}
                uiType="dark"
                className="apple-auth-btn"
                onSuccess={handleAppleSuccess}
                onError={(err) => {
                  console.error(err);
                  if (err.error !== "popup_closed_by_user") {
                    setError("Apple login failed");
                  }
                }}
                render={(props) => (
                  <button 
                    {...props} 
                    style={{
                      background: "white", 
                      color: "black", 
                      height: 40, 
                      borderRadius: 4, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      gap: 10,
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                      width: "100%"
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                    Continue with Apple
                  </button>
                )}
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
