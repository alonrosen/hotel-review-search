const dotenv = require("dotenv");
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function run() {
  console.log("Testing Google Maps Reviews...");
  try {
    const businessId = "0x89c2592589dad0d1:0x621aae46fae3fb16"; // From earlier search
    const GOOGLE_API_HOST = "local-business-data.p.rapidapi.com";
    
    // Testing /reviews endpoint
    const url = `https://${GOOGLE_API_HOST}/reviews?business_id=${encodeURIComponent(businessId)}&limit=5&region=us&language=en`;
    
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": GOOGLE_API_HOST,
      }
    });
    console.log("Google Reviews status:", res.status);
    const data = await res.json();
    console.log("Google Reviews response:", JSON.stringify(data, null, 2).substring(0, 1000) + "...");
  } catch (e) {
    console.error("Google error:", e);
  }
}

run();
