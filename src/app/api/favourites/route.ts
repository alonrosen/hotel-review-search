import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireAuth();
    
    const favourites = await prisma.favouriteHotel.findMany({
      where: { userId: session.userId },
      select: { hotelId: true },
    });

    const hotelIds = favourites.map(f => f.hotelId);
    return NextResponse.json({ favourites: hotelIds });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('List favourites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    
    // Only active users can manage favourites
    if (session.status !== 'active') {
        return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }

    const { hotelId } = await req.json();

    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    // Toggle favourite
    const existing = await prisma.favouriteHotel.findUnique({
      where: { userId_hotelId: { userId: session.userId, hotelId } },
    });

    if (existing) {
      await prisma.favouriteHotel.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      await prisma.favouriteHotel.create({
        data: { userId: session.userId, hotelId },
      });
      return NextResponse.json({ success: true, action: 'added' });
    }

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Toggle favourite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
