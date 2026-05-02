import { redirect } from 'next/navigation';
import JourneyList from './_components/journey-list';
import type { JourneyCardJourney } from './_components/journey-card';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

function pickJourneyCoverImage(
  itineraryItems: {
    poi: {
      galleries: {
        imageUrl: string;
      }[];
    };
  }[]
) {
  const imageUrls = Array.from(
    new Set(
      itineraryItems.flatMap(item =>
        item.poi.galleries
          .map(gallery => gallery.imageUrl.trim())
          .filter(Boolean)
      )
    )
  );

  if (imageUrls.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * imageUrls.length);

  return imageUrls[randomIndex] ?? null;
}

export default async function JourneyPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const journeys = await prisma.journey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      destination: true,
      startDate: true,
      endDate: true,
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
  });

  const initialJourneys: JourneyCardJourney[] = journeys.map(journey => ({
    id: journey.id,
    title: journey.title,
    destination: journey.destination,
    startDate: journey.startDate,
    endDate: journey.endDate,
    createdAt: journey.createdAt,
    coverImageUrl: pickJourneyCoverImage(journey.itineraryItems)
  }));

  return (
    <div className='bg-surface flex h-full w-full'>
      <JourneyList initialJourneys={initialJourneys} />
    </div>
  );
}
