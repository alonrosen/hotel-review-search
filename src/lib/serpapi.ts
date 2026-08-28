/* ──────────────────────────────────────────────────────────────
   SerpAPI wrapper — thin HTTP client, no SDK dependency.
   Covers Google Maps Reviews, TripAdvisor Reviews,
   and place-lookup for both platforms.
   ────────────────────────────────────────────────────────────── */

import type {
  SerpApiGoogleReview,
  SerpApiTripAdvisorReview,
  SerpApiPlaceResult,
  SerpApiTripAdvisorPlaceResult,
} from "./types";

const SERPAPI_BASE = "https://serpapi.com/search.json";

function apiKey(): string {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY environment variable is not set");
  return key;
}

/* ── helpers ───────────────────────────────────────────────── */

async function serpFetch<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(SERPAPI_BASE);
  url.searchParams.set("api_key", apiKey());
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    // No caching — we want fresh data and SerpAPI caches on their side
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SerpAPI ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/* ── Google Maps: search for a place ───────────────────────── */

interface GoogleMapsSearchResponse {
  local_results?: SerpApiPlaceResult[];
  place_results?: SerpApiPlaceResult;
}

export async function searchGooglePlace(
  query: string
): Promise<SerpApiPlaceResult[]> {
  const data = await serpFetch<GoogleMapsSearchResponse>({
    engine: "google_maps",
    q: query,
    type: "search",
    ll: "@0,0,1z", // worldwide
  });

  if (data.local_results) return data.local_results;
  if (data.place_results) return [data.place_results];
  return [];
}

/* ── Google Maps: fetch reviews ────────────────────────────── */

interface GoogleReviewsResponse {
  reviews?: SerpApiGoogleReview[];
  place_info?: { title?: string; address?: string; rating?: number };
  serpapi_pagination?: { next_page_token?: string; next?: string };
}

export async function fetchGoogleReviews(
  placeId: string,
  options: { sortBy?: string; nextPageToken?: string } = {}
): Promise<{
  reviews: SerpApiGoogleReview[];
  nextPageToken: string | null;
  placeInfo: GoogleReviewsResponse["place_info"];
}> {
  const params: Record<string, string> = {
    engine: "google_maps_reviews",
    place_id: placeId,
    sort_by: options.sortBy ?? "newestFirst",
    hl: "en",
  };
  if (options.nextPageToken) {
    params.next_page_token = options.nextPageToken;
  }

  const data = await serpFetch<GoogleReviewsResponse>(params);

  return {
    reviews: data.reviews ?? [],
    nextPageToken: data.serpapi_pagination?.next_page_token ?? null,
    placeInfo: data.place_info,
  };
}

/* ── TripAdvisor: search for a place ───────────────────────── */

interface TripAdvisorSearchResponse {
  results?: SerpApiTripAdvisorPlaceResult[];
  organic_results?: SerpApiTripAdvisorPlaceResult[];
}

export async function searchTripAdvisorPlace(
  query: string
): Promise<SerpApiTripAdvisorPlaceResult[]> {
  const data = await serpFetch<TripAdvisorSearchResponse>({
    engine: "tripadvisor",
    q: query,
    type: "hotel",
  });

  return data.results ?? data.organic_results ?? [];
}

/* ── TripAdvisor: fetch reviews ────────────────────────────── */

interface TripAdvisorReviewsResponse {
  reviews?: SerpApiTripAdvisorReview[];
  serpapi_pagination?: { next?: string; next_page_token?: string };
}

/**
 * Fetch TripAdvisor reviews. Requires a location_id which can be
 * extracted from the TripAdvisor URL or from a search result.
 *
 * TripAdvisor URL pattern: /Hotel_Review-g{geoId}-d{locationId}-...
 */
export async function fetchTripAdvisorReviews(
  locationId: string,
  options: { offset?: number } = {}
): Promise<{
  reviews: SerpApiTripAdvisorReview[];
  hasMore: boolean;
}> {
  const params: Record<string, string> = {
    engine: "tripadvisor_reviews",
    location_id: locationId,
  };
  if (options.offset) {
    params.start = String(options.offset);
  }

  const data = await serpFetch<TripAdvisorReviewsResponse>(params);

  return {
    reviews: data.reviews ?? [],
    hasMore: !!(data.serpapi_pagination?.next),
  };
}

/* ── Utility: extract TripAdvisor location_id from URL ─────── */

/**
 * Extracts the numeric location ID from a TripAdvisor hotel URL.
 * Example: https://www.tripadvisor.com/Hotel_Review-g297746-d320832-Reviews-...
 *          → "320832"
 */
export function extractTripAdvisorLocationId(
  url: string
): string | null {
  // Pattern: -d{digits}-
  const match = url.match(/-d(\d+)-/);
  return match ? match[1] : null;
}
