export const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";

/**
 * GOOGLE MAPS (Local Business Data by Lundehund)
 * https://rapidapi.com/Lundehund/api/local-business-data
 */
const GOOGLE_API_HOST = "local-business-data.p.rapidapi.com";

export async function searchGooglePlaceIdRapid(query: string) {
  if (!RAPIDAPI_KEY) throw new Error("Missing RAPIDAPI_KEY");

  const url = `https://${GOOGLE_API_HOST}/search?query=${encodeURIComponent(query)}&limit=3`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": GOOGLE_API_HOST,
    },
  });

  if (!res.ok) throw new Error("RapidAPI Google Search failed");
  const data = await res.json();
  return data.data || [];
}

export async function fetchGoogleReviewsRapid(placeId: string, limit: number = 20) {
  if (!RAPIDAPI_KEY) throw new Error("Missing RAPIDAPI_KEY");

  const url = `https://${GOOGLE_API_HOST}/business-reviews-v2?business_id=${encodeURIComponent(placeId)}&limit=${limit}&sort_by=most_relevant&region=us&language=en`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": GOOGLE_API_HOST,
    },
  });

  if (!res.ok) throw new Error("RapidAPI Google Reviews failed");
  const data = await res.json();
  return data.data?.reviews || [];
}


/**
 * TRIPADVISOR (Tripadvisor16 by belchiorarkad)
 * https://rapidapi.com/belchiorarkad-uk018n4_rQ/api/tripadvisor16
 */
const TA_API_HOST = "tripadvisor16.p.rapidapi.com";

export async function searchTripAdvisorRapid(query: string) {
  if (!RAPIDAPI_KEY) throw new Error("Missing RAPIDAPI_KEY");

  const url = `https://${TA_API_HOST}/api/v1/hotels/searchLocation?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": TA_API_HOST,
    },
  });

  if (!res.ok) throw new Error("RapidAPI TripAdvisor Search failed");
  const data = await res.json();
  return data.data || [];
}

export async function fetchTripAdvisorReviewsRapid(locationId: string, page: number = 1) {
  if (!RAPIDAPI_KEY) throw new Error("Missing RAPIDAPI_KEY");

  const url = `https://${TA_API_HOST}/api/v1/hotels/getReviews?id=${encodeURIComponent(locationId)}&page=${page}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": TA_API_HOST,
    },
  });

  if (!res.ok) throw new Error("RapidAPI TripAdvisor Reviews failed");
  const data = await res.json();
  return data.data?.data || [];
}
