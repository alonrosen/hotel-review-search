import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession, requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    // Always fetch fresh status from DB
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      }
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { email, password } = body;

    const dataToUpdate: any = {};

    if (password) {
      if (password.length < 5) {
        return NextResponse.json({ error: 'Password must be at least 5 characters' }, { status: 400 });
      }
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    if (session.role === 'admin' && email) {
      // Check if email already in use by someone else
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== session.userId) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      dataToUpdate.email = email;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
