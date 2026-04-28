'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Luggage, Plus } from 'lucide-react';
import { TextHeading, TextBody } from '@/components/text';

type SelectJourneyModalProps = {
  open: boolean;
  onClose: () => void;
  poiId: string;
};

type JourneySummary = {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
};

export default function SelectJourneyModal({ open, onClose, poiId }: SelectJourneyModalProps) {
  const [journeys, setJourneys] = useState<JourneySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    
    async function fetchJourneys() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/journeys');
        if (res.ok) {
          const data = await res.json();
          setJourneys(data.journeys || []);
        }
      } catch (err) {
        console.error('Failed to fetch journeys', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJourneys();
  }, [open]);

  const handleSelectJourney = async (journeyId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/itinerary-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journeyId, poiId })
      });
      if (res.ok) {
        onClose();
        window.dispatchEvent(new CustomEvent('journey-updated'));
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to add to journey', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateJourney = () => {
    router.push('/chat');
    onClose();
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md'>
      <div className='bg-background w-full max-w-md overflow-hidden rounded-[24px] shadow-2xl flex flex-col max-h-[80vh] m-4'>
        <div className='flex items-center justify-between border-b border-border px-6 py-4'>
          <TextHeading className='text-xl font-bold'>Add to Journey</TextHeading>
          <button
            onClick={onClose}
            className='text-text-muted hover:text-foreground transition-colors'
          >
            <X size={20} />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-4'>
          {isLoading ? (
            <div className='py-8 text-center text-text-muted'>Loading your journeys...</div>
          ) : journeys.length === 0 ? (
            <div className='py-8 text-center text-text-muted flex flex-col items-center gap-2'>
              <Luggage size={32} className='opacity-50' />
              <p>You don't have any active journeys.</p>
            </div>
          ) : (
            <div className='space-y-2'>
              {journeys.map(journey => (
                <button
                  key={journey.id}
                  onClick={() => handleSelectJourney(journey.id)}
                  disabled={isSubmitting}
                  className='w-full flex flex-col items-start gap-1 p-4 rounded-xl border border-border hover:border-primary-500 hover:bg-surface transition-colors disabled:opacity-50 text-left'
                >
                  <TextBody className='font-bold text-[15px]'>{journey.title}</TextBody>
                  <TextBody className='text-xs text-text-muted'>
                    {journey.destination || 'No destination'} • Last updated {new Date(journey.updatedAt).toLocaleDateString()}
                  </TextBody>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className='border-t border-border p-4 bg-surface'>
          <button
            onClick={handleCreateJourney}
            className='w-full flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white hover:bg-primary-700 transition-colors'
          >
            <Plus size={18} />
            Create a New Journey
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
