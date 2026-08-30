require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting data backup...');
  
  const users = await prisma.user.findMany();
  console.log(`- Backed up ${users.length} users`);
  
  const hotels = await prisma.hotel.findMany();
  console.log(`- Backed up ${hotels.length} hotels`);
  
  const reviews = await prisma.review.findMany();
  console.log(`- Backed up ${reviews.length} reviews`);
  
  const favouriteHotels = await prisma.favouriteHotel.findMany();
  console.log(`- Backed up ${favouriteHotels.length} favourite hotels`);
  
  const searchLogs = await prisma.searchLog.findMany();
  console.log(`- Backed up ${searchLogs.length} search logs`);
  
  const hotelRequests = await prisma.hotelRequest.findMany();
  console.log(`- Backed up ${hotelRequests.length} hotel requests`);
  
  const settings = await prisma.setting.findMany();
  console.log(`- Backed up ${settings.length} settings`);
  
  const logs = await prisma.log.findMany();
  console.log(`- Backed up ${logs.length} logs`);

  const data = {
    users,
    hotels,
    reviews,
    favouriteHotels,
    searchLogs,
    hotelRequests,
    settings,
    logs
  };

  fs.writeFileSync('db-backup.json', JSON.stringify(data, null, 2));
  console.log('Successfully wrote data to db-backup.json');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
