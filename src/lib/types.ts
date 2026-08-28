/* ──────────────────────────────────────────────────────────────
   Shared TypeScript types for the Hotel Review Search tool
   ────────────────────────────────────────────────────────────── */

export type ReviewSource = "google" | "tripadvisor";

/* ── Hotel ─────────────────────────────────────────────────── */

export interface HotelConfig {
  name: string;
  googlePlaceId?: string;
  tripAdvisorUrl?: string;
  city?: string;
  country?: string;
}

export interface Hotel {
  id: string;
  name: string;
  googlePlaceId: string | null;
  tripAdvisorId: string | null;
  tripAdvisorUrl: string | null;
  city: string | null;
  country: string | null;
  imageUrl: string | null;
  createdAt: Date;
  _count?: { reviews: number };
}

/* ── Review ────────────────────────────────────────────────── */

export interface Review {
  id: string;
  hotelId: string;
  source: ReviewSource;
  externalId: string | null;
  authorName: string;
  authorUrl: string | null;
  rating: number | null;
  text: string;
  reviewDate: Date | null;
  reviewLink: string | null;
  language: string | null;
  fetchedAt: Date;
  hotel?: Hotel;
}

/* ── Search ────────────────────────────────────────────────── */

export interface SearchRequest {
  query: string;
  hotelId: string;
  source?: ReviewSource | "both";
  asOfDate?: string; // ISO date string
}

export interface SearchResult {
  review: Review;
  highlightedText: string;
  matchRank: number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  query: string;
  asOfDate: string | null;
  searchedAt: string;
}

/* ── SerpAPI response shapes ───────────────────────────────── */

export interface SerpApiGoogleReview {
  user?: { name?: string; link?: string; thumbnail?: string };
  rating?: number;
  snippet?: string;
  date?: string;
  iso_date?: string;
  link?: string;
  likes?: number;
  review_id?: string;
}

export interface SerpApiTripAdvisorReview {
  user?: { username?: string; link?: string; avatar?: string };
  rating?: number;
  title?: string;
  text?: string;
  date?: string;
  trip_type?: string;
  url?: string;
  review_id?: string;
}

export interface SerpApiPlaceResult {
  place_id?: string;
  data_id?: string;
  title?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  thumbnail?: string;
  gps_coordinates?: { latitude: number; longitude: number };
}

export interface SerpApiTripAdvisorPlaceResult {
  title?: string;
  link?: string;
  rating?: number;
  reviews?: number;
  location_id?: string;
}

/* ── API request/response shapes ───────────────────────────── */

export interface FetchReviewsRequest {
  hotelId: string;
  source: ReviewSource;
  pages?: number; // how many pages to fetch (default 1)
}

export interface FetchReviewsResponse {
  newReviews: number;
  updatedReviews: number;
  totalFetched: number;
  source: ReviewSource;
}

export interface HotelLookupRequest {
  name: string;
  city?: string;
  country?: string;
}

export interface HotelLookupResponse {
  google: SerpApiPlaceResult[];
  tripadvisor: SerpApiTripAdvisorPlaceResult[];
}

export interface AddHotelRequest {
  name: string;
  googlePlaceId?: string;
  tripAdvisorId?: string;
  tripAdvisorUrl?: string;
  city?: string;
  country?: string;
}

export interface ReviewStats {
  hotelId: string;
  hotelName: string;
  googleCount: number;
  tripadvisorCount: number;
  lastGoogleFetch: Date | null;
  lastTripadvisorFetch: Date | null;
}
