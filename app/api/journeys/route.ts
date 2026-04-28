import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const journeys = await prisma.journey.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        destination: true,
        startDate: true,
        endDate: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({ journeys });
  } catch (error) {
    console.error('Failed to fetch journeys', error);
    return NextResponse.json({ error: 'Failed to fetch journeys' }, { status: 500 });
  }
}
