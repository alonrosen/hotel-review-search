/* POST /api/reviews/fetch — trigger RapidAPI fetch for a hotel's reviews */

import { NextRequest } from "next/server";
import { fetchAndUpsertReviews } from "@/lib/reviews";

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

  try {
    const result = await fetchAndUpsertReviews(hotelId, source, pages);
    return Response.json(result);
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

