import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    return NextResponse.json({ available: !existingUser });
  } catch (error) {
    console.error('check-email error', error);
    return NextResponse.json(
      { error: 'Failed to validate email.' },
      { status: 500 }
    );
  }
}
