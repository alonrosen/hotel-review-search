"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RequestHotelPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.status !== 'active')) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.status === 'active') {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    const res = await fetch("/api/hotel-requests");
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/hotel-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, state, country }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to submit request");
      
      setSuccess("Your request has been submitted for admin approval.");
      setName(""); setCity(""); setState(""); setCountry("");
      fetchRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) return <div style={{ padding: 48, textAlign: "center" }}><span className="spinner" /></div>;

  return (
    <>
      <header className="header">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="logo" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>Hotel Review Search</div>
          <button className="btn btn-ghost" onClick={() => router.push("/")}>Back to Search</button>
        </div>
      </header>
      
      <main className="container page-content" style={{ marginTop: 40, maxWidth: 600 }}>
        <h1 style={{ marginBottom: 24, fontSize: 24 }}>Request a New Hotel</h1>
        
        <div className="card" style={{ marginBottom: 40 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Hotel Name *</label>
              <input type="text" required className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-row" style={{ gap: 16, marginBottom: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>City</label>
                <input type="text" className="input" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>State/Province</label>
                <input type="text" className="input" value={state} onChange={(e) => setState(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Country</label>
              <input type="text" className="input" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>

            {error && <div className="toast toast-error" style={{ position: "relative", marginBottom: 16, right: "auto", bottom: "auto", maxWidth: "100%" }}>{error}</div>}
            {success && <div className="toast toast-success" style={{ position: "relative", marginBottom: 16, right: "auto", bottom: "auto", maxWidth: "100%" }}>{success}</div>}

            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: "100%" }}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>

        <h2 style={{ marginBottom: 16, fontSize: 18, color: "var(--text-secondary)" }}>Your Past Requests</h2>
        {requests.length === 0 ? (
          <p style={{ color: "var(--text-tertiary)" }}>You haven't requested any hotels yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {requests.map((r) => (
              <div key={r.id} className="card" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
                      {[r.city, r.state, r.country].filter(Boolean).join(", ")}
                    </div>
                  </div>
                  <div>
                    <span style={{
                      padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                      background: r.status === 'approved' ? 'rgba(52, 199, 89, 0.15)' : r.status === 'rejected' ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 149, 0, 0.15)',
                      color: r.status === 'approved' ? 'var(--green)' : r.status === 'rejected' ? 'var(--red)' : 'var(--orange)'
                    }}>
                      {r.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                {r.adminNote && (
                  <div style={{ marginTop: 12, padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: 6, fontSize: 13, color: "var(--text-secondary)" }}>
                    <strong>Admin Note:</strong> {r.adminNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
