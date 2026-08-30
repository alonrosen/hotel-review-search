import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const secret = req.headers.get('x-admin-secret');
    if (secret !== process.env.ADMIN_SECRET) {
      await requireAuth(['admin']);
    }

    const users = await prisma.user.findMany();
    const hotels = await prisma.hotel.findMany();
    const reviews = await prisma.review.findMany();
    const favouriteHotels = await prisma.favouriteHotel.findMany();
    const searchLogs = await prisma.searchLog.findMany();
    const hotelRequests = await prisma.hotelRequest.findMany();
    const settings = await prisma.setting.findMany();
    const logs = await prisma.log.findMany();

    return NextResponse.json({
      users,
      hotels,
      reviews,
      favouriteHotels,
      searchLogs,
      hotelRequests,
      settings,
      logs
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Export DB error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
