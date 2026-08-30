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
  console.log('Starting data restoration...');
  
  if (!fs.existsSync('db-backup.json')) {
    throw new Error('db-backup.json not found!');
  }

  const raw = fs.readFileSync('db-backup.json', 'utf8');
  const data = JSON.parse(raw);

  // Users
  if (data.users && data.users.length > 0) {
    console.log(`Restoring ${data.users.length} users...`);
    await prisma.user.createMany({ data: data.users, skipDuplicates: true });
  }

  // Hotels
  if (data.hotels && data.hotels.length > 0) {
    console.log(`Restoring ${data.hotels.length} hotels...`);
    await prisma.hotel.createMany({ data: data.hotels, skipDuplicates: true });
  }

  // Reviews
  if (data.reviews && data.reviews.length > 0) {
    console.log(`Restoring ${data.reviews.length} reviews...`);
    await prisma.review.createMany({ data: data.reviews, skipDuplicates: true });
  }

  // FavouriteHotels
  if (data.favouriteHotels && data.favouriteHotels.length > 0) {
    console.log(`Restoring ${data.favouriteHotels.length} favourite hotels...`);
    await prisma.favouriteHotel.createMany({ data: data.favouriteHotels, skipDuplicates: true });
  }

  // SearchLogs
  if (data.searchLogs && data.searchLogs.length > 0) {
    const validHotelIds = new Set(data.hotels.map(h => h.id));
    const cleanedSearchLogs = data.searchLogs.map(log => {
      if (log.hotelId && !validHotelIds.has(log.hotelId)) {
        log.hotelId = null;
      }
      return log;
    });
    console.log(`Restoring ${cleanedSearchLogs.length} search logs...`);
    await prisma.searchLog.createMany({ data: cleanedSearchLogs, skipDuplicates: true });
  }

  // HotelRequests
  if (data.hotelRequests && data.hotelRequests.length > 0) {
    console.log(`Restoring ${data.hotelRequests.length} hotel requests...`);
    await prisma.hotelRequest.createMany({ data: data.hotelRequests, skipDuplicates: true });
  }

  // Settings
  if (data.settings && data.settings.length > 0) {
    console.log(`Restoring ${data.settings.length} settings...`);
    await prisma.setting.createMany({ data: data.settings, skipDuplicates: true });
  }

  // Logs
  if (data.logs && data.logs.length > 0) {
    console.log(`Restoring ${data.logs.length} logs...`);
    await prisma.log.createMany({ data: data.logs, skipDuplicates: true });
  }

  console.log('Restoration complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
