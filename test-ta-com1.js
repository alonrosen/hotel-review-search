const dotenv = require("dotenv");
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const HOST = "tripadvisor-com1.p.rapidapi.com";

async function rapidFetch(path) {
  const url = `https://${HOST}${path}`;
  console.log(`  → ${url}`);
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": HOST,
    },
  });
  console.log(`  Status: ${res.status}`);
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log("\n=== TEST: Typeahead / Search ===\n");
  const endpoints = [
    "/typeahead?query=DoubleTree+by+Hilton+New+York+Times+Square+South",
    "/locations/search?query=DoubleTree+by+Hilton+New+York+Times+Square+South",
    "/search?query=DoubleTree+by+Hilton+New+York+Times+Square+South",
    "/hotels/search?query=DoubleTree+by+Hilton+New+York+Times+Square+South&geoId=60763&checkIn=2026-09-15&checkOut=2026-09-17",
    "/reviews?contentId=15288816",
    "/hotels/reviews?contentId=15288816",
  ];
  
  for (const ep of endpoints) {
    const { status, data } = await rapidFetch(ep);
    console.log("  Raw response (first 1000 chars):");
    console.log(JSON.stringify(data, null, 2).substring(0, 1000));
    console.log("\n-------------------------\n");
  }
}

run().catch(e => { console.error("Fatal:", e); process.exit(1); });
