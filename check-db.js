const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const hotels = await prisma.hotel.findMany();
  console.log("Hotels in DB:");
  for (const h of hotels) {
    console.log(`- ${h.name}: googlePlaceId=${h.googlePlaceId}`);
  }
}
run();
