import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { fetchAndUpsertReviews } from "@/lib/reviews";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // In a real app, verify a secret token for cron jobs
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hotels = await prisma.hotel.findMany();
    const results = [];

    for (const hotel of hotels) {
      console.log(`Cron backfill starting for hotel: ${hotel.name}`);
      // Backfill up to 100 recent reviews (we let reviews.ts handle the sinceDate logic)
      const res = await fetchAndUpsertReviews(hotel.id, "both", 100);
      results.push({ hotel: hotel.name, ...res });
    }

    // --- Log Cleanup Logic ---
    const logCount = await prisma.log.count();
    if (logCount > 1000) {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      
      const deletedLogs = await prisma.log.deleteMany({
        where: {
          createdAt: {
            lt: twoMonthsAgo,
          }
        }
      });
      if (deletedLogs.count > 0) {
        console.log(`[Cron] Cleaned up ${deletedLogs.count} old logs.`);
      }
    }

    return Response.json({ success: true, results });
  } catch (err: any) {
    console.error("Cron sync error:", err);
    try {
      const { logEvent } = await import("@/lib/logger");
      await logEvent("ERROR", "cron", err.message, err);
    } catch(e) {}
    return Response.json({ error: err.message }, { status: 500 });
  }
}
