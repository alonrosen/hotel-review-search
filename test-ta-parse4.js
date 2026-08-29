const dotenv = require("dotenv");
dotenv.config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const HOST = "tripadvisor-com1.p.rapidapi.com";

async function rapidFetch(path) {
  const url = `https://${HOST}${path}`;
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": HOST,
    },
  });
  return await res.json();
}

async function run() {
  const data = await rapidFetch("/hotels/reviews?contentId=11854022");
  console.log(JSON.stringify(data.data.reviews, null, 2).substring(0, 3000));
}

run().catch(e => { console.error("Fatal:", e); process.exit(1); });
