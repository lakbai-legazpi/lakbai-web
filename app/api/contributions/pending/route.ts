import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// GET /api/contributions/pending — admin: fetch all PENDING contributions
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (dbUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const contributions = await prisma.contribution.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' }, // oldest first for fair review
      include: {
        user: { select: { id: true, name: true, email: true } },
        poi:  { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ contributions });
  } catch (error) {
    console.error('Failed to fetch pending contributions', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending contributions' },
      { status: 500 }
    );
  }
}
