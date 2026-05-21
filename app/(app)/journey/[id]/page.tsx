import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { TextHeading, TextBody } from '@/components/text';
import { ChevronLeft, MessageCircle } from 'lucide-react';
import JourneyCalendar from '../_components/journey-calendar';
import EditableJourneyPills from '../_components/editable-journey-pills';
import ExportJourneyButton from '../_components/ExportJourneyButton';

export default async function JourneyDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const journey = await prisma.journey.findUnique({
    where: { id, userId: user.id },
    include: {
      chats: {
        orderBy: { createdAt: 'desc' }
      },
      itineraryItems: {
        include: {
          poi: {
            include: {
              address: true,
              operatingHours: true,
              links: true,
              tags: true
            }
          }
        }
      }
    }
  });

  if (!journey) {
    redirect('/journey');
  }


  return (
    <div className='bg-surface flex h-full w-full flex-col overflow-y-auto px-8 py-10 print:h-auto print:overflow-visible print:px-0 print:py-0'>
      <div className='mb-6 print:hidden'>
        <Link
          href='/journey'
          className='text-text-muted hover:text-text-main inline-flex items-center gap-2 text-sm font-medium transition-colors'
        >
          <ChevronLeft size={16} />
          Back to Journeys
        </Link>
      </div>

      <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <TextHeading className='text-[40px] leading-tight font-bold text-black'>
          {journey.title}
        </TextHeading>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <ExportJourneyButton journey={journey as any} />
      </div>

      <div className='mb-12 print:hidden'>
        <EditableJourneyPills journey={journey} />
      </div>

      <div className='flex flex-col gap-10 lg:flex-row print:flex-row print:w-full'>
        {/* Left Column */}
        <div className='flex-1 max-w-2xl print:hidden'>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <TextHeading className='text-[24px] font-bold text-black'>
                Chats
              </TextHeading>
              <TextBody className='text-text-muted text-sm font-medium'>
                {journey.chats.length}
              </TextBody>
            </div>
          </div>

          <div className='flex flex-col gap-3'>
            {journey.chats.length === 0 ? (
              <div className='text-text-muted text-sm'>
                No chats connected to this journey yet.
              </div>
            ) : (
              journey.chats.map(chat => (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className='border-border bg-background hover:bg-surface-light group flex items-center justify-between rounded-2xl border p-5 transition-all hover:shadow-md'
                >
                  <div className='flex items-center gap-4'>
                    <div className='bg-primary-50 text-primary-600 rounded-full p-3'>
                      <MessageCircle size={20} />
                    </div>
                    <div>
                      <TextBody className='text-text-main text-[16px] font-semibold'>
                        {chat.title}
                      </TextBody>
                      <TextBody className='text-text-muted mt-0.5 text-[13px]'>
                        {new Date(chat.createdAt).toLocaleDateString()}
                      </TextBody>
                    </div>
                  </div>
                  <ChevronLeft
                    size={20}
                    className='text-text-muted rotate-180 transition-transform group-hover:translate-x-1 group-hover:text-black'
                  />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className='w-full lg:w-[400px] xl:w-[450px] shrink-0 print:w-full print:max-w-none'>
          <JourneyCalendar 
            startDate={journey.startDate} 
            endDate={journey.endDate} 
            isFlexible={journey.isFlexibleDates}
            flexibleDays={journey.flexibleDays}
            flexibleMonths={journey.flexibleMonths ? JSON.parse(journey.flexibleMonths) : []}
            itineraryItems={journey.itineraryItems}
          />
        </div>
      </div>
    </div>
  );
}
