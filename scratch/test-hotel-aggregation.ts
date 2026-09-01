import prisma from '../src/lib/db';

async function main() {
  console.time('fetch hotels');
  const hotels = await prisma.hotel.findMany({
    orderBy: { name: 'asc' },
  });
  console.timeEnd('fetch hotels');

  console.time('fetch stats');
  const reviewStats = await prisma.review.groupBy({
    by: ['hotelId', 'source'],
    _count: { _all: true },
    _max: { reviewDate: true, fetchedAt: true },
  });
  console.timeEnd('fetch stats');

  console.time('merge');
  const formattedHotels = hotels.map(hotel => {
    const hotelStats = reviewStats.filter(s => s.hotelId === hotel.id);
    
    const googleStats = hotelStats.find(s => s.source === 'google');
    const taStats = hotelStats.find(s => s.source === 'tripadvisor');

    const maxFetchG = googleStats?._max.fetchedAt?.getTime() || 0;
    const maxFetchT = taStats?._max.fetchedAt?.getTime() || 0;
    const latestFetchDate = maxFetchG > maxFetchT 
        ? googleStats?._max.fetchedAt 
        : (maxFetchT > 0 ? taStats?._max.fetchedAt : null);

    return {
      id: hotel.id,
      name: hotel.name,
      stats: {
        googleCount: googleStats?._count._all || 0,
        tripadvisorCount: taStats?._count._all || 0,
        latestGoogleReview: googleStats?._max.reviewDate || null,
        latestTripAdvisorReview: taStats?._max.reviewDate || null,
        latestFetchDate,
      }
    };
  });
  console.timeEnd('merge');

  console.log('Sample:', formattedHotels[0]);
}

main().catch(console.error).finally(() => prisma.$disconnect());
