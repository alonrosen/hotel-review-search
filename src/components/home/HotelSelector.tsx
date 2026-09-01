import React, { useState, useEffect, useCallback, useMemo } from 'react';
import HotelCard from '../shared/HotelCard';
import { useAuth } from '@/lib/auth-context';

export default function HotelSelector({
  selectedHotels,
  setSelectedHotels,
  setShowSearchForm,
  setAsOfDate
}: any) {
  const { user, loading: userLoading } = useAuth();
  const [hotels, setHotels] = useState<any[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  const [hotelFilter, setHotelFilter] = useState("");
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userLoading) return;
    if (user && user.status === 'active') {
      setHotelsLoading(true);
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
  }, [user, userLoading]);

  const handleSelectHotel = useCallback((hotel: any) => {
    setSelectedHotels((prev: any[]) => {
      const isSelected = prev.some(h => h.id === hotel.id);
      if (isSelected) {
        const next = prev.filter(h => h.id !== hotel.id);
        if (next.length === 0) setShowSearchForm(false);
        return next;
      } else {
        return [...prev, hotel];
      }
    });

    if (hotel.stats) {
      const { googleCount, tripadvisorCount, latestGoogleReviewDate, latestTripadvisorReviewDate } = hotel.stats;
      if (googleCount > 0 && tripadvisorCount > 0 && latestGoogleReviewDate && latestTripadvisorReviewDate) {
        const d1 = new Date(latestGoogleReviewDate);
        const d2 = new Date(latestTripadvisorReviewDate);
        const minDate = d1 < d2 ? d1 : d2;
        minDate.setDate(minDate.getDate() - 1);
        setAsOfDate(minDate.toISOString().split('T')[0]);
      } else if (googleCount === 0 || tripadvisorCount === 0) {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        setAsOfDate(d.toISOString().split('T')[0]);
      }
    } else {
      setAsOfDate("");
    }
  }, [setSelectedHotels, setShowSearchForm, setAsOfDate]);

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

  let filteredHotels = hotels.filter(h => h.name.toLowerCase().includes(hotelFilter.toLowerCase()));
  if (showFavouritesOnly) {
    filteredHotels = filteredHotels.filter(h => favourites.includes(h.id));
  } else {
    filteredHotels.sort((a, b) => {
      const aFav = favourites.includes(a.id) ? 1 : 0;
      const bFav = favourites.includes(b.id) ? 1 : 0;
      return bFav - aFav;
    });
  }

  const visibleHotelIds = filteredHotels.map(h => h.id);
  const allVisibleSelected = visibleHotelIds.length > 0 && visibleHotelIds.every(id => selectedHotels.some((sh: any) => sh.id === id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedHotels((prev: any[]) => {
        const next = prev.filter(h => !visibleHotelIds.includes(h.id));
        if (next.length === 0) setShowSearchForm(false);
        return next;
      });
      setAsOfDate("");
    } else {
      setSelectedHotels((prev: any[]) => {
        const toAdd = filteredHotels.filter(h => !prev.some(sh => sh.id === h.id));
        return [...prev, ...toAdd];
      });
      setAsOfDate("");
    }
  };

  return (
    <div className="section-wrapper">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>Select a Hotel</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={toggleSelectAll} 
            style={{ fontSize: 13, padding: "4px 8px" }}
            disabled={filteredHotels.length === 0}
          >
            {allVisibleSelected ? "Unselect All" : "Select All"}
          </button>
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

      {error && <div className="toast toast-error">{error}</div>}

      {hotelsLoading ? (
        <div className="hotel-grid" style={{ maxHeight: 500, overflowY: "hidden", paddingRight: 4, paddingBottom: 4 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card hotel-card" style={{ pointerEvents: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div className="loading-skeleton" style={{ width: "60%", height: 20 }}></div>
                <div className="loading-skeleton" style={{ width: 24, height: 24, borderRadius: "50%" }}></div>
              </div>
              <div className="loading-skeleton" style={{ width: "40%", height: 14, marginBottom: 12 }}></div>
              <div className="loading-skeleton" style={{ width: "30%", height: 12, marginBottom: 8 }}></div>
              <div className="loading-skeleton" style={{ width: "20%", height: 12 }}></div>
            </div>
          ))}
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
            <HotelCard 
              key={hotel.id}
              hotel={hotel}
              isSelected={selectedHotels.some((h: any) => h.id === hotel.id)}
              isFavourite={favourites.includes(hotel.id)}
              showFavouriteButton={true}
              onToggleFavourite={toggleFavourite}
              onClick={() => handleSelectHotel(hotel)}
              variant="home"
            />
          ))}
        </div>
      )}

      {selectedHotels.length > 0 && (
        <div style={{ position: "sticky", bottom: 20, textAlign: "center", marginTop: 24, zIndex: 10 }}>
          <button 
            className="btn btn-primary" 
            style={{ padding: "12px 32px", fontSize: 16, boxShadow: "0 8px 24px rgba(99,102,241,0.4)", borderRadius: 30 }}
            onClick={() => {
              setShowSearchForm(true);
              window.history.pushState(null, "", "#search");
              // We dispatch a custom event so the parent can scroll to the search section
              window.dispatchEvent(new Event('scroll-to-search'));
            }}
          >
            Continue to Search ({selectedHotels.length} selected)
          </button>
        </div>
      )}
    </div>
  );
}
