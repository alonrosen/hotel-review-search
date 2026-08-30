import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;

    const history = await prisma.searchLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 searches
      include: {
        // Not all search logs have a hotelId, some might be text queries
      }
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('List search history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
