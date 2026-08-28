/* POST /api/reviews/search — full-text search across cached reviews */

import { NextRequest } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, hotelId, source, asOfDate } = body;

  if (!query || !hotelId) {
    return Response.json(
      { error: "query and hotelId are required" },
      { status: 400 }
    );
  }

  // Determine the as-of date
  let effectiveAsOfDate: Date | null = null;

  if (asOfDate) {
    effectiveAsOfDate = new Date(asOfDate);
  } else {
    // Look up the last time this query returned results for this hotel
    const lastLog = await prisma.searchLog.findFirst({
      where: {
        query: { equals: query, mode: "insensitive" },
        hotelId,
        resultCount: { gt: 0 },
      },
      orderBy: { createdAt: "desc" },
    });

    if (lastLog?.lastMatchDate) {
      effectiveAsOfDate = lastLog.lastMatchDate;
    }
  }

  // Build the where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    hotelId,
    text: { contains: query, mode: "insensitive" },
  };

  if (source && source !== "both") {
    where.source = source;
  }

  if (effectiveAsOfDate) {
    where.reviewDate = { gte: effectiveAsOfDate };
  }

  // Execute search
  const reviews = await prisma.review.findMany({
    where,
    orderBy: { reviewDate: "desc" },
    include: { hotel: true },
    take: 100,
  });

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

  // Log the search
  await prisma.searchLog.create({
    data: {
      query,
      hotelId,
      asOfDate: effectiveAsOfDate,
      resultCount: results.length,
      lastMatchDate: results.length > 0 ? latestReviewDate : null,
    },
  });

  return Response.json({
    results,
    totalCount: results.length,
    query,
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
