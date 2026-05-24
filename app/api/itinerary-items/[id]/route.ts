import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type UpdateScheduleBody = {
  dayNumber?: number | null;
  orderIndex?: number;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
};

function isValidTimeFormat(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

// PATCH /api/itinerary-items/[id]
// Partial schedule updates for drag-drop/manual planning.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateScheduleBody;

    if (!id?.trim()) {
      return NextResponse.json({ error: 'Missing itineraryItemId.' }, { status: 400 });
    }

    const data: {
      dayNumber?: number | null;
      orderIndex?: number;
      startTime?: string | null;
      endTime?: string | null;
      notes?: string | null;
    } = {};

    if ('dayNumber' in body) {
      if (body.dayNumber !== null && body.dayNumber !== undefined && !Number.isInteger(body.dayNumber)) {
        return NextResponse.json(
          { error: 'dayNumber must be null or an integer.' },
          { status: 400 }
        );
      }
      data.dayNumber = body.dayNumber ?? null;
    }

    if ('orderIndex' in body) {
      if (body.orderIndex === undefined || !Number.isInteger(body.orderIndex)) {
        return NextResponse.json(
          { error: 'orderIndex must be an integer.' },
          { status: 400 }
        );
      }
      data.orderIndex = body.orderIndex;
    }

    if ('startTime' in body) {
      const value = body.startTime;
      if (value !== null && value !== undefined && !isValidTimeFormat(value)) {
        return NextResponse.json(
          { error: 'startTime must be null or HH:mm.' },
          { status: 400 }
        );
      }
      data.startTime = value ?? null;
    }

    if ('endTime' in body) {
      const value = body.endTime;
      if (value !== null && value !== undefined && !isValidTimeFormat(value)) {
        return NextResponse.json(
          { error: 'endTime must be null or HH:mm.' },
          { status: 400 }
        );
      }
      data.endTime = value ?? null;
    }

    if ('notes' in body) {
      data.notes = body.notes ?? null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'At least one updatable field is required.' },
        { status: 400 }
      );
    }

    const itineraryItem = await prisma.itineraryItem.update({
      where: { id },
      data,
      include: {
        poi: { include: { tags: true } },
      },
    });

    return NextResponse.json({ itineraryItem });
  } catch (error) {
    console.error('Failed to update itinerary item schedule', error);
    return NextResponse.json(
      { error: 'Failed to update itinerary item schedule.' },
      { status: 500 }
    );
  }
}

// DELETE /api/itinerary-items/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id?.trim()) {
      return NextResponse.json({ error: 'Missing itineraryItemId.' }, { status: 400 });
    }

    const existingItem = await prisma.itineraryItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Itinerary item not found.' }, { status: 404 });
    }

    await prisma.itineraryItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete itinerary item', error);
    return NextResponse.json(
      { error: 'Failed to delete itinerary item.' },
      { status: 500 }
    );
  }
}
