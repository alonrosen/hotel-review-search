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

export async function fetchAndUpsertReviews(hotelId: string, source: string, pages: number = 1) {
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) throw new Error("Hotel not found");

  const googleProvider = (await prisma.setting.findUnique({ where: { key: "provider_google" } }))?.value || "rapidapi";
  const taProvider = (await prisma.setting.findUnique({ where: { key: "provider_tripadvisor" } }))?.value || "rapidapi";

  let totalFetched = 0;
  let newReviews = 0;

  // Determine sinceDate to limit Apify fetches
  const latestGoogle = await prisma.review.findFirst({
    where: { hotelId, source: "google" },
    orderBy: { reviewDate: "desc" }
  });
  let googleSinceDate = new Date();
  if (latestGoogle && latestGoogle.reviewDate) {
    googleSinceDate = new Date(latestGoogle.reviewDate);
    googleSinceDate.setDate(googleSinceDate.getDate() - 1);
  } else {
    googleSinceDate.setMonth(googleSinceDate.getMonth() - 1); // limit initial fill to 1 month
  }

  const latestTA = await prisma.review.findFirst({
    where: { hotelId, source: "tripadvisor" },
    orderBy: { reviewDate: "desc" }
  });
  let taSinceDate = new Date();
  if (latestTA && latestTA.reviewDate) {
    taSinceDate = new Date(latestTA.reviewDate);
    taSinceDate.setDate(taSinceDate.getDate() - 1);
  } else {
    taSinceDate.setMonth(taSinceDate.getMonth() - 1); // limit initial fill to 1 month
  }

  if (source === "google" || source === "both") {
    if (hotel.googlePlaceId || (googleProvider === "apify" && hotel.name)) {
      if (googleProvider === "apify") {
        const reviews = await fetchApifyGoogleReviews(hotel, 100, googleSinceDate);
        for (const review of reviews) {
          const created = await upsertFormattedReview(hotel.id, review);
          totalFetched++;
          if (created) newReviews++;
        }
      } else {
        const limit = pages * 20;
        const reviews = await fetchGoogleReviewsRapid(hotel.googlePlaceId!, limit);
        for (const review of reviews) {
          const created = await upsertGoogleReview(hotel.id, review);
          totalFetched++;
          if (created) newReviews++;
        }
      }
    }
  }

  if (source === "tripadvisor" || source === "both") {
    if (taProvider === "apify") {
      if (hotel.tripAdvisorUrl) {
        const reviews = await fetchApifyTripAdvisorReviews(hotel, 100, taSinceDate);
        for (const review of reviews) {
          const created = await upsertFormattedReview(hotel.id, review);
          totalFetched++;
          if (created) newReviews++;
        }
      }
    } else {
      const locationId =
        hotel.tripAdvisorId ??
        (hotel.tripAdvisorUrl
          ? extractTripAdvisorLocationId(hotel.tripAdvisorUrl)
          : null);

      if (locationId) {
        // The TA RapidAPI endpoint does not support offset/pagination for reviews.
        // It only returns the most recent ~20-50 reviews.
        const reviews = await fetchTripAdvisorReviewsRapid(locationId, 1);
        for (const review of reviews) {
          const created = await upsertTripAdvisorReview(hotel.id, review);
          totalFetched++;
          if (created) newReviews++;
        }
      }
    }
  }

  return { newReviews, updatedReviews: totalFetched - newReviews, totalFetched, source };
}
