import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, generateVerifyCode } from '@/lib/auth';
import { sendVerificationEmail, sendAdminNewUserNotification } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const { code, expiresAt } = generateVerifyCode();

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        status: 'pending',
        emailVerified: false,
        verifyCode: code,
        verifyCodeExp: expiresAt,
      },
    });

    // Send verification email
    await sendVerificationEmail(email, code);

    // Notify admin
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (adminUser) {
      await sendAdminNewUserNotification(adminUser.email, name, email);
    }

    return NextResponse.json({ success: true, message: 'Check your email for the verification code' });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
