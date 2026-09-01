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

export interface HotelCardProps {
  hotel: Hotel;
  isSelected?: boolean;
  isFavourite?: boolean;
  showFavouriteButton?: boolean;
  onToggleFavourite?: (e: React.MouseEvent, hotelId: string) => void;
  onClick?: () => void;
  variant?: "home" | "admin";
}

export default function HotelCard({ 
  hotel, 
  isSelected = false, 
  isFavourite = false, 
  showFavouriteButton = false, 
  onToggleFavourite, 
  onClick,
  variant = "home"
}: HotelCardProps) {
  return (
    <div
      className={`card hotel-card ${isSelected ? "selected" : ""}`}
      style={
        variant === "admin" 
          ? { padding: 12, minHeight: 80, border: isSelected ? "2px solid var(--accent)" : undefined }
          : { border: isSelected ? "2px solid var(--accent)" : undefined }
      }
      onClick={onClick}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div 
          className="hotel-name" 
          title={hotel.name}
          style={variant === "admin" ? { fontSize: 14 } : undefined}
          onClick={(e) => {
            if (window.innerWidth <= 768) {
              e.stopPropagation();
              const el = e.currentTarget;
              el.style.webkitLineClamp = el.style.webkitLineClamp === 'unset' ? '2' : 'unset';
            }
          }}
        >
          {hotel.name}
        </div>
        
        {showFavouriteButton && onToggleFavourite && (
          <button
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: isFavourite ? "var(--yellow)" : "var(--text-tertiary)", padding: 0, lineHeight: 1 }}
            onClick={(e) => onToggleFavourite(e, hotel.id)}
          >
            {isFavourite ? "★" : "☆"}
          </button>
        )}
      </div>

      <div className="hotel-location" style={variant === "admin" ? { fontSize: 12 } : undefined}>
        {[hotel.city, hotel.country].filter(Boolean).join(", ") || "Location not set"}
      </div>

      {variant === "home" && (
        <div className="hotel-stats">
          <div className="stat-pill"><div className="stat-icon">G</div>{hotel.stats?.googleCount || 0} reviews</div>
          <div className="stat-pill"><div className="stat-icon" style={{ background: "#34E0A1", color: "#000" }}>T</div>{hotel.stats?.tripadvisorCount || 0} reviews</div>
        </div>
      )}

      {variant === "admin" && (
        <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
          {hotel.googlePlaceId && <span className="badge badge-google" style={{ fontSize: 10, padding: "2px 6px" }}>Google</span>}
          {(hotel.tripAdvisorId || hotel.tripAdvisorUrl) && <span className="badge badge-tripadvisor" style={{ fontSize: 10, padding: "2px 6px" }}>TA</span>}
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: "auto" }}>
            {hotel._count?.reviews ?? 0} revs
          </span>
        </div>
      )}
    </div>
  );
}
