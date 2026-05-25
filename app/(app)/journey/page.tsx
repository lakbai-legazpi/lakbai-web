import { redirect } from 'next/navigation';
import JourneyList from './_components/journey-list';
import type { JourneyCardJourney } from './_components/journey-card';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { pickJourneyCoverImage } from '@/lib/journey-utils';

export default async function JourneyPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const journeys = user ? await prisma.journey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      destination: true,
      startDate: true,
      endDate: true,
      isFlexibleDates: true,
      flexibleDays: true,
      flexibleMonths: true,
      createdAt: true,
      itineraryItems: {
        select: {
          poi: {
            select: {
              galleries: {
                select: {
                  imageUrl: true
                }
              }
            }
          }
        }
      }
    }
  }) : [];

  const initialJourneys: JourneyCardJourney[] = journeys.map(journey => ({
    id: journey.id,
    title: journey.title,
    destination: journey.destination,
    startDate: journey.startDate,
    endDate: journey.endDate,
    isFlexibleDates: journey.isFlexibleDates,
    flexibleDays: journey.flexibleDays,
    flexibleMonths: journey.flexibleMonths,
    createdAt: journey.createdAt,
    coverImageUrl: pickJourneyCoverImage(journey.itineraryItems)
  }));

  return (
    <div className='bg-surface flex h-full w-full'>
      <JourneyList initialJourneys={initialJourneys} />
    </div>
  );
}
