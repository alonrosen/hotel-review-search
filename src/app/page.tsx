"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Header from "@/components/shared/Header";
import NotificationList from "@/components/shared/NotificationList";
import HotelSelector from "@/components/home/HotelSelector";
import SearchForm from "@/components/home/SearchForm";
import SearchResults, { SearchResponseType } from "@/components/home/SearchResults";

export default function Home() {
  const { user, loading: userLoading, logout } = useAuth();
  const router = useRouter();

  const [selectedHotels, setSelectedHotels] = useState<any[]>([]);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"both" | "google" | "tripadvisor">("both");
  const [asOfDate, setAsOfDate] = useState("");
  const [results, setResults] = useState<SearchResponseType | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchSectionRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

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
        setSelectedHotels([]); setShowSearchForm(false);
        setResults(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onScrollToSearch = () => {
      setTimeout(() => {
        searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    };
    window.addEventListener('scroll-to-search', onScrollToSearch);
    return () => window.removeEventListener('scroll-to-search', onScrollToSearch);
  }, []);

  // Auto-scroll to results when loading starts or results change
  useEffect(() => {
    if ((results || loading) && resultsSectionRef.current) {
      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [results, loading, page]);

  const handleSearch = useCallback(
    async (e?: React.FormEvent, targetPage: number = 1) => {
      if (e) e.preventDefault();
      if (selectedHotels.length === 0) return;

      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/reviews/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: query.trim(),
            hotelIds: selectedHotels.map(h => h.id),
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
    [selectedHotels, query, source, asOfDate]
  );

  if (userLoading || !user) {
    return (
      <>
        <Header />
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
          <span className="spinner" style={{ width: 64, height: 64, borderWidth: 6, borderTopColor: "var(--accent)" }} />
        </div>
      </>
    );
  }

  if (user.status === 'pending') {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
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

  return (
    <>
      <Header />
      <NotificationList />

      {/* Main View: Hotel List */}
      <div className="container page-content">
        {!showSearchForm && (
          <HotelSelector 
            selectedHotels={selectedHotels}
            setSelectedHotels={setSelectedHotels}
            setShowSearchForm={setShowSearchForm}
            setAsOfDate={setAsOfDate}
          />
        )}

        {showSearchForm && (
          <SearchForm 
            selectedHotels={selectedHotels}
            setShowSearchForm={setShowSearchForm}
            setResults={setResults}
            query={query}
            setQuery={setQuery}
            loading={loading}
            source={source}
            setSource={setSource}
            asOfDate={asOfDate}
            setAsOfDate={setAsOfDate}
            handleSearch={handleSearch}
            searchSectionRef={searchSectionRef}
          />
        )}

        {error && (
          <div className="toast toast-error" style={{ position: "relative", bottom: "auto", right: "auto", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {(results || loading) && (
          <SearchResults 
            results={results}
            loading={loading}
            handleSearch={handleSearch}
            resultsSectionRef={resultsSectionRef}
          />
        )}
      </div>
    </>
  );
}
