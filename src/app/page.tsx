"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";

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
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"both" | "google" | "tripadvisor">(
    "both"
  );
  const [asOfDate, setAsOfDate] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch hotels on mount
  useEffect(() => {
    fetch("/api/hotels")
      .then((r) => r.json())
      .then((data) => {
        setHotels(data);
        setHotelsLoading(false);
      })
      .catch(() => {
        setError("Failed to load hotels");
        setHotelsLoading(false);
      });
  }, []);

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

        if (!res.ok) throw new Error("Search failed");

        const data: SearchResponse = await res.json();
        setResults(data);
        setPage(targetPage);
      } catch {
        setError("Search failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [selectedHotel, query, source, asOfDate]
  );

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="container header-inner">
          <div className="logo">
            <div className="logo-icon">🔍</div>
            Hotel Review Search
          </div>
          <div className="nav-links">
            <a href="/" className="nav-link active">
              Search
            </a>
            <a href="/admin" className="nav-link">
              Admin
            </a>
          </div>
        </div>
      </header>

      <div className="container page-content">
        {/* Hotel Selection */}
        <div className="section-title">Select a Hotel</div>

        {hotelsLoading ? (
          <div className="hotel-grid">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card"
                style={{ height: 100, opacity: 0.5 }}
              >
                <div
                  className="loading-skeleton"
                  style={{ height: 20, width: "60%", marginBottom: 8 }}
                />
                <div
                  className="loading-skeleton"
                  style={{ height: 14, width: "40%" }}
                />
              </div>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏨</div>
            <h3>No hotels configured</h3>
            <p>
              Go to the{" "}
              <a href="/admin" style={{ color: "var(--accent)" }}>
                Admin page
              </a>{" "}
              to add hotels.
            </p>
          </div>
        ) : (
          <div className="hotel-grid">
            {hotels.map((hotel) => (
              <div
                key={hotel.id}
                className={`card hotel-card ${
                  selectedHotel?.id === hotel.id ? "selected" : ""
                }`}
                onClick={() => setSelectedHotel(hotel)}
              >
                <div className="hotel-name">{hotel.name}</div>
                <div className="hotel-location">
                  {[hotel.city, hotel.country].filter(Boolean).join(", ") ||
                    "Location not set"}
                </div>
                <div className="hotel-review-count">
                  {hotel._count?.reviews ?? 0} reviews cached
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {hotel.googlePlaceId && (
                    <span className="badge badge-google">Google</span>
                  )}
                  {(hotel.tripAdvisorId || hotel.tripAdvisorUrl) && (
                    <span className="badge badge-tripadvisor">TripAdvisor</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search Form */}
        {selectedHotel && (
          <div className="search-section">
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
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                >
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
                    onChange={(e) =>
                      setSource(
                        e.target.value as "both" | "google" | "tripadvisor"
                      )
                    }
                    style={{ minWidth: 160 }}
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
                    style={{ minWidth: 160 }}
                  />
                </div>

                {asOfDate && (
                  <div className="filter-group" style={{ justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setAsOfDate("")}
                    >
                      ✕ Clear date
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="toast toast-error"
            style={{ position: "relative", bottom: "auto", right: "auto", marginBottom: 16 }}
          >
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div>
            <div className="results-header">
              <div className="results-count">
                Found <strong>{results.totalCount}</strong> matching review{results.totalCount !== 1 ? "s" : ""}
                {results.query && <> for &ldquo;{results.query}&rdquo;</>}
              </div>

              {results.asOfDate && (
                <div className="as-of-info">
                  📅 Showing reviews since{" "}
                  {new Date(results.asOfDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {results.results.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>No matching reviews</h3>
                <p>
                  Try a different search term, clear the date filter, or fetch
                  more reviews from the Admin page.
                </p>
              </div>
            ) : (
              <div className="results-list">
                {results.results.map((result) => (
                  <ReviewCard key={result.review.id} result={result} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {results && results.totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 16,
                  marginTop: 24,
                }}
              >
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

/* ── Review Card Component ─────────────────────────────────── */

function ReviewCard({ result }: { result: SearchResult }) {
  const { review, highlightedText } = result;

  const stars = review.rating
    ? Array.from({ length: 5 }, (_, i) =>
        i < review.rating! ? "★" : "☆"
      )
    : [];

  const dateStr = review.reviewDate
    ? new Date(review.reviewDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      className={`card review-card source-${review.source}`}
    >
      <div className="review-header">
        <div className="review-author">
          <span
            className={`badge badge-${review.source}`}
          >
            {review.source === "google" ? "Google" : "TripAdvisor"}
          </span>
          <span className="review-author-name">{review.authorName}</span>
          {stars.length > 0 && (
            <div className="stars">
              {stars.map((s, i) => (
                <span
                  key={i}
                  className={s === "★" ? "star-filled" : "star-empty"}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        {dateStr && <span className="review-date">{dateStr}</span>}
      </div>

      <div
        className="review-text"
        dangerouslySetInnerHTML={{ __html: highlightedText }}
      />

      <div className="review-footer">
        <span className="review-date">
          Match #{result.matchRank}
        </span>

        {review.reviewLink && (
          <a
            href={review.reviewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="review-link"
          >
            View original →
          </a>
        )}
      </div>
    </div>
  );
}
