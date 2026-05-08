import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import ChatClientLayout from '../client-layout';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const initialChats = await prisma.chat.findMany({
    where: { journey: { userId: user.id } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const initialJourneys = await prisma.journey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center">Loading...</div>}>
      <ChatClientLayout initialChats={initialChats} initialJourneys={initialJourneys} />
    </Suspense>
  );
}
