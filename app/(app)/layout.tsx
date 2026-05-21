import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Sidebar } from './_components/Sidebar';
import GlobalChatbarWrapper from './_components/GlobalChatbarWrapper';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { pickJourneyCoverImage } from '@/lib/journey-utils';

export const metadata: Metadata = {
  title: 'Lakbai App',
  description: 'AI-powered travel planning and navigation'
};

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Secondary session guard (middleware is primary)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const chats = await prisma.chat.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  });

  const rawJourneys = await prisma.journey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
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

  const journeys = rawJourneys.map(journey => ({
    ...journey,
    coverImageUrl: pickJourneyCoverImage(journey.itineraryItems)
  }));

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { firstName: true, lastName: true, username: true, avatarSeed: true, avatarOptions: true }
  });

  return (
    <div className='flex h-screen w-full flex-row'>
      <Sidebar userProfile={dbUser} />
      <div className='flex-1 overflow-hidden relative'>
        <GlobalChatbarWrapper initialChats={chats} initialJourneys={journeys}>
          {children}
        </GlobalChatbarWrapper>
      </div>
    </div>
  );
}
