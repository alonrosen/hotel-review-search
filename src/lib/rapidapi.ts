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

  const url = `https://${GOOGLE_API_HOST}/business-reviews-v2?business_id=${encodeURIComponent(placeId)}&limit=${limit}&sort_by=newest&region=us&language=en`;
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
 * TRIPADVISOR (Tripadvisor-com1)
 */
const TA_API_HOST = "tripadvisor-com1.p.rapidapi.com";

export async function searchTripAdvisorRapid(query: string) {
  if (!RAPIDAPI_KEY) throw new Error("Missing RAPIDAPI_KEY");

  const url = `https://${TA_API_HOST}/auto-complete?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": TA_API_HOST,
    },
  });

  if (!res.ok) throw new Error("RapidAPI TripAdvisor Auto-complete failed");
  const data = await res.json();
  const results = data?.data?.results || data?.data || [];
  
  if (!Array.isArray(results)) return [];
  
  return results
    .filter((r: any) => r?.trackingItems?.placeType === "ACCOMMODATION")
    .map((r: any) => {
      const id = r?.trackingItems?.locationId || r?.geoId;
      
      // Remove HTML tags like <b> from the heading
      let title = r?.heading?.htmlString || r?.trackingItems?.text || "Unknown Hotel";
      title = title.replace(/<\/?[^>]+(>|$)/g, "");

      const address = r?.secondaryTextLineOne?.string || "";
      if (address) {
        title += ` (${address})`;
      }

      return {
        title,
        location_id: id ? String(id) : null
      };
    })
    .filter((h: any) => h.location_id);
}

export async function fetchTripAdvisorReviewsRapid(contentId: string, page: number = 1) {
  if (!RAPIDAPI_KEY) throw new Error("Missing RAPIDAPI_KEY");

  const offset = (page - 1) * 20;
  const url = `https://${TA_API_HOST}/hotels/reviews?contentId=${encodeURIComponent(contentId)}${offset > 0 ? `&offset=${offset}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": TA_API_HOST,
    },
  });

  if (!res.ok) throw new Error("RapidAPI TripAdvisor Reviews failed");
  const data = await res.json();
  
  const reviews = [];
  
  if (data?.data?.sections) {
    for (const section of data.data.sections) {
      if (section.__typename === "AppPresentation_UserReviewSection") {
        reviews.push({
          id: section.helpfulVote?.helpfulVoteAction?.objectId || Math.random().toString(36).substring(7),
          title: section.htmlTitle?.htmlString || "",
          text: section.htmlText?.htmlString || "",
          rating: section.bubbleRating?.rating || 0,
          author: {
            username: section.author?.username || section.userProfile?.displayName || "Anonymous"
          },
          publishedDate: section.publishedDate?.string || "",
          url: section.reviewActions?.find((a: any) => a.__typename === "AppPresentation_ShareLinkAction")?.link?.route?.url || ""
        });
      }
    }
  }
  
  return reviews;
}
