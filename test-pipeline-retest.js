/**
 * Quick pipeline re-test:
 *   1. Delete old reviews (with missing review links)
 *   2. Re-fetch Google reviews (now with correct review_link field)
 *   3. Search and verify links are present
 */
const dotenv = require("dotenv");
dotenv.config();

const BASE = "http://localhost:3000";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "iamadmin";
const SEARCH_KEYWORD = "room";

async function run() {
  // 1. Get hotels
  console.log("1. Fetching hotels...");
  const hotelsRes = await fetch(`${BASE}/api/hotels`);
  const hotels = await hotelsRes.json();
  const hotel = hotels.find(h => h.googlePlaceId);
  
  if (!hotel) {
    console.log("❌ No hotel with googlePlaceId found. Run test-e2e.js first.");
    return;
  }
  console.log(`   Using: ${hotel.name} (id: ${hotel.id})`);
  console.log(`   Current reviews: ${hotel._count?.reviews ?? "?"}`);

  // 2. Delete old reviews for this hotel (so we re-fetch with correct links)
  console.log("\n2. Deleting old reviews to re-fetch with fixed links...");
  const delRes = await fetch(`${BASE}/api/hotels/${hotel.id}/reviews`, {
    method: "DELETE",
    headers: { "x-admin-secret": ADMIN_SECRET },
  });
  console.log(`   Delete status: ${delRes.status}`);
  if (delRes.status === 404) {
    console.log("   (No delete endpoint yet — let's just re-fetch, upserts will skip existing)");
  }

  // 3. Re-fetch Google reviews
  console.log("\n3. Re-fetching Google reviews...");
  const fetchRes = await fetch(`${BASE}/api/reviews/fetch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({ hotelId: hotel.id, source: "google", pages: 1 }),
  });
  const fetchResult = await fetchRes.json();
  console.log(`   Status: ${fetchRes.status}`);
  console.log(`   Result:`, JSON.stringify(fetchResult));

  // 4. Search for keyword
  console.log(`\n4. Searching for "${SEARCH_KEYWORD}"...`);
  const searchRes = await fetch(`${BASE}/api/reviews/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: SEARCH_KEYWORD, hotelId: hotel.id }),
  });
  const searchResult = await searchRes.json();
  console.log(`   Total results: ${searchResult.totalCount}`);

  if (searchResult.results?.length > 0) {
    console.log(`\n   ✅ ${searchResult.results.length} results found!\n`);
    for (let i = 0; i < Math.min(5, searchResult.results.length); i++) {
      const r = searchResult.results[i];
      const link = r.review.reviewLink;
      const hasLink = link && link !== "null" && link !== "undefined";
      console.log(`   #${i + 1}: ${r.review.authorName} (${r.review.rating}★, ${r.review.source})`);
      console.log(`       Link: ${hasLink ? "✅ " + link.substring(0, 100) + "..." : "❌ MISSING"}`);
      console.log(`       Date: ${r.review.reviewDate}`);
      console.log(`       Text: ${r.review.text?.substring(0, 120)}...\n`);
    }
  } else {
    console.log("   ❌ No results");
    console.log(JSON.stringify(searchResult, null, 2).substring(0, 500));
  }
}

run().catch(e => { console.error("Error:", e); process.exit(1); });
