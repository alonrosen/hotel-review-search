/* POST /api/hotels/lookup — search for Place ID and TripAdvisor URL via RapidAPI */

import { NextRequest } from "next/server";
import { searchTripAdvisorRapid } from "@/lib/rapidapi";
import { searchGooglePlaceIdApify } from "@/lib/apify";

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
      searchGooglePlaceIdApify(query),
      searchTripAdvisorRapid(query),
    ]);

    const googleMapped = googleResults.status === "fulfilled" 
      ? googleResults.value.map((res: any) => ({
          place_id: res.place_id,
          title: res.title,
          address: res.address,
          city: res.city,
          country: res.countryCode,
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
