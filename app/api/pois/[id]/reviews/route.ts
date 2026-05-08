import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

type ReviewBody = {
  rating?: number;
  content?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing POI ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as ReviewBody;
    const rating = Number(body.rating);
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5.' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Review content is required.' },
        { status: 400 }
      );
    }

    const poi = await prisma.pOI.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!poi) {
      return NextResponse.json({ error: 'POI not found' }, { status: 404 });
    }

    const review = await prisma.pOIReview.create({
      data: {
        poiId: id,
        userId: user.id,
        rating,
        content
      },
      include: {
        user: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            avatarSeed: true,
            avatarOptions: true
          }
        }
      }
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Failed to create review', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
