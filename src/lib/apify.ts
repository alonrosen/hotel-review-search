import { Hotel } from "@prisma/client";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

// Google Maps Reviews Scraper Actor
const APIFY_GOOGLE_ACTOR_ID = "Xb8osYTtOjlsgI6k9";

// TripAdvisor Reviews Scraper Actor
const APIFY_TRIPADVISOR_ACTOR_ID = "LPshQCJhLqVNIdMrf";

export async function fetchApifyGoogleReviews(hotel: Hotel, maxReviews: number = 1000) {
  if (!APIFY_API_TOKEN) throw new Error("APIFY_API_TOKEN is missing");

  // We rely on the exact hotel name. Alternatively, if we know the placeId, we could use that.
  let apifyBody: any = { maxReviews, reviewsSort: "newest" };

  if (hotel.googlePlaceId) {
    // Check if the placeId is already a URL
    let mapUrl = hotel.googlePlaceId;
    if (!mapUrl.startsWith("http")) {
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name)}&query_place_id=${hotel.googlePlaceId}`;
    }
    apifyBody.startUrls = [{ url: mapUrl }];
  } else {
    apifyBody.searchStringsArray = [hotel.name];
  }

  const url = `https://api.apify.com/v2/acts/${APIFY_GOOGLE_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;
  
  console.log(`[Apify Google] Fetching max ${maxReviews} for ${hotel.name}`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apifyBody),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Apify Google fetch failed: ${errorText}`);
  }

  const data = await res.json();
  
  // Transform Apify Google output to our generic Review structure
  return data.map((item: any) => ({
    externalId: item.reviewId || `${item.name}-${item.publishedAtDate}`,
    source: "google",
    authorName: item.name || "Unknown User",
    authorUrl: item.reviewerUrl || null,
    rating: item.stars || null,
    text: item.text || item.textTranslated || "",
    reviewDate: item.publishedAtDate || null,
    reviewLink: item.reviewUrl || null,
    language: item.language || null,
  }));
}

export async function fetchApifyTripAdvisorReviews(hotel: Hotel, maxReviews: number = 1000) {
  if (!APIFY_API_TOKEN) throw new Error("APIFY_API_TOKEN is missing");
  if (!hotel.tripAdvisorUrl) throw new Error(`Hotel ${hotel.name} missing tripAdvisorUrl`);

  const url = `https://api.apify.com/v2/acts/${APIFY_TRIPADVISOR_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;
  
  console.log(`[Apify TripAdvisor] Fetching max ${maxReviews} for ${hotel.name}`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startUrls: [{ url: hotel.tripAdvisorUrl }],
      maxItems: maxReviews,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Apify TripAdvisor fetch failed: ${errorText}`);
  }

  const data = await res.json();
  
  // Transform Apify TripAdvisor output to our generic Review structure
  return data.map((item: any) => {
    // Apify TA actor usually returns text in 'text', author in 'user.username', rating in 'rating'
    const author = item.user?.username || item.author || "TripAdvisor User";
    const externalId = item.id ? item.id.toString() : `${author}-${item.publishedDate}`;
    
    return {
      externalId,
      source: "tripadvisor",
      authorName: author,
      authorUrl: item.user?.profileUrl || null,
      rating: item.rating || null,
      text: item.text || "",
      reviewDate: item.publishedDate || item.createdDate || null,
      reviewLink: item.url || item.inputSource || null,
      language: item.language || null,
    };
  });
}
