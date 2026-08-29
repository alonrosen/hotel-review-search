
const dotenv = require("dotenv");
dotenv.config();

// Simple mock for searchTripAdvisorRapid to debug
async function run() {
  const query = "DoubleTree by Hilton New York Times Square South";
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const TA_API_HOST = "tripadvisor-com1.p.rapidapi.com";
  
  const checkInDate = new Date();
  checkInDate.setMonth(checkInDate.getMonth() + 6);
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + 1);
  
  const checkInStr = checkInDate.toISOString().split('T')[0];
  const checkOutStr = checkOutDate.toISOString().split('T')[0];

  const url = `https://${TA_API_HOST}/hotels/search?query=${encodeURIComponent(query)}&geoId=293928&checkIn=${checkInStr}&checkOut=${checkOutStr}`;
  console.log("URL:", url);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": TA_API_HOST,
      },
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Raw Response Keys:", Object.keys(data));
    
    if (data.errors) {
       console.log("Errors:", data.errors);
    }
    
    const hotels = data?.data?.hotels || data?.data || [];
    console.log("Hotels Array Length:", Array.isArray(hotels) ? hotels.length : typeof hotels);
    if (Array.isArray(hotels) && hotels.length > 0) {
      console.log("First hotel snippet:", JSON.stringify(hotels[0], null, 2).substring(0, 500));
    }
    
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
