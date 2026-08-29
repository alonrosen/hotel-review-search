const dotenv = require("dotenv");
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function run() {
  console.log("Testing Google Maps Business Details...");
  try {
    const businessId = "0x89c2592589dad0d1:0x621aae46fae3fb16"; // From earlier search
    const GOOGLE_API_HOST = "local-business-data.p.rapidapi.com";
    
    // Testing /business-details endpoint
    const url = `https://${GOOGLE_API_HOST}/business-details?business_id=${encodeURIComponent(businessId)}&region=us&language=en`;
    
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": GOOGLE_API_HOST,
      }
    });
    console.log("Google Details status:", res.status);
    const data = await res.json();
    console.log("Google Details response keys:", Object.keys(data?.data?.[0] || data || {}));
    if (data?.data?.[0]?.reviews_data) {
        console.log("Has reviews_data!", data.data[0].reviews_data.length);
    }
  } catch (e) {
    console.error("Google error:", e);
  }
}

run();
