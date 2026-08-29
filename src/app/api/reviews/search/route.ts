/* POST /api/reviews/search — full-text search across cached reviews */

import { NextRequest } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, hotelId, source, asOfDate, page } = body;

  if (!hotelId) {
    return Response.json(
      { error: "hotelId is required" },
      { status: 400 }
    );
  }

  // Determine the as-of date
  let effectiveAsOfDate: Date | null = null;

  if (asOfDate) {
    effectiveAsOfDate = new Date(asOfDate);
  }

  // Build the where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    hotelId,
  };

  if (query) {
    where.text = { contains: query, mode: "insensitive" };
  }

  if (source && source !== "both") {
    where.source = source;
  }

  if (effectiveAsOfDate) {
    where.reviewDate = { gte: effectiveAsOfDate };
  }

  // Pagination logic
  const pageNumber = parseInt(page) || 1;
  const take = 20;
  const skip = (pageNumber - 1) * take;

  // On page 1, fetch latest reviews live from API to ensure we have fresh data
  if (pageNumber === 1) {
    try {
      const { fetchAndUpsertReviews } = await import("@/lib/reviews");
      await fetchAndUpsertReviews(hotelId, source || "both", 1);
    } catch (err) {
      console.error("Failed to sync live reviews on search:", err);
      // We don't block the search if live fetch fails, just fall back to cache
    }
  }

  // Execute search
  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { reviewDate: "desc" },
      include: { hotel: true },
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ]);

  // Highlight matching text
  const results = reviews.map((review, index) => ({
    review,
    highlightedText: highlightText(review.text, query),
    matchRank: index + 1,
  }));

  // Find the latest review date in results for logging
  const latestReviewDate = reviews.reduce(
    (latest, r) => {
      if (r.reviewDate && (!latest || r.reviewDate > latest)) {
        return r.reviewDate;
      }
      return latest;
    },
    null as Date | null
  );

  // Log the search (only if query is provided)
  if (query) {
    await prisma.searchLog.create({
      data: {
        query,
        hotelId,
        asOfDate: effectiveAsOfDate,
        resultCount: totalCount,
        lastMatchDate: totalCount > 0 ? latestReviewDate : null,
      },
    });
  }

  return Response.json({
    results,
    totalCount,
    totalPages: Math.ceil(totalCount / take),
    currentPage: pageNumber,
    query: query || "",
    asOfDate: effectiveAsOfDate?.toISOString() ?? null,
    searchedAt: new Date().toISOString(),
  });
}

/* ── helpers ───────────────────────────────────────────────── */

function highlightText(text: string, query: string): string {
  if (!query) return text;

  // Escape regex special characters in the query
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");

  return text.replace(regex, "<mark>$1</mark>");
}
