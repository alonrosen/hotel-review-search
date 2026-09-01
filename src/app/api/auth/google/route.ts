import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import prisma from '@/lib/db';
import { createSession } from '@/lib/auth';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
    }

    const { email, name, sub: googleId } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: name || 'Google User',
          email,
          provider: 'google',
          providerId: googleId,
          status: 'active',
          emailVerified: true,
        },
      });
    } else {
      // If user exists but used local login before, we can optionally link it.
      // For now, we'll just log them in and update their provider if it was local.
      if (!user.providerId) {
        user = await prisma.user.update({
          where: { email },
          data: {
            provider: 'google',
            providerId: googleId,
            emailVerified: true,
            status: user.status === 'pending' ? 'active' : user.status,
          }
        });
      }
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account is pending approval' }, { status: 403 });
    }

    await createSession({
      userId: user.id,
      role: user.role,
      status: user.status,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
