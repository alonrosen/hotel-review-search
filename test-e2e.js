/**
 * E2E Test Script — Tests all three review data paths:
 *   1. New TripAdvisor Scraper API (tripadvisor-scraper.p.rapidapi.com)
 *   2. Google Reviews fetch + in-memory keyword search
 *   3. Full DB pipeline: fetch → store → search via API
 */

const dotenv = require("dotenv");
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
if (!RAPIDAPI_KEY) {
  console.error("❌ RAPIDAPI_KEY missing in .env");
  process.exit(1);
}

const GOOGLE_HOST = "local-business-data.p.rapidapi.com";
const TA_HOST = "tripadvisor-scraper.p.rapidapi.com";

// Test hotel — DoubleTree by Hilton New York Times Square South
const TEST_BUSINESS_ID = "0x89c2592589dad0d1:0x621aae46fae3fb16";
const TEST_SEARCH_KEYWORD = "room"; // common word in hotel reviews
const SEPARATOR = "\n" + "=".repeat(70) + "\n";

async function rapidFetch(host, path) {
  const url = `https://${host}${path}`;
  console.log(`  → ${url}`);
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": host,
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

// ─────────────────────────────────────────────────────────────
// TEST 1: TripAdvisor Scraper API — discover endpoints
// ─────────────────────────────────────────────────────────────
async function testTripAdvisorScraper() {
  console.log(SEPARATOR);
  console.log("  🔍 TEST 1: TripAdvisor Scraper API Discovery");
  console.log(SEPARATOR);

  // 1a: Attractions list (the URL the user provided)
  console.log("\n[1a] Attractions list (user-provided URL):");
  const { status: s1, data: d1 } = await rapidFetch(TA_HOST, "/attractions/list?query=new+york");
  console.log(`  Status: ${s1}`);
  console.log(`  Response preview:`, JSON.stringify(d1, null, 2).substring(0, 800));

  // Small delay to avoid rate limiting
  await sleep(1500);

  // 1b: Hotels search
  console.log("\n[1b] Hotels search:");
  const { status: s2, data: d2 } = await rapidFetch(TA_HOST, "/hotels/list?query=DoubleTree+Hilton+Times+Square+New+York");
  console.log(`  Status: ${s2}`);
  console.log(`  Response preview:`, JSON.stringify(d2, null, 2).substring(0, 800));

  await sleep(1500);

  // 1c: Hotel reviews — try locationId 114099 (The Plaza)
  console.log("\n[1c] Hotel reviews (The Plaza, id=114099):");
  const { status: s3, data: d3 } = await rapidFetch(TA_HOST, "/hotels/reviews?id=114099");
  console.log(`  Status: ${s3}`);
  console.log(`  Response preview:`, JSON.stringify(d3, null, 2).substring(0, 1200));

  await sleep(1500);

  // 1d: Alternative review endpoint patterns
  console.log("\n[1d] Reviews with locationId param:");
  const { status: s4, data: d4 } = await rapidFetch(TA_HOST, "/reviews/list?locationId=114099");
  console.log(`  Status: ${s4}`);
  console.log(`  Response preview:`, JSON.stringify(d4, null, 2).substring(0, 800));

  await sleep(1500);

  // 1e: Location details
  console.log("\n[1e] Location details:");
  const { status: s5, data: d5 } = await rapidFetch(TA_HOST, "/hotels/detail?id=114099");
  console.log(`  Status: ${s5}`);
  console.log(`  Response preview:`, JSON.stringify(d5, null, 2).substring(0, 800));

  return { s1, d1, s2, d2, s3, d3, s4, d4, s5, d5 };
}

// ─────────────────────────────────────────────────────────────
// TEST 2: Google Reviews — fetch + in-memory search
// ─────────────────────────────────────────────────────────────
async function testGoogleReviewsSearch() {
  console.log(SEPARATOR);
  console.log("  🔍 TEST 2: Google Reviews — Fetch + Search");
  console.log(SEPARATOR);

  // 2a: Fetch 20 reviews
  console.log(`\n[2a] Fetching 20 Google reviews for business ${TEST_BUSINESS_ID}...`);
  const { status, data } = await rapidFetch(
    GOOGLE_HOST,
    `/business-reviews-v2?business_id=${encodeURIComponent(TEST_BUSINESS_ID)}&limit=20&sort_by=most_relevant&region=us&language=en`
  );
  
  console.log(`  Status: ${status}`);
  console.log(`  API Status: ${data?.status}`);
  
  const reviews = data?.data?.reviews || [];
  console.log(`  Reviews fetched: ${reviews.length}`);

  if (reviews.length === 0) {
    console.log("  ❌ No reviews returned! Cannot test search.");
    return;
  }

  // 2b: Show first 3 reviews
  console.log(`\n[2b] First 3 reviews:`);
  for (let i = 0; i < Math.min(3, reviews.length); i++) {
    const r = reviews[i];
    console.log(`\n  Review #${i + 1}:`);
    console.log(`    Author:  ${r.author_name}`);
    console.log(`    Rating:  ${"★".repeat(r.rating || 0)}${"☆".repeat(5 - (r.rating || 0))}`);
    console.log(`    Date:    ${r.review_datetime_utc}`);
    console.log(`    Link:    ${r.review_link?.substring(0, 80)}...`);
    console.log(`    Text:    ${r.review_text?.substring(0, 200)}...`);
  }

  // 2c: In-memory keyword search
  console.log(`\n[2c] In-memory search for "${TEST_SEARCH_KEYWORD}":`);
  const matches = reviews.filter(r =>
    r.review_text?.toLowerCase().includes(TEST_SEARCH_KEYWORD.toLowerCase())
  );
  console.log(`  ✅ Found ${matches.length} reviews containing "${TEST_SEARCH_KEYWORD}" (out of ${reviews.length} total)`);

  for (let i = 0; i < Math.min(5, matches.length); i++) {
    const r = matches[i];
    const text = r.review_text || "";
    const idx = text.toLowerCase().indexOf(TEST_SEARCH_KEYWORD.toLowerCase());
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + TEST_SEARCH_KEYWORD.length + 40);
    const snippet = (start > 0 ? "..." : "") + text.substring(start, end) + (end < text.length ? "..." : "");

    console.log(`\n  Match #${i + 1}:`);
    console.log(`    Author:  ${r.author_name} (${r.rating}★)`);
    console.log(`    Date:    ${r.review_datetime_utc}`);
    console.log(`    Snippet: "${snippet}"`);
    console.log(`    Link:    ${r.review_link?.substring(0, 100)}`);
  }

  return reviews;
}

