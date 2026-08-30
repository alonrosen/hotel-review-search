import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth(['admin']);
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        searchLogs: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { hotel: { select: { name: true } } }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAuth(['admin']);
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Don't allow admin to delete themselves (simplistic check)
    const userToDelete = await prisma.user.findUnique({ where: { id: userId } });
    if (userToDelete?.role === 'admin') {
      const allAdmins = await prisma.user.count({ where: { role: 'admin' } });
      if (allAdmins <= 1) {
         return NextResponse.json({ error: 'Cannot delete the only admin' }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
