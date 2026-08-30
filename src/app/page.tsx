"use client";

import { useState, useEffect, useCallback, FormEvent, useRef } from "react";
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

interface Review {
  id: string;
  hotelId: string;
  source: string;
  authorName: string;
  authorUrl: string | null;
  rating: number | null;
  text: string;
  reviewDate: string | null;
  reviewLink: string | null;
  hotel?: Hotel;
}

interface SearchResult {
  review: Review;
  highlightedText: string;
  matchRank: number;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  query: string;
  asOfDate: string | null;
  searchedAt: string;
}

/* ── Main Page Component ───────────────────────────────────── */

export default function Home() {
  const { user, loading: userLoading, logout } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  const [hotelFilter, setHotelFilter] = useState("");

  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"both" | "google" | "tripadvisor">("both");
  const [asOfDate, setAsOfDate] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [error, setError] = useState("");

  const searchSectionRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetch("/api/hotel-requests/notifications")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setNotifications(data);
          }
        })
        .catch(console.error);
    }
  }, [user, userLoading, router]);

  const dismissNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await fetch("/api/hotel-requests/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] })
      });
    } catch (err) {
      console.error("Failed to dismiss notification", err);
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      const hash = window.location.hash;
      if (hash === "#search") {
        setResults(null);
        setTimeout(() => {
          searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      } else if (hash === "" || hash === "#") {
        setSelectedHotel(null);
        setResults(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Fetch hotels and favourites on mount
  useEffect(() => {
    if (user && user.status === 'active') {
      fetch("/api/hotels")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setHotels(data);
          setHotelsLoading(false);
        })
        .catch(() => {
          setError("Failed to load hotels");
          setHotelsLoading(false);
        });

      fetch("/api/favourites")
        .then((r) => r.json())
        .then((data) => {
          if (data.favourites) setFavourites(data.favourites);
        });
    } else {
      setHotelsLoading(false);
    }
  }, [user]);



  // Auto-scroll to results when they are loaded
  useEffect(() => {
    if (results && resultsSectionRef.current) {
      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [results, page]);

  const handleSearch = useCallback(
    async (e?: FormEvent, targetPage: number = 1) => {
      if (e) e.preventDefault();
      if (!selectedHotel) return;

      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/reviews/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: query.trim(),
            hotelId: selectedHotel.id,
            source: source === "both" ? undefined : source,
            asOfDate: asOfDate || undefined,
            page: targetPage,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");

        setResults(data);
        setPage(targetPage);
        
        if (window.location.hash !== "#results") {
          window.history.pushState({ step: "results" }, "", "#results");
        }
      } catch (err: any) {
        setError(err.message || "Search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [selectedHotel, query, source, asOfDate]
  );

  const handleSelectHotel = useCallback((hotel: Hotel) => {
    if (selectedHotel?.id === hotel.id) {
      if (window.location.hash !== "#search" && window.location.hash !== "#results") {
        window.history.pushState({ step: "search" }, "", "#search");
      }
      return;
    }
    
    // Compute default date based on stats
    if (hotel.stats) {
      const { googleCount, tripadvisorCount, latestGoogleReviewDate, latestTripadvisorReviewDate } = hotel.stats;
      if (googleCount > 0 && tripadvisorCount > 0 && latestGoogleReviewDate && latestTripadvisorReviewDate) {
        const d1 = new Date(latestGoogleReviewDate);
        const d2 = new Date(latestTripadvisorReviewDate);
        const minDate = d1 < d2 ? d1 : d2;
        minDate.setDate(minDate.getDate() - 1); // reduce 1 day from that date
        setAsOfDate(minDate.toISOString().split('T')[0]);
      } else if (googleCount === 0 || tripadvisorCount === 0) {
        const d = new Date();
        d.setMonth(d.getMonth() - 1); // 1 month ago
        setAsOfDate(d.toISOString().split('T')[0]);
      }
    } else {
      setAsOfDate("");
    }

    setSelectedHotel(hotel);
    setResults(null);
    if (window.location.hash !== "#search") {
      window.history.pushState({ step: "search" }, "", "#search");
    }
  }, [selectedHotel]);

  const toggleFavourite = async (e: React.MouseEvent, hotelId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.action === "added") setFavourites(prev => [...prev, hotelId]);
        else setFavourites(prev => prev.filter(id => id !== hotelId));
      }
    } catch (error) {
      console.error("Failed to toggle favourite", error);
    }
  };

  if (userLoading || !user) {
    return (
      <>
        <header className="header">
          <div className="container header-inner" style={{ justifyContent: "space-between" }}>
            <div className="logo"><div className="logo-icon">🔍</div>Hotel Review Search</div>
            <button className="btn btn-ghost" onClick={logout} disabled>Logout</button>
          </div>
        </header>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
          <span className="spinner" style={{ width: 64, height: 64, borderWidth: 6, borderTopColor: "var(--accent)" }} />
        </div>
      </>
    );
  }

  if (user.status === 'pending') {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header className="header">
          <div className="container header-inner" style={{ justifyContent: "space-between" }}>
            <div className="logo"><div className="logo-icon">🔍</div>Hotel Review Search</div>
            <button className="btn btn-ghost" onClick={logout}>Logout</button>
          </div>
        </header>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 500, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2>Account Pending Approval</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>
              Your account is currently waiting for an administrator to approve it. 
              Once approved, you will be able to access the hotel review search platform.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort hotels
  let filteredHotels = hotels.filter(h => h.name.toLowerCase().includes(hotelFilter.toLowerCase()));
  if (showFavouritesOnly) {
    filteredHotels = filteredHotels.filter(h => favourites.includes(h.id));
  } else {
    // Sort favourites first
    filteredHotels.sort((a, b) => {
      const aFav = favourites.includes(a.id) ? 1 : 0;
      const bFav = favourites.includes(b.id) ? 1 : 0;
      return bFav - aFav; // favourites come first
    });
  }

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div className="logo">
            <div className="logo-icon">🔍</div>
            Hotel Review Search
          </div>
          <div className="nav-links" style={{ flex: 1, display: "flex", gap: 24, marginLeft: 32 }}>
            <a href="/" className="nav-link active">Search</a>
            {user.role === 'admin' && <a href="/admin" className="nav-link">Admin</a>}
            {user.role !== 'admin' && <a href="/request-hotel" className="nav-link">Request Hotel</a>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/profile" style={{ color: "var(--text-secondary)", fontSize: 13, textDecoration: "none" }}>{user.name}</a>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      {/* Notifications Area */}
      {notifications.length > 0 && (
        <div className="container" style={{ marginTop: 24 }}>
          {notifications.map(n => (
            <div key={n.id} style={{
              background: "rgba(52, 199, 89, 0.1)",
              border: "1px solid rgba(52, 199, 89, 0.2)",
              padding: "16px 20px",
              borderRadius: "var(--radius-md)",
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <strong style={{ color: "var(--green)", display: "block", marginBottom: 4 }}>Hotel Request Approved!</strong>
                <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                  Your request to add <strong>{n.name}</strong> has been approved. The hotel is now available for search.
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => dismissNotification(n.id)} style={{ color: "var(--text-tertiary)" }}>
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main View: Hotel List */}
      <div className="container page-content">
        {!selectedHotel && (
        <div className="section-wrapper">
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16 }}>
            <div className="section-title" style={{ margin: 0 }}>Select a Hotel</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={showFavouritesOnly} onChange={(e) => setShowFavouritesOnly(e.target.checked)} />
                Favourites Only
              </label>
              <input
                type="text"
                className="input"
                placeholder="Filter hotels..."
                value={hotelFilter}
                onChange={(e) => setHotelFilter(e.target.value)}
                style={{ width: "100%", maxWidth: 200, padding: "6px 12px", fontSize: 13 }}
              />
            </div>
          </div>

          {hotelsLoading ? (
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "30vh" }}>
              <span className="spinner" style={{ width: 64, height: 64, borderWidth: 6, borderTopColor: "var(--accent)" }} />
            </div>
          ) : hotels.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏨</div>
              <h3>No hotels configured</h3>
              <p>Wait for an admin to add hotels or <a href="/request-hotel" style={{ color: "var(--accent)" }}>request a new one</a>.</p>
            </div>
          ) : (
            <div className="hotel-grid" style={{ maxHeight: 500, overflowY: "auto", paddingRight: 4, paddingBottom: 4 }}>
              {filteredHotels.length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 24, color: "var(--text-tertiary)" }}>No hotels found.</div>
              )}
              {filteredHotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="card hotel-card"
                  onClick={() => handleSelectHotel(hotel)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div className="hotel-name">{hotel.name}</div>
                    <button
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: favourites.includes(hotel.id) ? "var(--yellow)" : "var(--text-tertiary)", padding: 0, lineHeight: 1 }}
                      onClick={(e) => toggleFavourite(e, hotel.id)}
                    >
                      {favourites.includes(hotel.id) ? "★" : "☆"}
                    </button>
                  </div>
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
        </div>
        )}

        {selectedHotel && (
          <div className="section-wrapper search-section" ref={searchSectionRef}>
            <button className="btn btn-ghost" onClick={() => setSelectedHotel(null)} style={{ marginBottom: 16, padding: "6px 12px", alignSelf: "flex-start" }}>← Back to Hotel List</button>
            <div className="section-title">
              Search Reviews — {selectedHotel.name}
            </div>

            <form onSubmit={handleSearch}>
              <div className="search-form">
                <div className="search-input-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="input input-lg"
                    placeholder="Search for keywords in reviews..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ paddingLeft: 48 }}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? <span className="spinner" /> : "Search"}
                </button>
              </div>

              <div className="search-filters">
                <div className="filter-group">
                  <label htmlFor="source-filter">Source</label>
                  <select
                    id="source-filter"
                    className="select"
                    value={source}
                    onChange={(e) => setSource(e.target.value as "both" | "google" | "tripadvisor")}
                    style={{ flex: 1, minWidth: 120 }}
                  >
                    <option value="both">Both</option>
                    <option value="google">Google Maps</option>
                    <option value="tripadvisor">TripAdvisor</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="date-filter">Reviews since</label>
                  <input
                    id="date-filter"
                    type="date"
                    className="input"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                    style={{ flex: 1, minWidth: 120 }}
                  />
                </div>

                {asOfDate && (
                  <div className="filter-group" style={{ justifyContent: "flex-end" }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAsOfDate("")}>✕ Clear date</button>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="toast toast-error" style={{ position: "relative", bottom: "auto", right: "auto", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {results && (
          <div className="section-wrapper results-wrapper" ref={resultsSectionRef}>
            <button 
              className="btn btn-ghost" 
              onClick={() => { window.history.back(); }} 
              style={{ marginBottom: 16, padding: "6px 12px", alignSelf: "flex-start" }}
            >
              ← Back to Search Criteria
            </button>
            <div className="results-header">
              <div className="results-count">
                Found <strong>{results.totalCount}</strong> matching review{results.totalCount !== 1 ? "s" : ""}
                {results.query && <> for &ldquo;{results.query}&rdquo;</>}
              </div>

              {results.asOfDate && (
                <div className="as-of-info">
                  📅 Showing reviews since {new Date(results.asOfDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {results.results.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>No matching reviews</h3>
                <p>Try a different search term, clear the date filter, or fetch more reviews.</p>
              </div>
            ) : (
              <div className="results-list">
                {results.results.map((result) => (
                  <ReviewCard key={result.review.id} result={result} />
                ))}
              </div>
            )}

            {results && results.totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 24 }}>
                <button
                  className="btn btn-secondary"
                  disabled={results.currentPage === 1 || loading}
                  onClick={() => handleSearch(undefined, results.currentPage - 1)}
                >
                  &larr; Prev
                </button>
                <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                  Page {results.currentPage} of {results.totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={results.currentPage === results.totalPages || loading}
                  onClick={() => handleSearch(undefined, results.currentPage + 1)}
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ReviewCard({ result }: { result: SearchResult }) {
  const { review, highlightedText } = result;

  const stars = review.rating
    ? Array.from({ length: 5 }, (_, i) => (i < review.rating! ? "★" : "☆"))
    : [];

  const dateStr = review.reviewDate
    ? new Date(review.reviewDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : null;

  return (
    <div className={`card review-card source-${review.source}`}>
      <div className="review-header">
        <div className="review-author">
          <span className={`badge badge-${review.source}`}>
            {review.source === "google" ? "Google" : "TripAdvisor"}
          </span>
          <span className="review-author-name">{review.authorName}</span>
          {stars.length > 0 && (
            <div className="stars">
              {stars.map((s, i) => (
                <span key={i} className={s === "★" ? "star-filled" : "star-empty"}>{s}</span>
              ))}
            </div>
          )}
        </div>
        {dateStr && <span className="review-date">{dateStr}</span>}
      </div>

      <div className="review-text" dangerouslySetInnerHTML={{ __html: highlightedText }} />

      <div className="review-footer">
        <span className="review-date">Match #{result.matchRank}</span>
        {review.reviewLink && (
          <a href={review.reviewLink} target="_blank" rel="noopener noreferrer" className="review-link">
            View original →
          </a>
        )}
      </div>
    </div>
  );
}
