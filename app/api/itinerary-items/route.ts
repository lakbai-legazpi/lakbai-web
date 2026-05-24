import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type CreateBasecampItemBody = {
  journeyId?: string;
  poiId?: string;
};

// POST /api/itinerary-items
// Creates an itinerary item in Basecamp (dayNumber = null).
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBasecampItemBody;
    const journeyId = body.journeyId?.trim();
    const poiId = body.poiId?.trim();

    if (!journeyId || !poiId) {
      return NextResponse.json(
        { error: 'journeyId and poiId are required.' },
        { status: 400 }
      );
    }

    const [journey, poi] = await Promise.all([
      prisma.journey.findUnique({ where: { id: journeyId }, select: { id: true } }),
      prisma.pOI.findUnique({ where: { id: poiId }, select: { id: true } }),
    ]);

    if (!journey) {
      return NextResponse.json({ error: 'Journey not found.' }, { status: 404 });
    }

    if (!poi) {
      return NextResponse.json({ error: 'POI not found.' }, { status: 404 });
    }

    const highestIndexInBasecamp = await prisma.itineraryItem.findFirst({
      where: { journeyId, dayNumber: null },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });

    const itineraryItem = await prisma.itineraryItem.create({
      data: {
        journeyId,
        poiId,
        dayNumber: null,
        orderIndex: (highestIndexInBasecamp?.orderIndex ?? -1) + 1,
      },
      include: {
        poi: { include: { tags: true } },
      },
    });

    return NextResponse.json({ itineraryItem }, { status: 201 });
  } catch (error) {
    console.error('Failed to add POI to basecamp', error);
    return NextResponse.json(
      { error: 'Failed to add POI to basecamp.' },
      { status: 500 }
    );
  }
}
