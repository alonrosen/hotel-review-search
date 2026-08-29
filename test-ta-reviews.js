const dotenv = require("dotenv");
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function run() {
  console.log("\nTesting TripAdvisor Reviews...");
  try {
    const TA_API_HOST = "tripadvisor16.p.rapidapi.com";
    const locationId = "114099"; // The Plaza New York for example
    const url = `https://${TA_API_HOST}/api/v1/hotels/reviews?locationId=${locationId}&language=en_US`;
    
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": TA_API_HOST,
      }
    });
    console.log("TA Reviews status:", res.status);
    const data = await res.json();
    console.log("TA Reviews response keys:", Object.keys(data || {}));
    if (data?.data) {
       console.log("TA data array length:", data.data.length);
    }
  } catch (e) {
    console.error("TA error:", e);
  }
}

run();
