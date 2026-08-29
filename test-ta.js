const dotenv = require("dotenv");
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function run() {
  console.log("\nTesting TripAdvisor Details...");
  try {
    const TA_API_HOST = "tripadvisor16.p.rapidapi.com";
    const locationId = "114099"; // The Plaza New York for example
    
    // Calculate dates: tomorrow and day after
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const checkIn = tomorrow.toISOString().split('T')[0];
    const checkOut = dayAfter.toISOString().split('T')[0];

    const url = `https://${TA_API_HOST}/api/v1/hotels/getHotelDetails?id=${locationId}&checkIn=${checkIn}&checkOut=${checkOut}&currency=USD`;
    
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": TA_API_HOST,
      }
    });
    const data = await res.json();
    console.log("TA Details status:", res.status);
    console.log("TA Details full response:", JSON.stringify(data, null, 2).substring(0, 1500));
    
    if (data?.data?.reviews) {
       console.log("Has reviews array");
    } else if (data?.data) {
       console.log("Inner keys:", Object.keys(data.data));
       if (data.data.about) console.log("About keys:", Object.keys(data.data.about));
    }
  } catch (e) {
    console.error("TA error:", e);
  }
}

run();
