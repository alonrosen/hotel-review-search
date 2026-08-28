/* POST /api/reviews/fetch — trigger SerpAPI fetch for a hotel's reviews */

import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  fetchGoogleReviews,
  fetchTripAdvisorReviews,
  extractTripAdvisorLocationId,
} from "@/lib/serpapi";
import type { SerpApiGoogleReview, SerpApiTripAdvisorReview } from "@/lib/types";

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

      let nextPageToken: string | null = null;

      for (let page = 0; page < pages; page++) {
        const result = await fetchGoogleReviews(hotel.googlePlaceId, {
          nextPageToken: nextPageToken ?? undefined,
        });

        // Update hotel image from place info if available
        if (page === 0 && result.placeInfo) {
          // placeInfo doesn't include thumbnail, skip
        }

        for (const review of result.reviews) {
          const created = await upsertGoogleReview(hotel.id, review);
          totalFetched++;
          if (created) newReviews++;
        }

        nextPageToken = result.nextPageToken;
        if (!nextPageToken) break;
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

      for (let page = 0; page < pages; page++) {
        const result = await fetchTripAdvisorReviews(locationId, {
          offset: page * 10,
        });

        for (const review of result.reviews) {
          const created = await upsertTripAdvisorReview(hotel.id, review);
          totalFetched++;
          if (created) newReviews++;
        }

        if (!result.hasMore) break;
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
  review: SerpApiGoogleReview
): Promise<boolean> {
  const externalId = review.review_id ?? review.user?.name ?? null;
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
      authorName: review.user?.name ?? "Anonymous",
      authorUrl: review.user?.link ?? null,
      rating: review.rating ?? null,
      text: review.snippet ?? "",
      reviewDate: review.iso_date ? new Date(review.iso_date) : null,
      reviewLink: review.link ?? null,
      language: null,
    },
  });

  return true;
}

async function upsertTripAdvisorReview(
  hotelId: string,
  review: SerpApiTripAdvisorReview
): Promise<boolean> {
  const externalId =
    review.review_id ?? review.user?.username ?? null;
  if (!externalId) return false;

  const existing = await prisma.review.findUnique({
    where: {
      hotelId_source_externalId: {
        hotelId,
        source: "tripadvisor",
        externalId,
      },
    },
  });

  if (existing) return false;

  const fullText = [review.title, review.text].filter(Boolean).join("\n\n");

  await prisma.review.create({
    data: {
      hotelId,
      source: "tripadvisor",
      externalId,
      authorName: review.user?.username ?? "Anonymous",
      authorUrl: review.user?.link ?? null,
      rating: review.rating ?? null,
      text: fullText,
      reviewDate: review.date ? new Date(review.date) : null,
      reviewLink: review.url ?? null,
      language: null,
    },
  });

  return true;
}
