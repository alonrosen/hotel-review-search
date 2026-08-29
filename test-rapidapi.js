const dotenv = require("dotenv");
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function run() {
  console.log("Testing Google Maps search...");
  try {
    const query = "DoubleTree by Hilton New York Times Square South, new york, US";
    const GOOGLE_API_HOST = "local-business-data.p.rapidapi.com";
    const url = `https://${GOOGLE_API_HOST}/search?query=${encodeURIComponent(query)}&limit=3`;
    
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": GOOGLE_API_HOST,
      }
    });
    console.log("Google status:", res.status);
    const data = await res.json();
    console.log("Google response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Google error:", e);
  }

  console.log("\nTesting TripAdvisor search...");
  try {
    const query = "DoubleTree by Hilton New York Times Square South, new york, US";
    const TA_API_HOST = "tripadvisor16.p.rapidapi.com";
    const url = `https://${TA_API_HOST}/api/v1/hotels/searchLocation?query=${encodeURIComponent(query)}`;
    
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": TA_API_HOST,
      }
    });
    console.log("TA status:", res.status);
    const data = await res.json();
    console.log("TA response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("TA error:", e);
  }
}

run();
