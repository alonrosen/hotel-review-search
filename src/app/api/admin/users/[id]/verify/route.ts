import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(['admin']);
    const { id } = await params;
    
    const { emailVerified } = await req.json();

    if (typeof emailVerified !== 'boolean') {
      return NextResponse.json({ error: 'emailVerified boolean is required' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { emailVerified },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Update user verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
