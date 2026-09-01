import React from 'react';

interface SearchFormProps {
  selectedHotels: any[];
  setShowSearchForm: (show: boolean) => void;
  setResults: (results: any) => void;
  query: string;
  setQuery: (query: string) => void;
  loading: boolean;
  source: "both" | "google" | "tripadvisor";
  setSource: (source: "both" | "google" | "tripadvisor") => void;
  asOfDate: string;
  setAsOfDate: (date: string) => void;
  handleSearch: (e?: React.FormEvent) => void;
  searchSectionRef: React.RefObject<HTMLDivElement | null>;
}

export default function SearchForm({
  selectedHotels,
  setShowSearchForm,
  setResults,
  query,
  setQuery,
  loading,
  source,
  setSource,
  asOfDate,
  setAsOfDate,
  handleSearch,
  searchSectionRef
}: SearchFormProps) {
  return (
    <div className="section-wrapper search-section" ref={searchSectionRef}>
      <button 
        className="btn btn-ghost" 
        onClick={() => { setShowSearchForm(false); setResults(null); }} 
        style={{ marginBottom: 16, padding: "6px 12px", alignSelf: "flex-start" }}
      >
        ← Back to Hotel List
      </button>
      <div className="section-title">
        Search Reviews — {selectedHotels.length === 1 ? selectedHotels[0].name : `${selectedHotels.length} selected hotels`}
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
  );
}
