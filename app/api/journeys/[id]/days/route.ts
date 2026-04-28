import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: journeyId } = await params;
    const body = await request.json();
    const { action, dayNumber } = body; // action: 'add-before', 'add-after', 'add-end'

    const existingJourney = await prisma.journey.findUnique({
      where: { id: journeyId },
      include: { days: true }
    });

    if (!existingJourney || existingJourney.userId !== user.id) {
      return NextResponse.json({ error: 'Journey not found or forbidden' }, { status: 404 });
    }

    let newDayNumber = dayNumber;

    if (action === 'add-before') {
      newDayNumber = dayNumber;
      // Shift all days >= dayNumber by +1
      await prisma.journeyDay.updateMany({
        where: { journeyId, dayNumber: { gte: dayNumber } },
        data: { dayNumber: { increment: 1 } }
      });
      // Shift itinerary items as well
      await prisma.itineraryItem.updateMany({
        where: { journeyId, dayNumber: { gte: dayNumber } },
        data: { dayNumber: { increment: 1 } }
      });
    } else if (action === 'add-after') {
      newDayNumber = dayNumber + 1;
      // Shift all days > dayNumber by +1
      await prisma.journeyDay.updateMany({
        where: { journeyId, dayNumber: { gt: dayNumber } },
        data: { dayNumber: { increment: 1 } }
      });
      // Shift itinerary items as well
      await prisma.itineraryItem.updateMany({
        where: { journeyId, dayNumber: { gt: dayNumber } },
        data: { dayNumber: { increment: 1 } }
      });
    } else {
      // add-end
      const maxDay = existingJourney.days.length > 0 
        ? Math.max(...existingJourney.days.map(d => d.dayNumber)) 
        : 0;
      newDayNumber = maxDay + 1;
    }

    const newDay = await prisma.journeyDay.create({
      data: {
        journeyId,
        dayNumber: newDayNumber,
        title: `Day ${newDayNumber}`
      }
    });

    // Update total days if it's flexible
    if (existingJourney.isFlexibleDates && existingJourney.flexibleDays !== null) {
      await prisma.journey.update({
        where: { id: journeyId },
        data: { flexibleDays: existingJourney.flexibleDays + 1 }
      });
    } else if (!existingJourney.isFlexibleDates && existingJourney.endDate) {
      const newEndDate = new Date(existingJourney.endDate);
      newEndDate.setDate(newEndDate.getDate() + 1);
      await prisma.journey.update({
        where: { id: journeyId },
        data: { endDate: newEndDate }
      });
    }

    return NextResponse.json({ success: true, day: newDay });
  } catch (error) {
    console.error('Failed to add day', error);
    return NextResponse.json({ error: 'Failed to add day' }, { status: 500 });
  }
}
