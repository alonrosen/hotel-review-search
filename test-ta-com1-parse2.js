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

// Function to recursively find arrays that contain objects with __typename === "AppPresentation_ReviewCard" or something similar
function findReviews(obj, results = []) {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && typeof item === "object") {
        if (item.__typename && item.__typename.includes("Review")) {
          results.push(item);
        } else {
          findReviews(item, results);
        }
      }
    }
  } else if (obj && typeof obj === "object") {
    if (obj.__typename && obj.__typename.includes("Review")) {
      results.push(obj);
    }
    for (const key in obj) {
      if (typeof obj[key] === "object") {
        findReviews(obj[key], results);
      }
    }
  }
  return results;
}

async function run() {
  const data = await rapidFetch("/hotels/reviews?contentId=11854022");
  
  if (!data?.data?.sections) {
    console.log("No data.sections found");
    return;
  }
  
  const reviews = findReviews(data.data.sections);
  console.log("Found matching Review objects:", reviews.length);
  if (reviews.length > 0) {
     const types = [...new Set(reviews.map(r => r.__typename))];
     console.log("Typenames:", types);
     
     // Dump one of each type
     for (const type of types) {
        console.log(`\nExample of ${type}:`);
        const ex = reviews.find(r => r.__typename === type);
        console.log(JSON.stringify(ex, null, 2).substring(0, 500));
     }
  }
}

run().catch(e => { console.error("Fatal:", e); process.exit(1); });
