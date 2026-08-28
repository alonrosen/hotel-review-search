/* GET  /api/hotels — list all hotels with review counts
   POST /api/hotels — add a new hotel (admin) */

import { NextRequest } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const hotels = await prisma.hotel.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { reviews: true } } },
  });

  return Response.json(hotels);
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, googlePlaceId, tripAdvisorId, tripAdvisorUrl, city, country } =
    body;

  if (!name) {
    return Response.json({ error: "Hotel name is required" }, { status: 400 });
  }

  const hotel = await prisma.hotel.create({
    data: {
      name,
      googlePlaceId: googlePlaceId || null,
      tripAdvisorId: tripAdvisorId || null,
      tripAdvisorUrl: tripAdvisorUrl || null,
      city: city || null,
      country: country || null,
    },
  });

  return Response.json(hotel, { status: 201 });
}
