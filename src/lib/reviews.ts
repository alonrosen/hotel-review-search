import prisma from "@/lib/db";
import {
  fetchGoogleReviewsRapid,
  fetchTripAdvisorReviewsRapid,
} from "@/lib/rapidapi";
import { fetchApifyGoogleReviews, fetchApifyTripAdvisorReviews } from "@/lib/apify";

export async function upsertGoogleReview(
  hotelId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  review: any
): Promise<boolean> {
  const externalId = review.review_id ?? review.author_name ?? null;
  if (!externalId) return false;

  const reviewData = {
    hotelId,
    source: "google",
    externalId,
    authorName: review.author_name ?? "Anonymous",
    authorUrl: review.author_url ?? null,
    rating: review.rating ?? null,
    text: review.review_text ?? "",
    reviewDate: review.review_datetime_utc
      ? new Date(review.review_datetime_utc)
      : null,
    reviewLink: review.review_link ?? null,
    language: review.review_language ?? null,
  };

  const result = await prisma.review.upsert({
    where: {
      hotelId_source_externalId: {
        hotelId,
        source: "google",
        externalId,
      },
    },
    create: reviewData,
    update: {
      text: reviewData.text,
      rating: reviewData.rating,
      reviewDate: reviewData.reviewDate,
      reviewLink: reviewData.reviewLink,
      language: reviewData.language,
      fetchedAt: new Date(),
    },
  });

  return result.fetchedAt.getTime() >= Date.now() - 5000;
}

export async function upsertTripAdvisorReview(
  hotelId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  review: any
): Promise<boolean> {
  const externalId = review.id ?? review.author?.username ?? null;
  if (!externalId) return false;

  const fullText = [review.title, review.text].filter(Boolean).join("\n\n");

  let reviewDate = null;
  if (review.publishedDate) {
    const lower = review.publishedDate.toLowerCase();
    if (lower === "today") {
      reviewDate = new Date();
    } else if (lower === "yesterday") {
      reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() - 1);
    } else {
      const agoMatch = lower.match(/(\d+)\s+(day|week|month|year)s?\s+ago/);
      if (agoMatch) {
        const amount = parseInt(agoMatch[1], 10);
        const unit = agoMatch[2];
        const d = new Date();
        if (unit === "day") d.setDate(d.getDate() - amount);
        if (unit === "week") d.setDate(d.getDate() - (amount * 7));
        if (unit === "month") d.setMonth(d.getMonth() - amount);
        if (unit === "year") d.setFullYear(d.getFullYear() - amount);
        reviewDate = d;
      } else {
        const d = new Date(review.publishedDate);
        if (!isNaN(d.getTime())) {
          reviewDate = d;
        }
      }
    }
  }

  let finalReviewLink = review.url ?? null;
  if (finalReviewLink && !finalReviewLink.startsWith("http")) {
    finalReviewLink =
      "https://www.tripadvisor.com" +
      (finalReviewLink.startsWith("/") ? "" : "/") +
      finalReviewLink;
  }

  const reviewData = {
    hotelId,
    source: "tripadvisor",
    externalId: String(externalId),
    authorName: review.author?.username ?? "Anonymous",
    authorUrl: review.author?.url ?? null,
    rating: review.rating ?? null,
    text: fullText,
    reviewDate,
    reviewLink: finalReviewLink,
    language: null as string | null,
  };

  const result = await prisma.review.upsert({
    where: {
      hotelId_source_externalId: {
        hotelId,
        source: "tripadvisor",
        externalId: String(externalId),
      },
    },
    create: reviewData,
    update: {
      text: reviewData.text,
      rating: reviewData.rating,
      reviewDate: reviewData.reviewDate,
      reviewLink: reviewData.reviewLink,
      fetchedAt: new Date(),
    },
  });

  return result.fetchedAt.getTime() >= Date.now() - 5000;
}

export async function upsertFormattedReview(
  hotelId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  review: any
): Promise<boolean> {
  const result = await prisma.review.upsert({
    where: {
      hotelId_source_externalId: {
        hotelId,
        source: review.source,
        externalId: review.externalId,
      },
    },
    create: {
      hotelId,
      source: review.source,
      externalId: review.externalId,
      authorName: review.authorName,
      authorUrl: review.authorUrl,
      rating: review.rating,
      text: review.text,
      reviewDate: review.reviewDate ? new Date(review.reviewDate) : null,
      reviewLink: review.reviewLink,
      language: review.language,
    },
    update: {
      text: review.text,
      rating: review.rating,
      reviewDate: review.reviewDate ? new Date(review.reviewDate) : null,
      reviewLink: review.reviewLink,
      language: review.language,
      fetchedAt: new Date(),
    },
  });

  return result.fetchedAt.getTime() >= Date.now() - 5000;
}

export function extractTripAdvisorLocationId(url: string): string | null {
  const match = url.match(/-d(\d+)-/i) || url.match(/d(\d+)/i);
  return match ? match[1] : null;
}

