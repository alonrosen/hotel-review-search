import { logEvent } from "@/lib/logger";

export async function runSearchWithFallback(
  type: "google" | "tripadvisor",
  query: string,
  primaryProvider: string
) {
  const providers = primaryProvider === "apify" ? ["apify", "rapidapi"] : ["rapidapi", "apify"];
  
  for (const provider of providers) {
    try {
      if (type === "google") {
        if (provider === "apify") {
          const { searchGooglePlaceIdApify } = await import("@/lib/apify");
          return await searchGooglePlaceIdApify(query);
        } else {
          const { searchGooglePlaceIdRapid } = await import("@/lib/rapidapi");
          return await searchGooglePlaceIdRapid(query);
        }
      } else {
        if (provider === "apify") {
          const { searchTripAdvisorApify } = await import("@/lib/apify");
          return await searchTripAdvisorApify(query);
        } else {
          const { searchTripAdvisorRapid } = await import("@/lib/rapidapi");
          return await searchTripAdvisorRapid(query);
        }
      }
    } catch (err: any) {
      await logEvent("WARN", "system", `Search failed for ${type} using ${provider}: ${err.message}`);
      console.warn(`Search failed for ${type} using ${provider}: ${err.message}`);
    }
  }
  return [];
}
