import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

type UpdateJourneyBody = {
  title?: string;
  startDate?: string | null;
  endDate?: string | null;
  isFlexibleDates?: boolean;
  companions?: string | null;
  budget?: number | null;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateJourneyBody;

    if (!id?.trim()) {
      return NextResponse.json({ error: 'Missing journeyId.' }, { status: 400 });
    }

    // Verify journey belongs to user
    const existingJourney = await prisma.journey.findUnique({
      where: { id }
    });

    if (!existingJourney) {
      return NextResponse.json({ error: 'Journey not found.' }, { status: 404 });
    }

    if (existingJourney.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data: {
      title?: string;
      startDate?: Date | null;
      endDate?: Date | null;
      isFlexibleDates?: boolean;
      flexibleDays?: number | null;
      flexibleMonths?: string | null;
      companions?: string | null;
      budget?: number | null;
    } = {};

    if ('title' in body && body.title?.trim()) data.title = body.title.trim();
    if ('startDate' in body) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if ('endDate' in body) data.endDate = body.endDate ? new Date(body.endDate) : null;
    if ('isFlexibleDates' in body) data.isFlexibleDates = body.isFlexibleDates;
    if ('flexibleDays' in body) data.flexibleDays = (body as any).flexibleDays;
    if ('flexibleMonths' in body) {
      const fm = (body as any).flexibleMonths;
      data.flexibleMonths = Array.isArray(fm) ? JSON.stringify(fm) : fm;
    }
    if ('companions' in body) data.companions = body.companions ?? null;
    if ('budget' in body) data.budget = body.budget ?? null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'At least one updatable field is required.' }, { status: 400 });
    }

    // Determine target number of days
    let targetNumDays = 0;
    const isFlex = data.isFlexibleDates ?? existingJourney.isFlexibleDates;
    if (isFlex) {
      targetNumDays = data.flexibleDays ?? existingJourney.flexibleDays ?? 5;
    } else {
      const start = data.startDate !== undefined ? data.startDate : existingJourney.startDate;
      const end = data.endDate !== undefined ? data.endDate : existingJourney.endDate;
      if (start && end) {
        targetNumDays = Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1);
      }
    }

    let returnedItemsCount = 0;

    if (targetNumDays > 0) {
      // Find current days
      const currentDays = await prisma.journeyDay.findMany({ where: { journeyId: id } });
      const currentNumDays = currentDays.length;

      if (targetNumDays < currentNumDays) {
        // Shrinking
        const daysToDelete = await prisma.journeyDay.findMany({
          where: { journeyId: id, dayNumber: { gt: targetNumDays } }
        });
        
        if (daysToDelete.length > 0) {
          const updateRes = await prisma.itineraryItem.updateMany({
            where: { journeyId: id, dayNumber: { gt: targetNumDays } },
            data: { dayNumber: null, startTime: null, endTime: null }
          });
          returnedItemsCount = updateRes.count;

          await prisma.journeyDay.deleteMany({
            where: { journeyId: id, dayNumber: { gt: targetNumDays } }
          });
        }
      } else if (targetNumDays > currentNumDays) {
        // Expanding
        const newDays = targetNumDays - currentNumDays;
        await Promise.all(
          Array.from({ length: newDays }).map((_, i) =>
            prisma.journeyDay.create({
              data: {
                journeyId: id,
                dayNumber: currentNumDays + i + 1,
                title: `Day ${currentNumDays + i + 1}`
              }
            })
          )
        );
      }
    }

    const updatedJourney = await prisma.journey.update({
      where: { id },
      data,
      include: {
        days: { orderBy: { dayNumber: 'asc' } },
        itineraryItems: {
          include: {
            poi: {
              include: {
                tags: { include: { cluster: true } }
              }
            }
          },
          orderBy: [{ dayNumber: 'asc' }, { startTime: 'asc' }, { orderIndex: 'asc' }]
        }
      }
    });

    return NextResponse.json({ journey: updatedJourney, returnedItemsCount });
  } catch (error) {
    console.error('Failed to update journey', error);
    return NextResponse.json(
      { error: 'Failed to update journey.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id?.trim()) {
      return NextResponse.json({ error: 'Missing journeyId.' }, { status: 400 });
    }

    const existingJourney = await prisma.journey.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!existingJourney) {
      return NextResponse.json({ error: 'Journey not found.' }, { status: 404 });
    }

    if (existingJourney.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.journey.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete journey', error);
    return NextResponse.json(
      { error: 'Failed to delete journey.' },
      { status: 500 }
    );
  }
}
