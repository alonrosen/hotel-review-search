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
  
  if (data?.data?.reviews) {
    console.log(`Found ${data.data.reviews.length} reviews at data.reviews!`);
    for (let i = 0; i < Math.min(3, data.data.reviews.length); i++) {
       const r = data.data.reviews[i];
       console.log(`\nReview ${i + 1}:`);
       console.log(`  Title: ${r.title}`);
       console.log(`  Rating: ${r.rating}`);
       console.log(`  Author: ${r.userProfile?.displayName}`);
       console.log(`  Published: ${r.publishedDate}`);
       console.log(`  Text: ${r.htmlText?.substring(0, 200) || r.text?.substring(0, 200)}...`);
    }
  } else {
    console.log("No data.reviews found in the response. Keys under data:", Object.keys(data?.data || {}));
    // try to find it elsewhere
    console.log("Keys under top level:", Object.keys(data || {}));
  }
}

run().catch(e => { console.error("Fatal:", e); process.exit(1); });
