'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgePlus, Luggage } from 'lucide-react';
import { TextHeading, TextBody } from '@/components/text';
import JourneyCard from '../journey-card';
import NewJourneyModal from '../../../_components/NewJourneyModal';

export default function JourneyList({
  initialJourneys
}: {
  initialJourneys: any[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalSubmit = async (newJourneyData: any) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isNewContext: true,
          newJourneyData
        })
      });
      const data = await res.json();
      if (data.chat) {
        setIsModalOpen(false);
        router.push(`/chat/${data.chat.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!initialJourneys || initialJourneys.length === 0) {
    return (
      <div className='flex h-full w-full flex-col bg-white'>
        {/* Header */}
        <div className='relative z-10 flex items-center justify-between px-8 py-10'>
          <TextHeading className='text-[36px] font-bold text-black'>
            My Journeys
          </TextHeading>

          <button
            onClick={() => setIsModalOpen(true)}
            className='flex items-center gap-2 rounded-full bg-[#008A90] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90'
          >
            <BadgePlus size={18} />
            New Journey
          </button>
        </div>

        {/* Empty State (Centered) */}
        <div className='-mt-20 flex flex-1 items-center justify-center'>
          <div className='flex flex-col items-center text-center'>
            {/* Gradient Icon */}
            <div className='mb-6 flex h-[100px] w-[100px] items-center justify-center rounded-full bg-gradient-to-b from-[#1F677A] to-[#C9F0F4]'>
              <Luggage size={40} strokeWidth={1} className='text-white' />
            </div>

            {/* Title */}
            <TextHeading className='mb-3 text-[20px] font-bold text-black'>
              No journeys yet
            </TextHeading>

            {/* Description */}
            <TextBody className='mb-8 max-w-[340px] text-[16px] leading-relaxed font-normal text-black'>
              Start planning your next journey! Map out your adventure now and
              we'll keep it safe here.
            </TextBody>

            <button
              onClick={() => setIsModalOpen(true)}
              className='rounded-[24px] bg-[#00A1A7] px-8 py-3 text-[15px] font-medium text-white shadow-sm transition-opacity hover:opacity-90'
            >
              Create a Journey
            </button>
          </div>
        </div>

        <NewJourneyModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleModalSubmit}
        />
      </div>
    );
  }

  return (
    <div className='flex h-full w-full flex-col bg-white px-8 py-10'>
      {/* Header */}
      <div className='mb-10 flex items-center justify-between'>
        <TextHeading className='text-[36px] font-bold text-black'>
          My Journeys
        </TextHeading>

        <button
          onClick={() => setIsModalOpen(true)}
          className='flex items-center gap-2 rounded-full bg-[#008A90] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90'
        >
          <BadgePlus size={18} />
          New Journey
        </button>
      </div>

      {/* Grid */}
      <div className='flex flex-wrap gap-6'>
        {initialJourneys.map(journey => (
          <JourneyCard key={journey.id} journey={journey} />
        ))}
      </div>

      <NewJourneyModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
