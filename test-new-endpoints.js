const dotenv = require("dotenv");
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function run() {
  console.log("Testing Google Maps Reviews V2...");
  try {
    const businessId = "0x89c2592589dad0d1:0x621aae46fae3fb16"; // From earlier search
    const GOOGLE_API_HOST = "local-business-data.p.rapidapi.com";
    
    const url = `https://${GOOGLE_API_HOST}/business-reviews-v2?business_id=${encodeURIComponent(businessId)}&limit=3&sort_by=most_relevant&region=us&language=en`;
    
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": GOOGLE_API_HOST,
      }
    });
    const data = await res.json();
    console.log("Google Reviews V2 full response:", JSON.stringify(data, null, 2).substring(0, 1500));
  } catch (e) {
    console.error("Google error:", e);
  }

  console.log("\nTesting TripAdvisor Details...");
  try {
    const TA_API_HOST = "tripadvisor16.p.rapidapi.com";
    const locationId = "114099"; // The Plaza New York for example
    const url = `https://${TA_API_HOST}/api/v1/hotels/getHotelDetails?id=${locationId}&currency=USD`;
    
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": TA_API_HOST,
      }
    });
    const data = await res.json();
    console.log("TA Details full response:", JSON.stringify(data, null, 2).substring(0, 1500));
  } catch (e) {
    console.error("TA error:", e);
  }
}

run();