export async function fetchAndUpsertReviews(
  hotelId: string, 
  source: string,
  fetchLimit: number = 50,
  olderThanDate?: Date, 
  asOfDate?: Date
) {
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) throw new Error("Hotel not found");

  const googleProvider = (await prisma.setting.findUnique({ where: { key: "provider_google" } }))?.value || "rapidapi";
  const taProvider = (await prisma.setting.findUnique({ where: { key: "provider_tripadvisor" } }))?.value || "rapidapi";

  let totalFetched = 0;
  let newReviews = 0;
  
  const isGoogleNeeded = (source === "google" || source === "both");
  const isTANeeded = (source === "tripadvisor" || source === "both");

  // Determine sinceDate to limit Apify fetches
  let googleSinceDate = new Date();
  if (asOfDate) {
    googleSinceDate = asOfDate;
  } else {
    const latestGoogle = await prisma.review.findFirst({
      where: { hotelId, source: "google" },
      orderBy: { reviewDate: "desc" }
    });
    if (latestGoogle && latestGoogle.reviewDate) {
      googleSinceDate = new Date(latestGoogle.reviewDate);
      googleSinceDate.setDate(googleSinceDate.getDate() - 1);
    } else {
      googleSinceDate.setMonth(googleSinceDate.getMonth() - 1); // limit initial fill to 1 month if no data
    }
  }

  let taSinceDate = new Date();
  if (asOfDate) {
    taSinceDate = asOfDate;
  } else {
    const latestTA = await prisma.review.findFirst({
      where: { hotelId, source: "tripadvisor" },
      orderBy: { reviewDate: "desc" }
    });
    if (latestTA && latestTA.reviewDate) {
      taSinceDate = new Date(latestTA.reviewDate);
      taSinceDate.setDate(taSinceDate.getDate() - 1);
    } else {
      taSinceDate.setMonth(taSinceDate.getMonth() - 1); // limit initial fill to 1 month if no data
    }
  }

  const { logEvent } = await import("@/lib/logger");

  // Google Fetch Helper
  const runGoogleFetch = async (provider: string) => {
    if (provider === "apify") {
      const reviews = await fetchApifyGoogleReviews(hotel, fetchLimit, googleSinceDate, olderThanDate);
      for (const review of reviews) {
        const created = await upsertFormattedReview(hotel.id, review);
        totalFetched++;
        if (created) newReviews++;
      }
    } else {
      const reviews = await fetchGoogleReviewsRapid(hotel.googlePlaceId!, fetchLimit);
      for (const review of reviews) {
        const created = await upsertGoogleReview(hotel.id, review);
        totalFetched++;
        if (created) newReviews++;
      }
    }
  };

  if (isGoogleNeeded) {
    if (hotel.googlePlaceId || (googleProvider === "apify" && hotel.name)) {
      try {
        await runGoogleFetch(googleProvider);
      } catch (err: any) {
        console.warn(`[Reviews] Google ${googleProvider} failed for ${hotel.name}. Falling back... Error: ${err.message}`);
        await logEvent("WARN", googleProvider, `Google fetch failed, attempting fallback`, err, hotel.id);
        
        const fallbackProvider = googleProvider === "apify" ? "rapidapi" : "apify";
        // Check if fallback provider requirements are met
        if (fallbackProvider === "apify" || (fallbackProvider === "rapidapi" && hotel.googlePlaceId)) {
          try {
            await runGoogleFetch(fallbackProvider);
            await logEvent("INFO", fallbackProvider, `Google fallback fetch succeeded`, null, hotel.id);
          } catch (fallbackErr: any) {
            console.error(`[Reviews] Google fallback (${fallbackProvider}) also failed for ${hotel.name}.`);
            await logEvent("ERROR", fallbackProvider, `Google fallback fetch failed`, fallbackErr, hotel.id);
          }
        }
      }
    }
  }

  // TripAdvisor Fetch Helper
  const runTripAdvisorFetch = async (provider: string) => {
    if (provider === "apify") {
      if (!hotel.tripAdvisorUrl) throw new Error("Missing TripAdvisor URL for Apify");
      let taStartPage = undefined;
      if (olderThanDate) {
         const taCount = await prisma.review.count({ 
           where: { 
             hotelId, 
             source: "tripadvisor",
             reviewDate: { gte: olderThanDate }
           } 
         });
         taStartPage = Math.floor(taCount / 10) + 1;
      }
      
      const reviews = await fetchApifyTripAdvisorReviews(hotel, fetchLimit, taSinceDate, taStartPage);
      for (const review of reviews) {
        const created = await upsertFormattedReview(hotel.id, review);
        totalFetched++;
        if (created) newReviews++;
      }
    } else {
      const locationId =
        hotel.tripAdvisorId ??
        (hotel.tripAdvisorUrl
          ? extractTripAdvisorLocationId(hotel.tripAdvisorUrl)
          : null);

      if (!locationId) throw new Error("Missing TripAdvisor Location ID for RapidAPI");
      
      const reviews = await fetchTripAdvisorReviewsRapid(locationId, 1);
      for (const review of reviews) {
        const created = await upsertTripAdvisorReview(hotel.id, review);
        totalFetched++;
        if (created) newReviews++;
      }
    }
  };

  if (isTANeeded) {
    if (hotel.tripAdvisorId || hotel.tripAdvisorUrl) {
      try {
        await runTripAdvisorFetch(taProvider);
      } catch (err: any) {
        console.warn(`[Reviews] TA ${taProvider} failed for ${hotel.name}. Falling back... Error: ${err.message}`);
        await logEvent("WARN", taProvider, `TripAdvisor fetch failed, attempting fallback`, err, hotel.id);
        
        const fallbackProvider = taProvider === "apify" ? "rapidapi" : "apify";
        try {
          await runTripAdvisorFetch(fallbackProvider);
          await logEvent("INFO", fallbackProvider, `TripAdvisor fallback fetch succeeded`, null, hotel.id);
        } catch (fallbackErr: any) {
          console.error(`[Reviews] TA fallback (${fallbackProvider}) also failed for ${hotel.name}.`);
          await logEvent("ERROR", fallbackProvider, `TripAdvisor fallback fetch failed`, fallbackErr, hotel.id);
        }
      }
    }
  }

  return { newReviews, updatedReviews: totalFetched - newReviews, totalFetched, source };
}

