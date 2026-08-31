/* POST /api/reviews/search — full-text search across cached reviews */

import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAuth();
    if (session.status !== 'active') {
      return Response.json({ error: "Account is pending approval" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { query, hotelIds, source, asOfDate, page } = body;

  if (!hotelIds || !Array.isArray(hotelIds) || hotelIds.length === 0) {
    return Response.json(
      { error: "hotelIds must be a non-empty array" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 401 });
  }


  if (!user.isSubscribed && user.role !== 'admin') {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ['sub_free_searches', 'sub_free_period_value', 'sub_free_period_unit'] } }
    });
    
    let limit = 5;
    let periodValue = 1;
    let periodUnit = "day";
    
    for (const s of settings) {
      if (s.key === "sub_free_searches") limit = parseInt(s.value) || 5;
      if (s.key === "sub_free_period_value") periodValue = parseInt(s.value) || 1;
      if (s.key === "sub_free_period_unit") periodUnit = s.value;
    }
    
    let startDate: Date | null = new Date();
    if (periodUnit === "hour") startDate.setHours(startDate.getHours() - periodValue);
    else if (periodUnit === "day") startDate.setDate(startDate.getDate() - periodValue);
    else if (periodUnit === "week") startDate.setDate(startDate.getDate() - (periodValue * 7));
    else if (periodUnit === "month") startDate.setMonth(startDate.getMonth() - periodValue);
    else if (periodUnit === "year") startDate.setFullYear(startDate.getFullYear() - periodValue);
    else startDate = null; // lifetime
    
    const countWhere: any = { userId: session.userId };
    if (startDate) countWhere.createdAt = { gte: startDate };
    
    const searchCount = await prisma.searchLog.count({ where: countWhere });
    
    if (searchCount >= limit) {
      return Response.json({ 
        error: "PAYWALL_LIMIT_REACHED", 
        message: `You've reached your limit of ${limit} free searches per ${periodValue === 1 ? '' : periodValue + ' '}${periodUnit}${periodValue === 1 ? '' : 's'}.` 
      }, { status: 403 });
    }
  }

  // Determine the as-of date
  let effectiveAsOfDate: Date | null = null;

  if (asOfDate) {
    effectiveAsOfDate = new Date(asOfDate);
  }

  // Build the where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    hotelId: { in: hotelIds },
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

  // Log the search
  await prisma.searchLog.create({
    data: {
      userId: session.userId,
      query: query || "",
      hotels: {
        connect: hotelIds.map((id: string) => ({ id }))
      },
      asOfDate: effectiveAsOfDate,
      resultCount: totalCount,
      lastMatchDate: totalCount > 0 ? latestReviewDate : null,
    },
  });

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
