"use client";

import { useState, useEffect, FormEvent } from "react";

/* ── Types ─────────────────────────────────────────────────── */

interface Hotel {
  id: string;
  name: string;
  googlePlaceId: string | null;
  tripAdvisorId: string | null;
  tripAdvisorUrl: string | null;
  city: string | null;
  country: string | null;
  _count?: { reviews: number };
}

interface ReviewStats {
  hotelId: string;
  hotelName: string;
  googleCount: number;
  tripadvisorCount: number;
  lastGoogleFetch: string | null;
  lastTripadvisorFetch: string | null;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

/* ── Admin Page ────────────────────────────────────────────── */

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [stats, setStats] = useState<ReviewStats[]>([]);
  const [settings, setSettings] = useState<{ provider_google?: string; provider_tripadvisor?: string }>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Hotel form state
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newGoogleId, setNewGoogleId] = useState("");
  const [newTripAdvisorId, setNewTripAdvisorId] = useState("");
  const [newTripAdvisorUrl, setNewTripAdvisorUrl] = useState("");
  const [lookupResults, setLookupResults] = useState<{
    google: Array<{ title?: string; place_id?: string; data_id?: string; address?: string }>;
    tripadvisor: Array<{ title?: string; link?: string; location_id?: string }>;
  } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Fetch state
  const [fetchingHotel, setFetchingHotel] = useState<string | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      "x-admin-secret": adminSecret,
    };
  }

  async function loadData() {
    try {
      const [hotelsRes, statsRes, settingsRes] = await Promise.all([
        fetch("/api/hotels"),
        fetch("/api/reviews/stats"),
        fetch("/api/settings", { headers: authHeaders() }),
      ]);
      setHotels(await hotelsRes.json());
      setStats(await statsRes.json());
      setSettings(await settingsRes.json());
    } catch {
      showToast("Failed to load data", "error");
    }
  }

  useEffect(() => {
    if (authenticated) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  /* ── Auth Gate ───────────────────────────────────────────── */
  if (!authenticated) {
    return (
      <>
        <header className="header">
          <div className="container header-inner">
            <div className="logo">
              <div className="logo-icon">⚙️</div>
              Admin Panel
            </div>
            <div className="nav-links">
              <a href="/" className="nav-link">
                Search
              </a>
              <a href="/admin" className="nav-link active">
                Admin
              </a>
            </div>
          </div>
        </header>

        <div className="container page-content">
          <div
            style={{
              maxWidth: 400,
              margin: "80px auto",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginBottom: 8, fontSize: 22, fontWeight: 700 }}>
              Admin Access
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: 24,
                fontSize: 14,
              }}
            >
              Enter your admin secret to manage hotels and reviews.
            </p>
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (adminSecret.trim()) setAuthenticated(true);
              }}
            >
              <input
                type="password"
                className="input"
                placeholder="Admin secret"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                Enter
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  /* ── Lookup Hotel IDs ────────────────────────────────────── */
  async function handleLookup() {
    if (!newName.trim()) return;
    setLookupLoading(true);
    setLookupResults(null);

    try {
      const res = await fetch("/api/hotels/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          city: newCity,
          country: newCountry,
        }),
      });
      const results = await res.json();
      setLookupResults(results);

      // Auto-populate the first results
      if (results.google && results.google.length > 0) {
        setNewGoogleId(results.google[0].data_id || results.google[0].place_id || "");
      }
      if (results.tripadvisor && results.tripadvisor.length > 0) {
        if (results.tripadvisor[0].location_id) {
          setNewTripAdvisorId(results.tripadvisor[0].location_id);
          setNewTripAdvisorUrl(results.tripadvisor[0].link || `https://www.tripadvisor.com/Hotel_Review-d${results.tripadvisor[0].location_id}`);
        }
      }

    } catch {
      showToast("Lookup failed", "error");
    } finally {
      setLookupLoading(false);
    }
  }

  /* ── Settings ────────────────────────────────────────────── */
  async function handleUpdateSetting(key: string, value: string) {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error();
      showToast("Settings updated", "success");
      setSettings((s) => ({ ...s, [key]: value }));
    } catch {
      showToast("Failed to update setting", "error");
    }
  }

  /* ── Save Hotel (Add or Edit) ────────────────────────────── */
  async function handleSaveHotel(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    try {
      const url = editingHotelId ? `/api/hotels/${editingHotelId}` : "/api/hotels";
      const method = editingHotelId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          name: newName,
          googlePlaceId: newGoogleId || undefined,
          tripAdvisorId: newTripAdvisorId || undefined,
          tripAdvisorUrl: newTripAdvisorUrl || undefined,
          city: newCity || undefined,
          country: newCountry || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save hotel");
      }

      showToast(editingHotelId ? `Updated "${newName}"` : `Added "${newName}"`, "success");
      cancelEdit();
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save hotel", "error");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(hotel: Hotel) {
    setEditingHotelId(hotel.id);
    setNewName(hotel.name);
    setNewCity(hotel.city || "");
    setNewCountry(hotel.country || "");
    setNewGoogleId(hotel.googlePlaceId || "");
    setNewTripAdvisorId(hotel.tripAdvisorId || "");
    setNewTripAdvisorUrl(hotel.tripAdvisorUrl || "");
    setLookupResults(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingHotelId(null);
    setNewName("");
    setNewCity("");
    setNewCountry("");
    setNewGoogleId("");
    setNewTripAdvisorId("");
    setNewTripAdvisorUrl("");
    setLookupResults(null);
  }

  /* ── Delete Hotel ────────────────────────────────────────── */
  async function handleDeleteHotel(hotel: Hotel) {
    if (!confirm(`Delete "${hotel.name}" and all its reviews?`)) return;

    try {
      const res = await fetch(`/api/hotels/${hotel.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();

      showToast(`Deleted "${hotel.name}"`, "success");
      loadData();
    } catch {
      showToast("Failed to delete hotel", "error");
    }
  }

  /* ── Fetch Reviews ───────────────────────────────────────── */
  async function handleFetchReviews(hotelId: string, source: string) {
    setFetchingHotel(`${hotelId}-${source}`);

    try {
      const res = await fetch("/api/reviews/fetch", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ hotelId, source, pages: 10 }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fetch failed");
      }

      const data = await res.json();
      showToast(
        `Fetched ${data.totalFetched} reviews (${data.newReviews} new)`,
        "success"
      );
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Fetch failed", "error");
    } finally {
      setFetchingHotel(null);
    }
  }

  /* ── Stats helper ────────────────────────────────────────── */
  function getStats(hotelId: string): ReviewStats | undefined {
    return stats.find((s) => s.hotelId === hotelId);
  }

  const totalReviews = stats.reduce(
    (sum, s) => sum + s.googleCount + s.tripadvisorCount,
    0
  );

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div className="logo">
            <div className="logo-icon">⚙️</div>
            Admin Panel
          </div>
          <div className="nav-links">
            <a href="/" className="nav-link">
              Search
            </a>
            <a href="/admin" className="nav-link active">
              Admin
            </a>
          </div>
        </div>
      </header>

      <div className="container page-content">
        {/* Stats Overview */}
        <div className="stat-row">
          <div className="card card-compact stat-card">
            <div className="stat-value">{hotels.length}</div>
            <div className="stat-label">Hotels</div>
          </div>
          <div className="card card-compact stat-card">
            <div className="stat-value">{totalReviews}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
          <div className="card card-compact stat-card">
            <div className="stat-value">
              {stats.reduce((sum, s) => sum + s.googleCount, 0)}
            </div>
            <div className="stat-label">Google Reviews</div>
          </div>
          <div className="card card-compact stat-card">
            <div className="stat-value">
              {stats.reduce((sum, s) => sum + s.tripadvisorCount, 0)}
            </div>
            <div className="stat-label">TripAdvisor Reviews</div>
          </div>
        </div>

        <div className="admin-layout">
          {/* Left Column */}
          <div className="admin-section">
            
            {/* Global Settings */}
            <div className="section-title">Global Settings</div>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              <div className="form-group">
                <label>Google Maps Provider</label>
                <select
                  className="select"
                  value={settings.provider_google || "rapidapi"}
                  onChange={(e) => handleUpdateSetting("provider_google", e.target.value)}
                >
                  <option value="rapidapi">RapidAPI (Backup)</option>
                  <option value="apify">Apify</option>
                </select>
              </div>
              <div className="form-group">
                <label>TripAdvisor Provider</label>
                <select
                  className="select"
                  value={settings.provider_tripadvisor || "rapidapi"}
                  onChange={(e) => handleUpdateSetting("provider_tripadvisor", e.target.value)}
                >
                  <option value="rapidapi">RapidAPI (Backup)</option>
                  <option value="apify">Apify</option>
                </select>
              </div>
            </div>

            <div className="section-title">{editingHotelId ? "Edit Hotel" : "Add Hotel"}</div>

            <form onSubmit={handleSaveHotel}>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="form-group">
                  <label>Hotel Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. The Ritz London"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      className="input"
                      placeholder="e.g. London"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      className="input"
                      placeholder="e.g. UK"
                      value={newCountry}
                      onChange={(e) => setNewCountry(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleLookup}
                  disabled={!newName.trim() || lookupLoading}
                >
                  {lookupLoading ? (
                    <span className="spinner" />
                  ) : (
                    "🔍 Auto-Search IDs"
                  )}
                </button>

                {/* Lookup Results */}
                {lookupResults && (
                  <div
                    style={{
                      fontSize: 13,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {lookupResults.google.length > 0 && (
                      <div>
                        <strong style={{ color: "var(--accent)" }}>
                          Google Results:
                        </strong>
                        {lookupResults.google.slice(0, 3).map((r, i) => (
                          <div
                            key={i}
                            style={{
                              padding: "6px 10px",
                              margin: "4px 0",
                              background: "var(--bg-glass)",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                              border: "1px solid var(--border)",
                            }}
                            onClick={() => {
                              setNewGoogleId(r.data_id || r.place_id || "");
                              if (r.city) setNewCity(r.city);
                              if (r.country) setNewCountry(r.country);
                              if (r.title) {
                                setNewName(r.title);
                                const taMatch = lookupResults.tripadvisor.find(ta => ta.title && (ta.title.toLowerCase().includes(r.title!.toLowerCase()) || r.title!.toLowerCase().includes(ta.title.toLowerCase())));
                                if (taMatch) {
                                  if (taMatch.location_id) setNewTripAdvisorId(taMatch.location_id);
                                  if (taMatch.link) setNewTripAdvisorUrl(taMatch.link);
                                }
                              }
                            }}
                          >
                            {r.title}
                            <span
                              style={{
                                display: "block",
                                color: "var(--text-tertiary)",
                                fontSize: 12,
                              }}
                            >
                              {r.address} — ID:{" "}
                              {r.data_id || r.place_id || "N/A"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {lookupResults.tripadvisor.length > 0 && (
                      <div>
                        <strong style={{ color: "var(--green)" }}>
                          TripAdvisor Results:
                        </strong>
                        {lookupResults.tripadvisor.slice(0, 3).map((r, i) => (
                          <div
                            key={i}
                            style={{
                              padding: "6px 10px",
                              margin: "4px 0",
                              background: "var(--bg-glass)",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                              border: "1px solid var(--border)",
                            }}
                            onClick={() => {
                              if (r.location_id) setNewTripAdvisorId(r.location_id);
                              if (r.link) setNewTripAdvisorUrl(r.link);
                              if (r.title) {
                                setNewName(r.title);
                                const gMatch = lookupResults.google.find(g => g.title && (g.title.toLowerCase().includes(r.title!.toLowerCase()) || r.title!.toLowerCase().includes(g.title.toLowerCase())));
                                if (gMatch) {
                                  setNewGoogleId(gMatch.data_id || gMatch.place_id || "");
                                }
                              }
                            }}
                          >
                            {r.title}
                            <span
                              style={{
                                display: "block",
                                color: "var(--text-tertiary)",
                                fontSize: 12,
                              }}
                            >
                              {r.location_id ? `ID: ${r.location_id}` : (r.link || "No ID")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label>Google Place ID</label>
                  <input
                    className="input"
                    placeholder="Auto-filled or paste manually"
                    value={newGoogleId}
                    onChange={(e) => setNewGoogleId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>TripAdvisor ID (contentId)</label>
                  <input
                    className="input"
                    placeholder="Auto-filled or paste manually"
                    value={newTripAdvisorId}
                    onChange={(e) => setNewTripAdvisorId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>TripAdvisor URL (For Apify)</label>
                  <input
                    className="input"
                    placeholder="https://www.tripadvisor.com/Hotel_Review-..."
                    value={newTripAdvisorUrl}
                    onChange={(e) => setNewTripAdvisorUrl(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !newName.trim()}
                    style={{ flex: 1 }}
                  >
                    {loading ? <span className="spinner" /> : (editingHotelId ? "Update Hotel" : "Add Hotel")}
                  </button>
                  {editingHotelId && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Right Column — Manage Hotels */}
          <div className="admin-section">
            <div className="section-title">Manage Hotels</div>

            {hotels.length === 0 ? (
              <div className="card empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon">🏨</div>
                <h3>No hotels yet</h3>
                <p>Add a hotel using the form on the left.</p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {hotels.map((hotel) => {
                  const st = getStats(hotel.id);
                  return (
                    <div key={hotel.id} className="card card-compact">
                      <div className="admin-hotel-row">
                        <div className="admin-hotel-info">
                          <h4>{hotel.name}</h4>
                          <p>
                            {[hotel.city, hotel.country]
                              .filter(Boolean)
                              .join(", ") || "No location"}
                            {st
                              ? ` · ${st.googleCount + st.tripadvisorCount} reviews`
                              : ""}
                          </p>
                        </div>
                        <div className="admin-actions">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => startEdit(hotel)}
                          >
                            ✏️ Edit
                          </button>
                          {hotel.googlePlaceId && (
                            <button
                              className="btn btn-sm btn-secondary"
                              disabled={
                                fetchingHotel === `${hotel.id}-google`
                              }
                              onClick={() =>
                                handleFetchReviews(hotel.id, "google")
                              }
                            >
                              {fetchingHotel === `${hotel.id}-google` ? (
                                <span className="spinner" />
                              ) : (
                                "📥 Google"
                              )}
                            </button>
                          )}
                          {(hotel.tripAdvisorUrl || hotel.tripAdvisorId) && (
                            <button
                              className="btn btn-sm btn-secondary"
                              disabled={
                                fetchingHotel === `${hotel.id}-tripadvisor`
                              }
                              onClick={() =>
                                handleFetchReviews(hotel.id, "tripadvisor")
                              }
                            >
                              {fetchingHotel ===
                              `${hotel.id}-tripadvisor` ? (
                                <span className="spinner" />
                              ) : (
                                "📥 TA"
                              )}
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteHotel(hotel)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Stats detail */}
                      {st && (st.googleCount > 0 || st.tripadvisorCount > 0) && (
                        <div
                          style={{
                            display: "flex",
                            gap: 16,
                            marginTop: 10,
                            paddingTop: 10,
                            borderTop: "1px solid var(--border)",
                            fontSize: 12,
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {st.googleCount > 0 && (
                            <span>
                              Google: {st.googleCount} reviews
                              {st.lastGoogleFetch &&
                                ` · Last: ${new Date(
                                  st.lastGoogleFetch
                                ).toLocaleDateString()}`}
                            </span>
                          )}
                          {st.tripadvisorCount > 0 && (
                            <span>
                              TA: {st.tripadvisorCount} reviews
                              {st.lastTripadvisorFetch &&
                                ` · Last: ${new Date(
                                  st.lastTripadvisorFetch
                                ).toLocaleDateString()}`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </>
  );
}
