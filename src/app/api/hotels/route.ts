/* GET  /api/hotels — list all hotels with review counts
   POST /api/hotels — add a new hotel (admin) */

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

  // Automatically lookup Google Place ID if not provided
  if (!googlePlaceId) {
    try {
      const { searchGooglePlaceIdApify } = await import("@/lib/apify");
      const googleResults = await searchGooglePlaceIdApify(name + (city ? " " + city : ""));
      if (googleResults && googleResults.length > 0) {
        googlePlaceId = googleResults[0].place_id;
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
        if (!tripAdvisorUrl && results[0].location_id) tripAdvisorUrl = `https://www.tripadvisor.com/Hotel_Review-d${results[0].location_id}`;
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

