/* POST /api/hotels/lookup — search for Place ID and TripAdvisor URL via RapidAPI */

import { NextRequest } from "next/server";
import { searchGooglePlaceIdRapid, searchTripAdvisorRapid } from "@/lib/rapidapi";

export async function POST(req: NextRequest) {
  try {
    const { name, city, country } = await req.json();

    if (!name) {
      return Response.json(
        { error: "Hotel name is required for lookup" },
        { status: 400 }
      );
    }

    const query = [name, city, country].filter(Boolean).join(", ");

    const [googleResults, taResults] = await Promise.allSettled([
      searchGooglePlaceIdRapid(query),
      searchTripAdvisorRapid(query),
    ]);

    const googleMapped = googleResults.status === "fulfilled" 
      ? googleResults.value.map((res: any) => ({
          place_id: res.business_id || res.place_id,
          title: res.name || res.title,
          address: res.full_address || res.address,
        }))
      : [];

    return Response.json({
      google: googleMapped,
      tripadvisor: taResults.status === "fulfilled" ? taResults.value : [],
    });
  } catch (error) {
    console.error("Lookup error:", error);
    return Response.json({ error: "Lookup failed" }, { status: 500 });
  }
}