// ─────────────────────────────────────────────────────────────
// TEST 3: Full DB pipeline (fetch → store → search via Next.js API)
// ─────────────────────────────────────────────────────────────
async function testFullPipeline() {
  console.log(SEPARATOR);
  console.log("  🔍 TEST 3: Full DB Pipeline (via Next.js API)");
  console.log(SEPARATOR);

  const BASE = "http://localhost:3000";

  // Check if dev server is running
  try {
    const healthCheck = await fetch(`${BASE}/api/hotels`, { signal: AbortSignal.timeout(3000) });
    if (!healthCheck.ok) throw new Error(`Status ${healthCheck.status}`);
    console.log("\n  ✅ Dev server is running at", BASE);
  } catch (e) {
    console.log("\n  ⚠️  Dev server not running at", BASE);
    console.log("     Start it with: npm run dev");
    console.log("     Skipping DB pipeline test.\n");
    return;
  }

  const ADMIN_SECRET = process.env.ADMIN_SECRET || "iamadmin";

  // 3a: List hotels
  console.log("\n[3a] GET /api/hotels — listing hotels...");
  const hotelsRes = await fetch(`${BASE}/api/hotels`);
  const hotels = await hotelsRes.json();
  console.log(`  Status: ${hotelsRes.status}`);
  console.log(`  Hotels in DB: ${Array.isArray(hotels) ? hotels.length : "N/A"}`);

  if (Array.isArray(hotels)) {
    for (const h of hotels) {
      console.log(`    - ${h.name} (id: ${h.id}, googlePlaceId: ${h.googlePlaceId}, reviews: ${h._count?.reviews ?? "?"})`);
    }
  }

  // 3b: Create a test hotel if none exist
  let testHotel;
  if (!Array.isArray(hotels) || hotels.length === 0) {
    console.log("\n[3b] POST /api/hotels — creating test hotel...");
    const createRes = await fetch(`${BASE}/api/hotels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({
        name: "DoubleTree by Hilton New York Times Square South",
        googlePlaceId: TEST_BUSINESS_ID,
        city: "New York",
        country: "US",
      }),
    });
    testHotel = await createRes.json();
    console.log(`  Status: ${createRes.status}`);
    console.log(`  Created:`, JSON.stringify(testHotel, null, 2));
  } else {
    // Use the first hotel with a googlePlaceId
    testHotel = hotels.find(h => h.googlePlaceId) || hotels[0];
    console.log(`\n[3b] Using existing hotel: ${testHotel.name} (id: ${testHotel.id})`);
  }

  if (!testHotel?.id) {
    console.log("  ❌ No test hotel available. Aborting pipeline test.");
    return;
  }

  // 3c: Fetch Google reviews into DB
  console.log(`\n[3c] POST /api/reviews/fetch — fetching Google reviews for "${testHotel.name}"...`);
  const fetchRes = await fetch(`${BASE}/api/reviews/fetch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({
      hotelId: testHotel.id,
      source: "google",
      pages: 1,
    }),
  });
  const fetchResult = await fetchRes.json();
  console.log(`  Status: ${fetchRes.status}`);
  console.log(`  Result:`, JSON.stringify(fetchResult, null, 2));

  // 3d: Search for keyword in stored reviews
  console.log(`\n[3d] POST /api/reviews/search — searching for "${TEST_SEARCH_KEYWORD}" in stored reviews...`);
  const searchRes = await fetch(`${BASE}/api/reviews/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: TEST_SEARCH_KEYWORD,
      hotelId: testHotel.id,
    }),
  });
  const searchResult = await searchRes.json();
  console.log(`  Status: ${searchRes.status}`);
  console.log(`  Total results: ${searchResult.totalCount}`);
  console.log(`  As-of date: ${searchResult.asOfDate}`);
  console.log(`  Searched at: ${searchResult.searchedAt}`);

  if (searchResult.results?.length > 0) {
    console.log(`\n  ✅ Search returned ${searchResult.results.length} results!`);
    for (let i = 0; i < Math.min(3, searchResult.results.length); i++) {
      const r = searchResult.results[i];
      console.log(`\n  Result #${i + 1}:`);
      console.log(`    Author:  ${r.review.authorName}`);
      console.log(`    Rating:  ${r.review.rating}★`);
      console.log(`    Date:    ${r.review.reviewDate}`);
      console.log(`    Source:  ${r.review.source}`);
      console.log(`    Link:    ${r.review.reviewLink?.substring(0, 100)}`);
      // Show highlighted snippet (strip <mark> tags for console)
      const snippet = r.highlightedText?.replace(/<\/?mark>/g, "**")?.substring(0, 200);
      console.log(`    Snippet: ${snippet}...`);
    }
  } else {
    console.log(`\n  ❌ No search results! Dumping full response:`);
    console.log(JSON.stringify(searchResult, null, 2).substring(0, 2000));
  }

  // 3e: Stats
  console.log(`\n[3e] GET /api/reviews/stats — review stats...`);
  const statsRes = await fetch(`${BASE}/api/reviews/stats`);
  const stats = await statsRes.json();
  console.log(`  Status: ${statsRes.status}`);
  for (const s of (Array.isArray(stats) ? stats : [])) {
    console.log(`    ${s.hotelName}: Google=${s.googleCount}, TripAdvisor=${s.tripadvisorCount}`);
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🏨 Hotel Review Search — E2E Test Suite");
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🔑 RapidAPI key: ${RAPIDAPI_KEY.substring(0, 8)}...`);

  // Test 1: TripAdvisor Scraper
  const taResults = await testTripAdvisorScraper();

  await sleep(2000);

  // Test 2: Google Reviews + in-memory search
  const googleReviews = await testGoogleReviewsSearch();

  // Test 3: Full pipeline via Next.js API
  await testFullPipeline();

  console.log(SEPARATOR);
  console.log("  ✅ E2E Test Complete");
  console.log(SEPARATOR);
}

main().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});
