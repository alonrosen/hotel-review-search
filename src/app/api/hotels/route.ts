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
  let { name, googlePlaceId, tripAdvisorId, tripAdvisorUrl, city, country } =
    body;

  if (!name) {
    return Response.json({ error: "Hotel name is required" }, { status: 400 });
  }

  // Automatically lookup Google Place ID if not provided
  if (!googlePlaceId) {
    try {
      const { searchGooglePlaceIdRapid } = await import("@/lib/rapidapi");
      const googleResults = await searchGooglePlaceIdRapid(name + (city ? " " + city : ""));
      if (googleResults && googleResults.length > 0) {
        googlePlaceId = googleResults[0].business_id || googleResults[0].place_id;
      }
    } catch (error) {
      console.error("Failed to auto-lookup Google ID:", error);
    }
  }

  // Automatically lookup TripAdvisor contentId if not provided
  if (!tripAdvisorId || !tripAdvisorUrl) {
    try {
      const { searchTripAdvisorRapid } = await import("@/lib/rapidapi");
      const results = await searchTripAdvisorRapid(name + (city ? " " + city : ""));
      if (results && results.length > 0) {
        if (!tripAdvisorId) tripAdvisorId = results[0].location_id;
        if (!tripAdvisorUrl && results[0].link) tripAdvisorUrl = results[0].link;
      }
    } catch (error) {
      console.error("Failed to auto-lookup TripAdvisor ID:", error);
    }
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

