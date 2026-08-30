import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { logEvent } from "@/lib/logger";

import { runSearchWithFallback } from "@/lib/search";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try { await requireAuth(['admin']); } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }

  const { query } = await req.json();

  if (!query) {
    return Response.json({ error: "Query is required" }, { status: 400 });
  }

  // Get active provider settings
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["provider_google", "provider_tripadvisor"] } }
  });
  
  const googleProvider = settings.find(s => s.key === "provider_google")?.value || "rapidapi";
  const taProvider = settings.find(s => s.key === "provider_tripadvisor")?.value || "rapidapi";

  const googleResultsRaw = await runSearchWithFallback("google", query, googleProvider);
  const taResultsRaw = await runSearchWithFallback("tripadvisor", query, taProvider);
  
  // Normalize Google Results
  const googleResults = googleResultsRaw.map((r: any) => ({
    id: r.place_id || r.placeId || r.id,
    name: r.title || r.name,
    address: r.address || r.vicinity || "",
    city: r.city || "",
    countryCode: r.countryCode || ""
  }));

  // Normalize TA Results
  const tripadvisorResults = taResultsRaw.map((r: any) => ({
    id: r.location_id || r.id || r.geoId,
    name: r.title || r.name || r.heading?.htmlString?.replace(/<\/?[^>]+(>|$)/g, ""),
    address: r.address || (r.addressObj ? `${r.addressObj.street1 || ''}, ${r.addressObj.city || ''}` : "") || r.secondaryTextLineOne?.string || "",
  }));

  // Merge logic based on title similarity
  const mergedResults: any[] = [];
  
  // Clean string helper for basic matching
  const clean = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const usedTaIndexes = new Set<number>();

  for (const g of googleResults) {
    const gClean = clean(g.name);
    let bestMatchIdx = -1;
    
    // Find best TA match
    for (let i = 0; i < tripadvisorResults.length; i++) {
      if (usedTaIndexes.has(i)) continue;
      const taClean = clean(tripadvisorResults[i].name);
      
      // Simple exact or substring match
      if (gClean === taClean || gClean.includes(taClean) || taClean.includes(gClean)) {
        bestMatchIdx = i;
        break;
      }
    }

    let taMatch = null;
    if (bestMatchIdx !== -1) {
      taMatch = tripadvisorResults[bestMatchIdx];
      usedTaIndexes.add(bestMatchIdx);
    }

    mergedResults.push({
      name: g.name,
      address: g.address,
      city: g.city,
      countryCode: g.countryCode,
      googlePlaceId: g.id,
      tripadvisorId: taMatch ? taMatch.id : null,
      score: gClean.includes(clean(query)) ? 100 : 50 // Sort boost if it matches query well
    });
  }

  // Add any remaining TA results that didn't match a Google result
  for (let i = 0; i < tripadvisorResults.length; i++) {
    if (!usedTaIndexes.has(i)) {
      const ta = tripadvisorResults[i];
      const taClean = clean(ta.name);
      mergedResults.push({
        name: ta.name,
        address: ta.address,
        city: "",
        countryCode: "",
        googlePlaceId: null,
        tripadvisorId: ta.id,
        score: taClean.includes(clean(query)) ? 100 : 50
      });
    }
  }

  // Sort by score
  mergedResults.sort((a, b) => b.score - a.score);

  return Response.json({ merged: mergedResults });
}
