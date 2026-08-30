import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: Request) {
  try {
    const session = await requireAuth(['admin']);
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== session.userId) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { email },
    });

    return NextResponse.json({ success: true, message: 'Email updated successfully' });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Update email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
