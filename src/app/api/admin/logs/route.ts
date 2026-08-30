import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try { await requireAuth(['admin']); } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "100", 10);
  const level = url.searchParams.get("level");
  const source = url.searchParams.get("source");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  const where: any = {};
  
  if (level) where.level = level;
  if (source) where.source = source;
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const logs = await prisma.log.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return Response.json(logs);
}
