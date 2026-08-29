/**
 * Explore the tripadvisor-scraper API's hotel endpoints more carefully.
 * From the E2E test we know:
 *   - /attractions/list?query=X → WORKS
 *   - /hotels/list?query=X → 404 "PersistedQueryNotFound"  
 *   - /hotels/detail needs query param, not id
 * 
 * Let's discover what actually works for hotels + reviews.
 */
const dotenv = require("dotenv");
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const HOST = "tripadvisor-scraper.p.rapidapi.com";

async function test(label, path) {
  console.log(`\n--- ${label} ---`);
  const url = `https://${HOST}${path}`;
  console.log(`URL: ${url}`);
  try {
    const res = await fetch(url, {
      headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": HOST }
    });
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Response:`, JSON.stringify(data, null, 2).substring(0, 1500));
    return { status: res.status, data };
  } catch(e) {
    console.error(`Error: ${e.message}`);
    return { status: 0, data: null };
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  // Try hotel detail with query param
  await test("Hotel detail with query", "/hotels/detail?query=The+Plaza+New+York");
  await sleep(1500);

  // Try listing hotels with a geoId (NYC = 60763) 
  await test("Hotels list with geoId", "/hotels/list?geoId=60763");
  await sleep(1500);

  // Try the attraction reviews endpoint (since attractions work)
  await test("Attraction reviews", "/attractions/reviews?id=105127");
  await sleep(1500);

  // Try reviews endpoint at top level
  await test("Top-level reviews", "/reviews?locationId=114099");
  await sleep(1500);
  
  // Try location details (generic, not hotel-specific)
  await test("Location detail", "/location/detail?id=114099");
  await sleep(1500);

  // Google reviews already include TripAdvisor reviews!
  // Let's also re-verify: delete old reviews with missing links and re-fetch
  console.log("\n\n=== BONUS: Re-fetch Google reviews (with fixed review_link) ===\n");
  
  const GOOGLE_HOST = "local-business-data.p.rapidapi.com";
  const businessId = "0x89c2592589dad0d1:0x621aae46fae3fb16";
  
  const url = `https://${GOOGLE_HOST}/business-reviews-v2?business_id=${encodeURIComponent(businessId)}&limit=5&sort_by=most_relevant&region=us&language=en`;
  const res = await fetch(url, {
    headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": GOOGLE_HOST }
  });
  const data = await res.json();
  const reviews = data?.data?.reviews || [];
  
  console.log(`Fetched ${reviews.length} reviews. Checking review_link field:`);
  for (const r of reviews.slice(0, 5)) {
    console.log(`  ${r.author_name} (${r.rating}★):`);
    console.log(`    review_link: ${r.review_link ? r.review_link.substring(0, 120) + "..." : "MISSING"}`);
    console.log(`    review_source: ${r.review_source || "N/A"}`);
  }
}

run();
