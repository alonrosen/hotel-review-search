const dotenv = require("dotenv");
dotenv.config();

async function run() {
  // Search with an explicit early date to bypass the as-of date auto-filter
  const res = await fetch("http://localhost:3000/api/reviews/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "room",
      hotelId: "cmtcpghn0000hlcwsstk7wdg1",
      asOfDate: "2020-01-01",
    }),
  });
  const data = await res.json();
  console.log("Total results:", data.totalCount);
  console.log("As-of date used:", data.asOfDate);

  for (let i = 0; i < Math.min(5, (data.results || []).length); i++) {
    const r = data.results[i];
    console.log(`\n#${i+1}: ${r.review.authorName} (${r.review.rating}★)`);
    console.log(`  Date:   ${r.review.reviewDate}`);
    console.log(`  Link:   ${r.review.reviewLink ? "✅ " + r.review.reviewLink.substring(0, 100) : "❌ MISSING"}`);
    console.log(`  Source: ${r.review.source}`);
  }
}

run().catch(console.error);
