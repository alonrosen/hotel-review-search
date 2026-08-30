"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

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
  stats?: {
    googleCount: number;
    tripadvisorCount: number;
    latestGoogleReviewDate: string | null;
    latestTripadvisorReviewDate: string | null;
    lastFetchDate: string | null;
  };
}

interface LogEntry {
  id: string;
  level: string;
  source: string;
  message: string;
  details: string | null;
  hotelId: string | null;
  createdAt: string;
}

/* ── Main Admin Page ───────────────────────────────────────── */

export default function AdminPage() {
  const { user, loading: userLoading, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"hotels" | "users" | "requests" | "settings" | "logs">("hotels");

  // --- Hotels State ---
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [hotelFilter, setHotelFilter] = useState("");

  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formCountry, setFormCountry] = useState("");
  const [formGooglePlaceId, setFormGooglePlaceId] = useState("");
  const [formTripAdvisorId, setFormTripAdvisorId] = useState("");
  const [formTripAdvisorUrl, setFormTripAdvisorUrl] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [formResult, setFormResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{ merged: any[] } | null>(null);

  const [backfillSource, setBackfillSource] = useState("both");
  const [backfillLimit, setBackfillLimit] = useState("50");
  const [backfillAsOfDate, setBackfillAsOfDate] = useState("");
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillResult, setBackfillResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // --- Users State ---
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // --- Requests State ---
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  // --- Settings State ---
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [providerGoogle, setProviderGoogle] = useState("rapidapi");
  const [providerTripAdvisor, setProviderTripAdvisor] = useState("rapidapi");
  const [settingsResult, setSettingsResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // --- Logs State ---
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilterLevel, setLogFilterLevel] = useState("");
  const [logFilterSource, setLogFilterSource] = useState("");
  const [logFilterStartDate, setLogFilterStartDate] = useState("");
  const [logFilterEndDate, setLogFilterEndDate] = useState("");
  const [logLimit, setLogLimit] = useState("100");

  useEffect(() => {
    if (!userLoading) {
      if (!user) router.push("/login");
      else if (user.role !== 'admin') router.push("/");
    }
  }, [user, userLoading, router]);

  /* ── Load Hotels ─────────────────────────────────────────── */
  const loadHotels = useCallback(() => {
    setHotelsLoading(true);
    fetch("/api/hotels")
      .then((r) => r.json())
      .then((data) => {
        setHotels(Array.isArray(data) ? data : data.hotels || []);
        setHotelsLoading(false);
      })
      .catch(() => setHotelsLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role === 'admin' && activeTab === "hotels" && hotels.length === 0) {
      loadHotels();
    }
  }, [user, activeTab, hotels.length, loadHotels]);

  /* ── Load Users ──────────────────────────────────────────── */
  const loadUsers = useCallback(() => {
    setUsersLoading(true);
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(data => {
        setUsers(data.users || []);
        setUsersLoading(false);
      })
      .catch(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role === 'admin' && activeTab === "users") loadUsers();
  }, [user, activeTab, loadUsers]);

  /* ── Load Requests ───────────────────────────────────────── */
  const loadRequests = useCallback(() => {
    setRequestsLoading(true);
    fetch("/api/hotel-requests")
      .then(r => r.json())
      .then(data => {
        setRequests(data.requests || []);
        setRequestsLoading(false);
      })
      .catch(() => setRequestsLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role === 'admin' && activeTab === "requests") loadRequests();
  }, [user, activeTab, loadRequests]);


  /* ── Load Settings ───────────────────────────────────────── */
  const loadSettings = useCallback(() => {
    setSettingsLoading(true);
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setProviderGoogle(data.provider_google || "rapidapi");
        setProviderTripAdvisor(data.provider_tripadvisor || "rapidapi");
        setSettingsLoading(false);
      })
      .catch(() => setSettingsLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role === 'admin' && activeTab === "settings") {
      loadSettings();
      setSettingsResult(null);
    }
  }, [user, activeTab, loadSettings]);

  /* ── Load Logs ───────────────────────────────────────────── */
  const loadLogs = useCallback(() => {
    setLogsLoading(true);
    const params = new URLSearchParams();
    if (logLimit) params.append("limit", logLimit);
    if (logFilterLevel) params.append("level", logFilterLevel);
    if (logFilterSource) params.append("source", logFilterSource);
    if (logFilterStartDate) params.append("startDate", logFilterStartDate);
    if (logFilterEndDate) params.append("endDate", logFilterEndDate);

    fetch(`/api/admin/logs?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLogsLoading(false);
      })
      .catch(() => setLogsLoading(false));
  }, [logLimit, logFilterLevel, logFilterSource, logFilterStartDate, logFilterEndDate]);

  useEffect(() => {
    if (user?.role === 'admin' && activeTab === "logs") {
      loadLogs();
    }
  }, [user, activeTab, loadLogs]);

  if (userLoading || !user || user.role !== 'admin') {
    return <div style={{ padding: 48, textAlign: "center" }}><span className="spinner" /></div>;
  }

  /* ── User & Request Management Handlers ──────────────────── */

  const handleUpdateUserStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/users/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserVerification = async (id: string, emailVerified: boolean) => {
    try {
      await fetch(`/api/admin/users/${id}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailVerified })
      });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserRole = async (id: string, role: string) => {
    try {
      await fetch(`/api/admin/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRequest = async (id: string, action: string) => {
    const note = prompt(`Enter optional admin note for ${action}ing request:`);
    if (note === null) return;
    try {
      await fetch(`/api/admin/hotel-requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNote: note || undefined })
      });
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Hotel Management Methods ────────────────────────────── */
  const selectHotel = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormName(hotel.name);
    setFormCity(hotel.city || "");
    setFormCountry(hotel.country || "");
    setFormGooglePlaceId(hotel.googlePlaceId || "");
    setFormTripAdvisorId(hotel.tripAdvisorId || "");
    setFormTripAdvisorUrl(hotel.tripAdvisorUrl || "");
    setFormResult(null);
    setSearchResults(null);

    if (hotel.stats) {
      const dates: Date[] = [];
      if (hotel.stats.latestGoogleReviewDate)
        dates.push(new Date(hotel.stats.latestGoogleReviewDate));
      if (hotel.stats.latestTripadvisorReviewDate)
        dates.push(new Date(hotel.stats.latestTripadvisorReviewDate));

      if (dates.length > 0) {
        const earliest = dates.reduce((a, b) => (a < b ? a : b));
        earliest.setDate(earliest.getDate() - 1);
        setBackfillAsOfDate(earliest.toISOString().split("T")[0]);
      } else {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        setBackfillAsOfDate(d.toISOString().split("T")[0]);
      }
    } else {
      setBackfillAsOfDate("");
    }
    setBackfillResult(null);
  };

  const clearForm = () => {
    setEditingHotel(null);
    setActiveRequestId(null);
    setFormName("");
    setFormCity("");
    setFormCountry("");
    setFormGooglePlaceId("");
    setFormTripAdvisorId("");
    setFormTripAdvisorUrl("");
    setFormResult(null);
    setSearchResults(null);
    setBackfillAsOfDate("");
    setBackfillResult(null);
  };

  const handleSearch = async () => {
    const q = [formName, formCity].filter(Boolean).join(" ");
    if (!q.trim()) {
      setFormResult({ type: "error", message: "Enter a hotel name first." });
      return;
    }
    setSearchLoading(true);
    setSearchResults(null);
    setFormResult(null);
    try {
      const res = await fetch("/api/admin/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSearchResults(data);
    } catch (err: any) {
      setFormResult({ type: "error", message: err.message });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormResult({ type: "error", message: "Hotel name is required." });
      return;
    }
    setSaveLoading(true);
    setFormResult(null);
    try {
      const payload = {
        id: editingHotel?.id,
        name: formName.trim(),
        city: formCity.trim() || undefined,
        country: formCountry.trim() || undefined,
        googlePlaceId: formGooglePlaceId.trim() || undefined,
        tripAdvisorId: formTripAdvisorId.trim() || undefined,
        tripAdvisorUrl: formTripAdvisorUrl.trim() || undefined,
        requestId: activeRequestId || undefined,
      };
      const isEdit = !!editingHotel;
      const res = await fetch("/api/hotels", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setFormResult({
        type: "success",
        message: isEdit ? `"${data.name}" updated successfully!` : `"${data.name}" created successfully!`,
      });
      loadHotels();
      if (!isEdit) clearForm();
      else setActiveRequestId(null);
    } catch (err: any) {
      setFormResult({ type: "error", message: err.message });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleBackfill = async () => {
    if (!editingHotel) return;
    setBackfillLoading(true);
    setBackfillResult(null);
    try {
      const res = await fetch("/api/admin/backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: editingHotel.id,
          source: backfillSource,
          fetchLimit: parseInt(backfillLimit, 10) || 50,
          asOfDate: backfillAsOfDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Backfill failed");
      setBackfillResult({
        type: "success",
        message: `Fetched ${data.results.totalFetched} reviews (${data.results.newReviews} new, ${data.results.updatedReviews} updated).`,
      });
      loadHotels();
    } catch (err: any) {
      setBackfillResult({ type: "error", message: err.message });
    } finally {
      setBackfillLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsResult(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_google: providerGoogle,
          provider_tripadvisor: providerTripAdvisor,
        }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setSettingsResult({ type: "success", message: "Settings saved successfully!" });
    } catch (err: any) {
      setSettingsResult({ type: "error", message: err.message });
    } finally {
      setSettingsSaving(false);
    }
  };

  const filteredHotels = hotels.filter(h => h.name.toLowerCase().includes(hotelFilter.toLowerCase()));

  return (
    <>
      <header className="header" style={{ paddingBottom: 0 }}>
        <div className="container header-inner" style={{ marginBottom: 16 }}>
          <div className="logo">
            <div className="logo-icon">⚙️</div>
            Admin Panel
          </div>
          <div className="nav-links" style={{ flex: 1, display: "flex", gap: 24, marginLeft: 32 }}>
            <a href="/" className="nav-link">Search</a>
            <a href="/admin" className="nav-link active">Admin</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/profile" style={{ color: "var(--text-secondary)", fontSize: 13, textDecoration: "none" }}>{user.name}</a>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
          </div>
        </div>
        
        {/* Admin Tabs */}
        <div className="container" style={{ display: "flex", gap: 32, borderBottom: "1px solid var(--border-color)", paddingBottom: 0 }}>
          {["hotels", "users", "requests", "settings", "logs"].map((tab) => (
            <button 
              key={tab}
              className={`admin-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab as any)}
              style={{
                padding: "12px 0", background: "none", border: "none",
                borderBottom: activeTab === tab ? "2px solid var(--accent)" : "2px solid transparent",
                color: activeTab === tab ? "var(--text-primary)" : "var(--text-tertiary)",
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: "pointer", fontSize: 15, textTransform: "capitalize"
              }}
            >
              {tab === "requests" ? "Hotel Requests" : tab}
            </button>
          ))}
        </div>
      </header>

      <div className="container page-content" style={{ marginTop: 24 }}>
        
        {/* ========================================================= */}
        {/* TAB: HOTELS                                               */}
        {/* ========================================================= */}
        {activeTab === "hotels" && (
          <>
            <div className="stat-row">
              <div className="card card-compact stat-card">
                <div className="stat-value">{hotels.length}</div>
                <div className="stat-label">Hotels</div>
              </div>
              <div className="card card-compact stat-card">
                <div className="stat-value">
                  {hotels.reduce((acc, h) => acc + (h._count?.reviews ?? 0), 0)}
                </div>
                <div className="stat-label">Total Reviews</div>
              </div>
              <div className="card card-compact stat-card">
                <div className="stat-value">
                  {hotels.reduce((acc, h) => acc + (h.stats?.googleCount ?? 0), 0)}
                </div>
                <div className="stat-label">Google Reviews</div>
              </div>
              <div className="card card-compact stat-card">
                <div className="stat-value">
                  {hotels.reduce((acc, h) => acc + (h.stats?.tripadvisorCount ?? 0), 0)}
                </div>
                <div className="stat-label">TripAdvisor Reviews</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="section-title" style={{ margin: 0 }}>Hotels Directory</div>
              <input
                type="text"
                className="input"
                placeholder="Filter hotels..."
                value={hotelFilter}
                onChange={(e) => setHotelFilter(e.target.value)}
                style={{ width: 200, padding: "6px 12px", fontSize: 13 }}
              />
            </div>

            {hotelsLoading ? (
              <div className="hotel-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card" style={{ height: 100, opacity: 0.5 }}>
                    <div className="loading-skeleton" style={{ height: 20, width: "60%", marginBottom: 8 }} />
                    <div className="loading-skeleton" style={{ height: 14, width: "40%" }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="hotel-grid" style={{ maxHeight: 300, overflowY: "auto", paddingRight: 4, paddingBottom: 4 }}>
                <div
                  className={`card hotel-card ${!editingHotel ? "selected" : ""}`}
                  onClick={clearForm}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, cursor: "pointer", minHeight: 100, borderStyle: "dashed" }}
                >
                  <span style={{ fontSize: 28, opacity: 0.6 }}>＋</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>New Hotel</span>
                </div>
                {filteredHotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    className={`card hotel-card ${editingHotel?.id === hotel.id ? "selected" : ""}`}
                    onClick={() => selectHotel(hotel)}
                  >
                    <div className="hotel-name">{hotel.name}</div>
                    <div className="hotel-location">
                      {[hotel.city, hotel.country].filter(Boolean).join(", ") || "Location not set"}
                    </div>
                    <div className="hotel-review-count">
                      {hotel._count?.reviews ?? 0} reviews cached
                      {hotel.stats?.lastFetchDate && (
                        <span style={{ display: "block", fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                          Last fill: {new Date(hotel.stats.lastFetchDate).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      {hotel.googlePlaceId && <span className="badge badge-google">Google</span>}
                      {(hotel.tripAdvisorId || hotel.tripAdvisorUrl) && <span className="badge badge-tripadvisor">TA</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="admin-layout">
              {/* Left: Hotel Form */}
              <div className="admin-section">
                <div className="section-title" style={{ marginTop: 32 }}>
                  {editingHotel ? `Edit — ${editingHotel.name}` : "Add New Hotel"}
                </div>
                <div className="card">
                  <form onSubmit={handleSave}>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label>Hotel Name *</label>
                      <input className="input" placeholder="e.g. The Ritz-Carlton" value={formName} onChange={(e) => setFormName(e.target.value)} />
                    </div>
                    <div className="form-row" style={{ marginBottom: 12 }}>
                      <div className="form-group">
                        <label>City</label>
                        <input className="input" placeholder="e.g. London" value={formCity} onChange={(e) => setFormCity(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Country</label>
                        <input className="input" placeholder="e.g. UK" value={formCountry} onChange={(e) => setFormCountry(e.target.value)} />
                      </div>
                    </div>

                    <button type="button" className="btn btn-secondary" disabled={searchLoading || !formName.trim()} onClick={handleSearch} style={{ width: "100%", marginBottom: 16 }}>
                      {searchLoading ? <span className="spinner" /> : "🔍 Search Google & TripAdvisor IDs"}
                    </button>

                    {/* Unified Search Results */}
                    {searchResults && (
                      <div className="card card-compact" style={{ marginBottom: 16, background: "var(--bg-glass)", maxHeight: 360, overflowY: "auto" }}>
                        {searchResults.merged?.length > 0 ? (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Unified Search Results</div>
                            {searchResults.merged.map((r: any, i: number) => (
                              <div 
                                key={i} 
                                onClick={() => { 
                                  if (r.googlePlaceId) setFormGooglePlaceId(r.googlePlaceId); 
                                  if (r.tripadvisorId) {
                                    setFormTripAdvisorId(r.tripadvisorId);
                                    setFormTripAdvisorUrl(`https://www.tripadvisor.com/Hotel_Review-d${r.tripadvisorId}`);
                                  }
                                  if (r.city && !formCity) setFormCity(r.city); 
                                  if (r.countryCode && !formCountry) setFormCountry(r.countryCode); 
                                }} 
                                style={{ padding: "10px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 13, transition: "background 0.15s", borderBottom: "1px solid rgba(255,255,255,0.05)" }} 
                                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-glass-hover)")} 
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                                {r.address && <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>{r.address}</div>}
                                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                  {r.googlePlaceId ? (
                                    <span className="badge badge-google" style={{ fontSize: 10 }}>Google: {r.googlePlaceId}</span>
                                  ) : (
                                    <span className="badge" style={{ fontSize: 10, background: "transparent", border: "1px dashed var(--border-color)", color: "var(--text-tertiary)" }}>No Google ID</span>
                                  )}
                                  {r.tripadvisorId ? (
                                    <span className="badge badge-tripadvisor" style={{ fontSize: 10 }}>TA: d{r.tripadvisorId}</span>
                                  ) : (
                                    <span className="badge" style={{ fontSize: 10, background: "transparent", border: "1px dashed var(--border-color)", color: "var(--text-tertiary)" }}>No TA ID</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: "center", padding: 16, color: "var(--text-tertiary)", fontSize: 13 }}>No results found.</div>
                        )}
                      </div>
                    )}

                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label>Google Place ID</label>
                      <input className="input" value={formGooglePlaceId} onChange={(e) => setFormGooglePlaceId(e.target.value)} />
                    </div>
                    <div className="form-row" style={{ marginBottom: 12 }}>
                      <div className="form-group">
                        <label>TripAdvisor ID</label>
                        <input className="input" value={formTripAdvisorId} onChange={(e) => setFormTripAdvisorId(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>TripAdvisor URL</label>
                        <input className="input" value={formTripAdvisorUrl} onChange={(e) => setFormTripAdvisorUrl(e.target.value)} />
                      </div>
                    </div>

                    {formResult && (
                      <div className={`toast ${formResult.type === "success" ? "toast-success" : "toast-error"}`} style={{ position: "relative", bottom: "auto", right: "auto", marginBottom: 12, maxWidth: "100%" }}>
                        {formResult.message}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button type="submit" className="btn btn-primary" disabled={saveLoading} style={{ flex: 1 }}>
                        {saveLoading ? <span className="spinner" /> : editingHotel ? "Save Changes" : "Add Hotel"}
                      </button>
                      {editingHotel && (
                        <button type="button" className="btn btn-ghost" onClick={clearForm}>Cancel</button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Right: Backfill */}
              <div className="admin-section">
                <div className="section-title" style={{ marginTop: 32 }}>
                  Backfill Reviews {editingHotel && <span style={{ color: "var(--accent)", textTransform: "none", fontWeight: 400, letterSpacing: 0 }}> — {editingHotel.name}</span>}
                </div>
                <div className="card">
                  {!editingHotel ? (
                    <div className="empty-state" style={{ padding: 32 }}>
                      <div className="empty-state-icon">📥</div>
                      <h3>Select a hotel</h3>
                      <p>Click on a hotel above to configure and run a backfill.</p>
                    </div>
                  ) : (
                    <>
                      {editingHotel.stats && (
                        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                          <div className="card card-compact" style={{ flex: 1, textAlign: "center", background: "var(--bg-glass)" }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-hover)" }}>{editingHotel.stats.googleCount}</div>
                            <div className="stat-label">Google</div>
                            {editingHotel.stats.latestGoogleReviewDate && (
                              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>Latest: {new Date(editingHotel.stats.latestGoogleReviewDate).toLocaleDateString()}</div>
                            )}
                          </div>
                          <div className="card card-compact" style={{ flex: 1, textAlign: "center", background: "var(--bg-glass)" }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--green)" }}>{editingHotel.stats.tripadvisorCount}</div>
                            <div className="stat-label">TripAdvisor</div>
                            {editingHotel.stats.latestTripadvisorReviewDate && (
                              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>Latest: {new Date(editingHotel.stats.latestTripadvisorReviewDate).toLocaleDateString()}</div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="form-row" style={{ marginBottom: 12 }}>
                        <div className="form-group">
                          <label>Source</label>
                          <select className="select" value={backfillSource} onChange={(e) => setBackfillSource(e.target.value)}>
                            <option value="both">Both</option>
                            <option value="google">Google</option>
                            <option value="tripadvisor">TripAdvisor</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Fetch Limit</label>
                          <input className="input" type="number" value={backfillLimit} onChange={(e) => setBackfillLimit(e.target.value)} />
                        </div>
                      </div>

                      <div className="form-group" style={{ marginBottom: 16 }}>
                        <label>Reviews Since Date</label>
                        <input className="input" type="date" value={backfillAsOfDate} onChange={(e) => setBackfillAsOfDate(e.target.value)} />
                      </div>

                      {backfillResult && (
                        <div className={`toast ${backfillResult.type === "success" ? "toast-success" : "toast-error"}`} style={{ position: "relative", bottom: "auto", right: "auto", marginBottom: 12, maxWidth: "100%" }}>
                          {backfillResult.message}
                        </div>
                      )}

                      <button className="btn btn-primary" disabled={backfillLoading} onClick={handleBackfill} style={{ width: "100%" }}>
                        {backfillLoading ? <span className="spinner" /> : "Run Backfill"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB: USERS                                                */}
        {/* ========================================================= */}
        {activeTab === "users" && (
          <div>
            <div className="section-title">User Management</div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {usersLoading ? (
                <div style={{ textAlign: "center", padding: 48 }}><span className="spinner" /></div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-glass)", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Name</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Email</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Role</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Status</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Verified</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{u.email}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <select className="select" style={{ padding: "4px 8px", fontSize: 12 }} value={u.role} onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <select className="select" style={{ padding: "4px 8px", fontSize: 12, background: u.status === 'pending' ? 'rgba(255,149,0,0.1)' : 'rgba(52,199,89,0.1)', color: u.status === 'pending' ? 'var(--orange)' : 'var(--green)' }} value={u.status} onChange={(e) => handleUpdateUserStatus(u.id, e.target.value)}>
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <select className="select" style={{ padding: "4px 8px", fontSize: 12, background: !u.emailVerified ? 'rgba(255,59,48,0.1)' : 'rgba(52,199,89,0.1)', color: !u.emailVerified ? 'var(--red)' : 'var(--green)' }} value={u.emailVerified ? "true" : "false"} onChange={(e) => handleUpdateUserVerification(u.id, e.target.value === "true")}>
                            <option value="false">Unverified</option>
                            <option value="true">Verified</option>
                          </select>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteUser(u.id)} style={{ color: "var(--red)" }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: REQUESTS                                             */}
        {/* ========================================================= */}
        {activeTab === "requests" && (
          <div>
            <div className="section-title">Hotel Requests</div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {requestsLoading ? (
                <div style={{ textAlign: "center", padding: 48 }}><span className="spinner" /></div>
              ) : requests.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48, color: "var(--text-tertiary)" }}>No hotel requests.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-glass)", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Hotel Name</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Location</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Requested By</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Status</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{r.name}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{[r.city, r.state, r.country].filter(Boolean).join(", ")}</td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{r.user.name} ({r.user.email})</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                            background: r.status === 'approved' ? 'rgba(52, 199, 89, 0.15)' : r.status === 'rejected' ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 149, 0, 0.15)',
                            color: r.status === 'approved' ? 'var(--green)' : r.status === 'rejected' ? 'var(--red)' : 'var(--orange)'
                          }}>
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          {r.status === 'pending' && (
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button className="btn btn-primary btn-sm" onClick={() => {
                                setActiveRequestId(r.id);
                                setFormName(r.name);
                                setFormCity(r.city || "");
                                setFormCountry(r.country || "");
                                setActiveTab("hotels");
                              }}>Approve / Create</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateRequest(r.id, "reject")}>Reject</button>
                            </div>
                          )}
                          {r.adminNote && (
                            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>Note: {r.adminNote}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: SETTINGS                                             */}
        {/* ========================================================= */}
        {activeTab === "settings" && (
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div className="section-title">Global Provider Settings</div>
            <div className="card">
              <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 14 }}>
                Configure which external vendor API is used by default for fetching reviews. 
                If the selected provider fails during a fetch, the system will automatically fall back to the alternate provider.
              </p>

              {settingsLoading ? (
                <div style={{ textAlign: "center", padding: 32 }}><span className="spinner" /></div>
              ) : (
                <form onSubmit={handleSaveSettings}>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label>Default Google Reviews Provider</label>
                    <select className="select" value={providerGoogle} onChange={(e) => setProviderGoogle(e.target.value)}>
                      <option value="rapidapi">RapidAPI (local-business-data)</option>
                      <option value="apify">Apify (Google Maps Scraper)</option>
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 24 }}>
                    <label>Default TripAdvisor Reviews Provider</label>
                    <select className="select" value={providerTripAdvisor} onChange={(e) => setProviderTripAdvisor(e.target.value)}>
                      <option value="rapidapi">RapidAPI (TripAdvisor-com1)</option>
                      <option value="apify">Apify (TripAdvisor Scraper)</option>
                    </select>
                  </div>

                  {settingsResult && (
                    <div className={`toast ${settingsResult.type === "success" ? "toast-success" : "toast-error"}`} style={{ position: "relative", bottom: "auto", right: "auto", marginBottom: 16, maxWidth: "100%" }}>
                      {settingsResult.message}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" disabled={settingsSaving}>
                    {settingsSaving ? <span className="spinner" /> : "Save Settings"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: LOGS                                                 */}
        {/* ========================================================= */}
        {activeTab === "logs" && (
          <div>
            <div className="section-title">System Logs</div>
            
            <div className="card" style={{ marginBottom: 16, padding: "16px 20px" }}>
              <div className="form-row" style={{ gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: 11 }}>Level</label>
                  <select className="select" value={logFilterLevel} onChange={(e) => { setLogFilterLevel(e.target.value); setTimeout(loadLogs, 0); }} style={{ padding: "8px 12px", fontSize: 13 }}>
                    <option value="">All Levels</option>
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: 11 }}>Source</label>
                  <select className="select" value={logFilterSource} onChange={(e) => { setLogFilterSource(e.target.value); setTimeout(loadLogs, 0); }} style={{ padding: "8px 12px", fontSize: 13 }}>
                    <option value="">All Sources</option>
                    <option value="cron">CRON</option>
                    <option value="apify">APIFY</option>
                    <option value="rapidapi">RAPIDAPI</option>
                    <option value="system">SYSTEM</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: 11 }}>Start Date</label>
                  <input type="date" className="input" value={logFilterStartDate} onChange={(e) => { setLogFilterStartDate(e.target.value); setTimeout(loadLogs, 0); }} style={{ padding: "8px 12px", fontSize: 13 }} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontSize: 11 }}>End Date</label>
                  <input type="date" className="input" value={logFilterEndDate} onChange={(e) => { setLogFilterEndDate(e.target.value); setTimeout(loadLogs, 0); }} style={{ padding: "8px 12px", fontSize: 13 }} />
                </div>
                <div className="form-group" style={{ flex: 0.5 }}>
                  <label style={{ fontSize: 11 }}>Limit</label>
                  <select className="select" value={logLimit} onChange={(e) => { setLogLimit(e.target.value); setTimeout(loadLogs, 0); }} style={{ padding: "8px 12px", fontSize: 13 }}>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="500">500</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {logsLoading ? (
                <div style={{ textAlign: "center", padding: 48 }}><span className="spinner" /></div>
              ) : logs.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48, color: "var(--text-tertiary)" }}>No logs found matching criteria.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-glass)", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Timestamp</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Level</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Source</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Message</th>
                      <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>Hotel ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "12px 16px", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                            background: log.level === "ERROR" ? "rgba(255, 59, 48, 0.15)" : log.level === "WARN" ? "rgba(255, 149, 0, 0.15)" : "rgba(52, 199, 89, 0.15)",
                            color: log.level === "ERROR" ? "var(--red)" : log.level === "WARN" ? "var(--orange)" : "var(--green)"
                          }}>
                            {log.level}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                          {log.source}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ color: "var(--text-primary)" }}>{log.message}</div>
                          {log.details && (
                            <details style={{ marginTop: 8 }}>
                              <summary style={{ cursor: "pointer", fontSize: 11, color: "var(--accent)" }}>View Details</summary>
                              <pre style={{ margin: "8px 0 0", padding: 8, background: "rgba(0,0,0,0.3)", borderRadius: 4, overflowX: "auto", fontSize: 11, color: "var(--text-tertiary)" }}>
                                {log.details}
                              </pre>
                            </details>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", color: "var(--text-tertiary)", fontFamily: "monospace", fontSize: 11 }}>
                          {log.hotelId || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
