const dotenv = require("dotenv");
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const GOOGLE_API_HOST = "local-business-data.p.rapidapi.com";

async function run() {
  const query = "DoubleTree by Hilton New York Times Square South";
  const url = `https://${GOOGLE_API_HOST}/search?query=${encodeURIComponent(query)}&limit=3`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": GOOGLE_API_HOST,
    },
  });

  const data = await res.json();
  console.log("Search response:", JSON.stringify(data.data, null, 2).substring(0, 1000));
}

run();
