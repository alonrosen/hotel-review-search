import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    const { action, adminNote } = await req.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const request = await prisma.hotelRequest.findUnique({ where: { id } });
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    const updatedRequest = await prisma.hotelRequest.update({
      where: { id },
      data: { status, adminNote },
    });

    // In a full implementation, approving might automatically call the hotel creation logic.
    // For now, it just updates the status, and the admin can manually add the hotel.

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Update hotel request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
