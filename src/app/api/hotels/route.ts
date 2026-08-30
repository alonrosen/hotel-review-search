/* GET  /api/hotels — list all hotels with review counts
   POST /api/hotels — add a new hotel (admin)
   PUT  /api/hotels — update an existing hotel (admin) */

import { NextRequest } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const hotels = await prisma.hotel.findMany({
    orderBy: { name: "asc" },
    include: {
      reviews: {
        select: {
          source: true,
          reviewDate: true,
          fetchedAt: true,
        },
      },
    },
  });

  const formattedHotels = hotels.map((hotel) => {
    const googleReviews = hotel.reviews.filter((r) => r.source === "google");
    const taReviews = hotel.reviews.filter((r) => r.source === "tripadvisor");

    const latestGoogle =
      googleReviews.length > 0
        ? googleReviews.reduce(
            (latest, r) => (r.reviewDate && r.reviewDate > latest ? r.reviewDate : latest),
            googleReviews[0].reviewDate || new Date(0)
          )
        : null;

    const latestTA =
      taReviews.length > 0
        ? taReviews.reduce(
            (latest, r) => (r.reviewDate && r.reviewDate > latest ? r.reviewDate : latest),
            taReviews[0].reviewDate || new Date(0)
          )
        : null;

    const latestFetchDate = 
      hotel.reviews.length > 0
        ? hotel.reviews.reduce(
            (latest, r) => (r.fetchedAt && r.fetchedAt > latest ? r.fetchedAt : latest),
            hotel.reviews[0].fetchedAt || new Date(0)
          )
        : null;

    return {
      id: hotel.id,
      name: hotel.name,
      googlePlaceId: hotel.googlePlaceId,
      tripAdvisorId: hotel.tripAdvisorId,
      tripAdvisorUrl: hotel.tripAdvisorUrl,
      city: hotel.city,
      country: hotel.country,
      _count: { reviews: hotel.reviews.length },
      stats: {
        googleCount: googleReviews.length,
        tripadvisorCount: taReviews.length,
        latestGoogleReviewDate: latestGoogle,
        latestTripadvisorReviewDate: latestTA,
        lastFetchDate: latestFetchDate,
      },
    };
  });

  return Response.json(formattedHotels);
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

  // Fetch default providers
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["provider_google", "provider_tripadvisor"] } }
  });
  const googleProvider = settings.find(s => s.key === "provider_google")?.value || "rapidapi";
  const taProvider = settings.find(s => s.key === "provider_tripadvisor")?.value || "rapidapi";

  // Automatically lookup Google Place ID if not provided
  if (!googlePlaceId) {
    try {
      const { runSearchWithFallback } = await import("@/lib/search");
      const googleResults = await runSearchWithFallback("google", name + (city ? " " + city : ""), googleProvider);
      if (googleResults && googleResults.length > 0) {
        googlePlaceId = googleResults[0].place_id || googleResults[0].placeId || googleResults[0].id;
      }
    } catch (error) {
      console.error("Failed to auto-lookup Google ID:", error);
    }
  }

  // Automatically lookup TripAdvisor contentId if not provided
  if (!tripAdvisorId || !tripAdvisorUrl) {
    try {
      const { runSearchWithFallback } = await import("@/lib/search");
      const results = await runSearchWithFallback("tripadvisor", name + (city ? " " + city : ""), taProvider);
      if (results && results.length > 0) {
        const id = results[0].location_id || results[0].id || results[0].geoId;
        if (!tripAdvisorId) tripAdvisorId = id;
        if (!tripAdvisorUrl && id) tripAdvisorUrl = `https://www.tripadvisor.com/Hotel_Review-d${id}`;
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

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, name, googlePlaceId, tripAdvisorId, tripAdvisorUrl, city, country } = body;

  if (!id) {
    return Response.json({ error: "Hotel id is required" }, { status: 400 });
  }

  const existing = await prisma.hotel.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Hotel not found" }, { status: 404 });
  }

  const hotel = await prisma.hotel.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      googlePlaceId: googlePlaceId !== undefined ? (googlePlaceId || null) : existing.googlePlaceId,
      tripAdvisorId: tripAdvisorId !== undefined ? (tripAdvisorId || null) : existing.tripAdvisorId,
      tripAdvisorUrl: tripAdvisorUrl !== undefined ? (tripAdvisorUrl || null) : existing.tripAdvisorUrl,
      city: city !== undefined ? (city || null) : existing.city,
      country: country !== undefined ? (country || null) : existing.country,
    },
  });

  return Response.json(hotel);
}
