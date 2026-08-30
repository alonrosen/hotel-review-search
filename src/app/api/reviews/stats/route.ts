/* GET /api/reviews/stats — review counts and last fetch dates per hotel */

import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const hotels = await prisma.hotel.findMany({
    orderBy: { name: "asc" },
    include: {
      reviews: {
        select: {
          source: true,
          fetchedAt: true,
        },
      },
    },
  });

  const stats = hotels.map((hotel) => {
    const googleReviews = hotel.reviews.filter((r) => r.source === "google");
    const taReviews = hotel.reviews.filter((r) => r.source === "tripadvisor");

    return {
      hotelId: hotel.id,
      hotelName: hotel.name,
      googleCount: googleReviews.length,
      tripadvisorCount: taReviews.length,
      lastGoogleFetch:
        googleReviews.length > 0
          ? googleReviews.reduce(
              (latest, r) => (r.fetchedAt > latest ? r.fetchedAt : latest),
              googleReviews[0].fetchedAt
            )
          : null,
      lastTripadvisorFetch:
        taReviews.length > 0
          ? taReviews.reduce(
              (latest, r) => (r.fetchedAt > latest ? r.fetchedAt : latest),
              taReviews[0].fetchedAt
            )
          : null,
    };
  });

  return Response.json(stats);
}
