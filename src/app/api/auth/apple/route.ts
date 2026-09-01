import { NextResponse } from 'next/server';
import appleSignin from 'apple-signin-auth';
import prisma from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // Apple sends the name object only on the very first login, so we accept it if available.
    const { token, name: appleName } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Verify Apple ID token
    const payload = await appleSignin.verifyIdToken(token, {
      audience: process.env.APPLE_CLIENT_ID, // Your Apple App ID / Service ID
      ignoreExpiration: true, 
    });

    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Apple token payload' }, { status: 400 });
    }

    const { email, sub: appleId } = payload;
    let name = 'Apple User';
    if (appleName && typeof appleName === 'object') {
      name = `${appleName.firstName || ''} ${appleName.lastName || ''}`.trim() || name;
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          provider: 'apple',
          providerId: appleId,
          status: 'active',
          emailVerified: true,
        },
      });
    } else {
      // If user exists but used local login before, link it.
      if (!user.providerId) {
        user = await prisma.user.update({
          where: { email },
          data: {
            provider: 'apple',
            providerId: appleId,
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
    console.error('Apple auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
