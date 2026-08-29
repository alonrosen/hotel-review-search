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
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  const { data } = await rapidFetch("/hotels/reviews?contentId=11854022");
  
  if (!data?.data?.sections) {
    console.log("No data.sections found");
    return;
  }
  
  // Find sections that might contain reviews
  let reviewCount = 0;
  for (const section of data.data.sections) {
    if (section.reviews || section.__typename === "AppPresentation_ReviewListSection" || section.reviewCard) {
       console.log("Found review section:", section.__typename);
       // dump first review if it has reviews
       if (section.reviews) {
         console.log(JSON.stringify(section.reviews[0], null, 2));
         reviewCount += section.reviews.length;
       } else if (section.reviewCard) {
         console.log(JSON.stringify(section.reviewCard, null, 2).substring(0, 1000));
         reviewCount++;
       } else {
         console.log(Object.keys(section));
       }
    } else if (section.items) {
       // Maybe a list of items?
       const reviews = section.items.filter(i => i.__typename === "AppPresentation_ReviewCard");
       if (reviews.length > 0) {
         console.log("Found items with ReviewCard");
         reviewCount += reviews.length;
         console.log(JSON.stringify(reviews[0], null, 2).substring(0, 1500));
       }
    }
  }
  console.log("Total reviews found:", reviewCount);
}

run().catch(e => { console.error("Fatal:", e); process.exit(1); });
