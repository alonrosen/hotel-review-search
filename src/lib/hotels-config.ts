/* ──────────────────────────────────────────────────────────────
   Preset hotel configurations.
   Edit this list to add/remove hotels for review tracking.
   Hotels are seeded via the admin UI or /api/hotels POST.
   ────────────────────────────────────────────────────────────── */

import type { HotelConfig } from "./types";

export const PRESET_HOTELS: HotelConfig[] = [
  // Example — replace with your own hotels:
  // {
  //   name: "The Ritz London",
  //   googlePlaceId: "ChIJ...",      // find via Google Maps share URL
  //   tripAdvisorUrl: "https://www.tripadvisor.com/Hotel_Review-g186338-d187591-...",
  //   city: "London",
  //   country: "UK",
  // },
];
