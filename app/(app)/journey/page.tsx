import { redirect } from 'next/navigation';
import JourneyList from './_components/journey-list';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

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
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className='bg-surface flex h-full w-full'>
      <JourneyList initialJourneys={journeys} />
    </div>
  );
}
