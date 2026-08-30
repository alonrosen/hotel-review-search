import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { sendAdminHotelRequestNotification } from '@/lib/email';

export async function GET() {
  try {
    const session = await requireAuth();
    
    let requests;
    if (session.role === 'admin') {
      requests = await prisma.hotelRequest.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      requests = await prisma.hotelRequest.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ requests });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('List hotel requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    
    // Only active users can request hotels
    if (session.status !== 'active') {
        return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }

    const { name, city, state, country } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Hotel name is required' }, { status: 400 });
    }

    const request = await prisma.hotelRequest.create({
      data: {
        userId: session.userId,
        name,
        city,
        state,
        country,
        status: 'pending',
      },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    // Notify admin
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (adminUser) {
      await sendAdminHotelRequestNotification(adminUser.email, {
        name,
        city,
        user: request.user.name,
      });
    }

    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create hotel request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
