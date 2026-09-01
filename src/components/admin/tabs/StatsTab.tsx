import React from 'react';

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

interface StatsTabProps {
  hotels: Hotel[];
}

export default function StatsTab({ hotels }: StatsTabProps) {
  return (
    <div>
      <div className="section-title">Global Statistics</div>
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
    </div>
  );
}
