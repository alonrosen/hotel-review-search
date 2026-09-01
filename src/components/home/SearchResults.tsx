import React from 'react';

export interface Hotel {
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

export interface Review {
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

export interface SearchResultType {
  review: Review;
  highlightedText: string;
  matchRank: number;
}

export interface SearchResponseType {
  results: SearchResultType[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  query: string;
  asOfDate: string | null;
  searchedAt: string;
}

interface SearchResultsProps {
  results: SearchResponseType | null;
  loading: boolean;
  handleSearch: (e?: React.FormEvent, targetPage?: number) => void;
  resultsSectionRef: React.RefObject<HTMLDivElement | null>;
}

export default function SearchResults({
  results,
  loading,
  handleSearch,
  resultsSectionRef
}: SearchResultsProps) {
  if (!results && !loading) return null;

  return (
    <div className="section-wrapper results-wrapper" ref={resultsSectionRef}>
      <button 
        className="btn btn-ghost" 
        onClick={() => { window.history.back(); }} 
        style={{ marginBottom: 16, padding: "6px 12px", alignSelf: "flex-start" }}
      >
        ← Back to Search Criteria
      </button>
      {loading ? (
        <div className="results-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="card review-card" style={{ opacity: 0.6 }}>
              <div className="review-header">
                <div className="review-author" style={{ gap: 8 }}>
                  <div className="loading-skeleton" style={{ width: 48, height: 20, borderRadius: 12 }}></div>
                  <div className="loading-skeleton" style={{ width: 120, height: 20 }}></div>
                </div>
              </div>
              <div className="review-text" style={{ marginTop: 12 }}>
                <div className="loading-skeleton" style={{ width: "100%", height: 16, marginBottom: 8 }}></div>
                <div className="loading-skeleton" style={{ width: "90%", height: 16, marginBottom: 8 }}></div>
                <div className="loading-skeleton" style={{ width: "60%", height: 16 }}></div>
              </div>
              <div className="review-footer" style={{ marginTop: 16 }}>
                <div className="loading-skeleton" style={{ width: 80, height: 14 }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : results ? (
        <>
          <div className="results-header">
            <div className="results-count">
              <strong>{results.totalCount}</strong> matching review{results.totalCount !== 1 ? "s" : ""}
              {results.query && <> for &ldquo;{results.query}&rdquo;</>}
            </div>

            {results.asOfDate && (
              <div className="as-of-info">
                📅 Reviews since {new Date(results.asOfDate).toLocaleDateString()}
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
        </>
      ) : null}
    </div>
  );
}

function ReviewCard({ result }: { result: SearchResultType }) {
  const { review, highlightedText } = result;

  const stars = review.rating
    ? Array.from({ length: 5 }, (_, i) => (i < review.rating! ? "★" : "☆"))
    : [];

  const dateStr = review.reviewDate
    ? new Date(review.reviewDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : null;

  return (
    <div className={`card review-card source-${review.source}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)", gap: 12 }}>
        {review.hotel?.name ? (
          <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "60%" }}>
            {review.hotel.name}
          </span>
        ) : <span />}
        {dateStr && <span className="review-date" style={{ margin: 0, whiteSpace: "nowrap", fontSize: "0.75rem" }}>{dateStr}</span>}
      </div>
      <div className="review-header" style={{ marginTop: 0 }}>
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
