import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { fetchAndUpsertReviews } from "@/lib/reviews";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await requireAuth(['admin']);
    const { hotelId, olderThanDate, asOfDate, fetchLimit, source } = await req.json();

    if (!hotelId) {
      return Response.json({ error: "Missing hotelId" }, { status: 400 });
    }

    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return Response.json({ error: "Hotel not found" }, { status: 404 });
    }

    const limit = fetchLimit ? parseInt(fetchLimit, 10) : 50;
    const since = asOfDate ? new Date(asOfDate) : undefined;
    const olderThan = olderThanDate ? new Date(olderThanDate) : undefined;

    const res = await fetchAndUpsertReviews(hotel.id, source || "both", limit, olderThan, since);

    return Response.json({ success: true, results: res });
  } catch (err: any) {
    console.error("Admin backfill error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
