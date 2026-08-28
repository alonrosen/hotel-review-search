/* POST /api/hotels/lookup — search Google Maps + TripAdvisor for a hotel */

import { NextRequest } from "next/server";
import { searchGooglePlace, searchTripAdvisorPlace } from "@/lib/serpapi";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, city, country } = body;

  if (!name) {
    return Response.json(
      { error: "Hotel name is required" },
      { status: 400 }
    );
  }

  const searchQuery = [name, city, country].filter(Boolean).join(" ");

  const [google, tripadvisor] = await Promise.all([
    searchGooglePlace(searchQuery).catch(() => []),
    searchTripAdvisorPlace(searchQuery).catch(() => []),
  ]);

  return Response.json({ google, tripadvisor });
}
