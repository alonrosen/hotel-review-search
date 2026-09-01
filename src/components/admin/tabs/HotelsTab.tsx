import React, { useState, useEffect } from 'react';
import HotelCard from '../../shared/HotelCard';

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

export default function HotelsTab({ hotels, loadHotels, hotelsLoading }: { hotels: Hotel[], loadHotels: () => void, hotelsLoading: boolean }) {
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [hotelViewState, setHotelViewState] = useState<"list" | "menu" | "edit" | "backfill" | "new">("list");
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

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state && e.state.hotelViewState) {
        setHotelViewState(e.state.hotelViewState);
      } else {
        setHotelViewState("list");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

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
    setHotelViewState("menu");
    window.history.pushState({ hotelViewState: "menu" }, "", "#menu");
  };

  const clearForm = () => {
    setEditingHotel(null);
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

  const handleNewHotel = () => {
    clearForm();
    setHotelViewState("new");
    window.history.pushState({ hotelViewState: "new" }, "", "#new");
  };

  const handleGoBack = () => {
    window.history.back();
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

  const filteredHotels = hotels.filter(h => h.name.toLowerCase().includes(hotelFilter.toLowerCase()));

  const isManagingHotel = editingHotel && (hotelViewState === "menu" || hotelViewState === "edit" || hotelViewState === "backfill");

  const editFormJsx = (
    <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <form onSubmit={handleSave} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
            {saveLoading ? <span className="spinner" /> : editingHotel ? "Save Changes" : "Create Hotel"}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      {hotelViewState === "list" && (
        <>
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
                <div key={i} className="card" style={{ height: 80, opacity: 0.5 }}>
                  <div className="loading-skeleton" style={{ height: 16, width: "60%", marginBottom: 8 }} />
                  <div className="loading-skeleton" style={{ height: 12, width: "40%" }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="hotel-grid" style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto", paddingRight: 4, paddingBottom: 4 }}>
              <div
                className="card hotel-card selected"
                onClick={handleNewHotel}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, cursor: "pointer", minHeight: 80, borderStyle: "dashed" }}
              >
                <span style={{ fontSize: 24, opacity: 0.6 }}>＋</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Create New Hotel</span>
              </div>
              {filteredHotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  onClick={() => selectHotel(hotel)}
                  variant="admin"
                />
              ))}
            </div>
          )}
        </>
      )}

      {isManagingHotel && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 0", display: "flex", flexDirection: "column" }}>
          <button className="btn btn-ghost desktop-only" onClick={handleGoBack} style={{ marginBottom: 16, padding: "6px 12px", alignSelf: "flex-start" }}>← Back to Directory</button>
          <div className="admin-layout">
          {hotelViewState === "menu" && (
            <div className="mobile-only" style={{ width: "100%" }}>
              <button className="btn btn-ghost" onClick={handleGoBack} style={{ marginBottom: 16, padding: "6px 12px", alignSelf: "flex-start" }}>← Back to Directory</button>
              <div className="section-title">Manage: {editingHotel.name}</div>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { setHotelViewState("edit"); window.history.pushState({ hotelViewState: "edit" }, "", "#edit"); }}
                  style={{ padding: 16, justifyContent: "flex-start", fontSize: 15 }}
                >
                  ✏️ Edit Hotel Details
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => { setHotelViewState("backfill"); window.history.pushState({ hotelViewState: "backfill" }, "", "#backfill"); }}
                  style={{ padding: 16, justifyContent: "flex-start", fontSize: 15 }}
                >
                  📥 Backfill Reviews
                </button>
              </div>
            </div>
          )}
          
          <div className={`admin-section ${hotelViewState === "edit" ? "" : "desktop-only"}`} style={{ display: "flex", flexDirection: "column" }}>
            <button className="btn btn-ghost mobile-only" onClick={handleGoBack} style={{ marginBottom: 16, padding: "6px 12px", alignSelf: "flex-start" }}>← Back to Directory</button>
            <div className="section-title">Edit — {editingHotel.name}</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {editFormJsx}
            </div>
          </div>

          <div className={`admin-section ${hotelViewState === "backfill" ? "" : "desktop-only"}`} style={{ display: "flex", flexDirection: "column" }}>
            <button className="btn btn-ghost mobile-only" onClick={handleGoBack} style={{ marginBottom: 16, padding: "6px 12px", alignSelf: "flex-start" }}>← Back to Directory</button>
            <div className="section-title">Backfill Reviews — {editingHotel.name}</div>
            <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
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
            </div>
          </div>
        </div>
        </div>
      )}

      {hotelViewState === "new" && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 0" }}>
          <button className="btn btn-ghost" onClick={handleGoBack} style={{ marginBottom: 16, padding: "6px 12px", alignSelf: "flex-start" }}>← Back to Directory</button>
          <div className="section-title">Add New Hotel</div>
          {editFormJsx}
        </div>
      )}
    </>
  );
}
