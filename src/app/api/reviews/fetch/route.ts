/* POST /api/reviews/fetch — trigger RapidAPI fetch for a hotel's reviews */

import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  fetchGoogleReviewsRapid,
  fetchTripAdvisorReviewsRapid,
} from "@/lib/rapidapi";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { hotelId, source, pages = 1 } = body;

  if (!hotelId || !source) {
    return Response.json(
      { error: "hotelId and source are required" },
      { status: 400 }
    );
  }

  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) {
    return Response.json({ error: "Hotel not found" }, { status: 404 });
  }

  let totalFetched = 0;
  let newReviews = 0;

  try {
    if (source === "google" || source === "both") {
      if (!hotel.googlePlaceId) {
        return Response.json(
          { error: "Hotel has no Google Place ID configured" },
          { status: 400 }
        );
      }

      // The rapid API we're using uses 'limit', so we'll just fetch a batch based on pages
      const limit = pages * 20; 
      const reviews = await fetchGoogleReviewsRapid(hotel.googlePlaceId, limit);

      for (const review of reviews) {
        const created = await upsertGoogleReview(hotel.id, review);
        totalFetched++;
        if (created) newReviews++;
      }
    }

    if (source === "tripadvisor" || source === "both") {
      if (!hotel.tripAdvisorUrl && !hotel.tripAdvisorId) {
        return Response.json(
          { error: "Hotel has no TripAdvisor ID or URL configured" },
          { status: 400 }
        );
      }

      const locationId =
        hotel.tripAdvisorId ??
        (hotel.tripAdvisorUrl
          ? extractTripAdvisorLocationId(hotel.tripAdvisorUrl)
          : null);

      if (!locationId) {
        return Response.json(
          { error: "Could not extract TripAdvisor location ID" },
          { status: 400 }
        );
      }

      for (let page = 1; page <= pages; page++) {
        const reviews = await fetchTripAdvisorReviewsRapid(locationId, page);

        for (const review of reviews) {
          const created = await upsertTripAdvisorReview(hotel.id, review);
          totalFetched++;
          if (created) newReviews++;
        }
        
        if (reviews.length === 0) break;
      }
    }

    return Response.json({
      newReviews,
      updatedReviews: totalFetched - newReviews,
      totalFetched,
      source,
    });
  } catch (error) {
    console.error("Review fetch error:", error);
    return Response.json(
      {
        error: "Failed to fetch reviews",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/* ── helpers ───────────────────────────────────────────────── */

async function upsertGoogleReview(
  hotelId: string,
  review: any
): Promise<boolean> {
  const externalId = review.review_id ?? review.author_name ?? null;
  if (!externalId) return false;

  const existing = await prisma.review.findUnique({
    where: {
      hotelId_source_externalId: {
        hotelId,
        source: "google",
        externalId,
      },
    },
  });

  if (existing) return false;

  await prisma.review.create({
    data: {
      hotelId,
      source: "google",
      externalId,
      authorName: review.author_name ?? "Anonymous",
      authorUrl: review.author_url ?? null,
      rating: review.rating ?? null,
      text: review.review_text ?? "",
      reviewDate: review.review_datetime_utc ? new Date(review.review_datetime_utc) : null,
      reviewLink: review.author_url ?? null, // Google API sometimes lacks direct review links
      language: null,
    },
  });

  return true;
}

async function upsertTripAdvisorReview(
  hotelId: string,
  review: any
): Promise<boolean> {
  const externalId = review.id ?? review.author?.username ?? null;
  if (!externalId) return false;

  const existing = await prisma.review.findUnique({
    where: {
      hotelId_source_externalId: {
        hotelId,
        source: "tripadvisor",
        externalId: String(externalId),
      },
    },
  });

  if (existing) return false;

  const fullText = [review.title, review.text].filter(Boolean).join("\n\n");

  await prisma.review.create({
    data: {
      hotelId,
      source: "tripadvisor",
      externalId: String(externalId),
      authorName: review.author?.username ?? "Anonymous",
      authorUrl: review.author?.url ?? null,
      rating: review.rating ?? null,
      text: fullText,
      reviewDate: review.publishedDate ? new Date(review.publishedDate) : null,
      reviewLink: review.url ?? null,
      language: null,
    },
  });

  return true;
}

function extractTripAdvisorLocationId(url: string): string | null {
  // Looks for "-d123456-" or "d123456" in the URL
  const match = url.match(/-d(\d+)-/i) || url.match(/d(\d+)/i);
  return match ? match[1] : null;
}
