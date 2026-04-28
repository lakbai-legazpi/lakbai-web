import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string, dayId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: journeyId, dayId } = await params;
    const body = await request.json();
    const { title } = body;

    const journey = await prisma.journey.findUnique({ where: { id: journeyId } });
    if (!journey || journey.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedDay = await prisma.journeyDay.update({
      where: { id: dayId },
      data: { title }
    });

    return NextResponse.json({ success: true, day: updatedDay });
  } catch (error) {
    console.error('Failed to update day', error);
    return NextResponse.json({ error: 'Failed to update day' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, dayId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: journeyId, dayId } = await params;

    const journey = await prisma.journey.findUnique({ where: { id: journeyId } });
    if (!journey || journey.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dayToDelete = await prisma.journeyDay.findUnique({ where: { id: dayId } });
    if (!dayToDelete) return NextResponse.json({ error: 'Day not found' }, { status: 404 });

    const deletedDayNumber = dayToDelete.dayNumber;

    // 1. Move all items from this day to Basecamp (null)
    await prisma.itineraryItem.updateMany({
      where: { journeyId, dayNumber: deletedDayNumber },
      data: { dayNumber: null, startTime: null, endTime: null }
    });

    // 2. Delete the day
    await prisma.journeyDay.delete({ where: { id: dayId } });

    // 3. Shift all days > deletedDayNumber by -1
    await prisma.journeyDay.updateMany({
      where: { journeyId, dayNumber: { gt: deletedDayNumber } },
      data: { dayNumber: { decrement: 1 } }
    });

    // 4. Shift itinerary items as well
    await prisma.itineraryItem.updateMany({
      where: { journeyId, dayNumber: { gt: deletedDayNumber } },
      data: { dayNumber: { decrement: 1 } }
    });

    // 5. Update total days if flexible
    if (journey.isFlexibleDates && journey.flexibleDays !== null && journey.flexibleDays > 1) {
      await prisma.journey.update({
        where: { id: journeyId },
        data: { flexibleDays: journey.flexibleDays - 1 }
      });
    } else if (!journey.isFlexibleDates && journey.endDate && journey.startDate) {
      const newEndDate = new Date(journey.endDate);
      newEndDate.setDate(newEndDate.getDate() - 1);
      // Ensure end date doesn't go before start date
      if (newEndDate >= new Date(journey.startDate)) {
        await prisma.journey.update({
          where: { id: journeyId },
          data: { endDate: newEndDate }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete day', error);
    return NextResponse.json({ error: 'Failed to delete day' }, { status: 500 });
  }
}
