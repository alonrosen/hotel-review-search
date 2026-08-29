const dotenv = require("dotenv");
dotenv.config();

// Manually fetch and run fetchTripAdvisorReviewsRapid logic
async function run() {
  const TA_API_HOST = "tripadvisor-com1.p.rapidapi.com";
  const url = `https://${TA_API_HOST}/hotels/reviews?contentId=11854022`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": TA_API_HOST,
    },
  });

  const data = await res.json();
  const reviews = [];
  
  if (data?.data?.sections) {
    for (const section of data.data.sections) {
      if (section.__typename === "AppPresentation_UserReviewSection") {
        reviews.push({
          id: section.helpfulVote?.helpfulVoteAction?.objectId || Math.random().toString(36).substring(7),
          title: section.htmlTitle?.htmlString || "",
          text: section.htmlText?.htmlString || "",
          rating: section.bubbleRating?.rating || 0,
          author: {
            username: section.author?.username || section.userProfile?.displayName || "Anonymous"
          },
          publishedDate: section.publishedDate?.string || "",
          url: section.reviewActions?.[0]?.action?.route?.url || ""
        });
      }
    }
  }
  
  console.log(`Fetched ${reviews.length} reviews.`);
  if (reviews.length > 0) {
    console.log(JSON.stringify(reviews[0], null, 2));
  }
}

run();
