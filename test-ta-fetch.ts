const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { fetchTripAdvisorReviewsRapid } = require('./src/lib/rapidapi');
const dotenv = require("dotenv");
dotenv.config();

async function run() {
  console.log("Fetching TA reviews for contentId 11854022...");
  const reviews = await fetchTripAdvisorReviewsRapid("11854022", 1);
  console.log(`Fetched ${reviews.length} reviews.`);
  if (reviews.length > 0) {
    console.log(JSON.stringify(reviews[0], null, 2));
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
