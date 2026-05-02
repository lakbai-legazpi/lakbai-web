'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgePlus, Check, Luggage, Trash2 } from 'lucide-react';
import { TextHeading, TextBody } from '@/components/text';
import JourneyCard, { type JourneyCardJourney } from '../journey-card';
import NewJourneyModal from '../../../_components/NewJourneyModal';
import Notification from '../../../_components/Notificaiton';

export default function JourneyList({
  initialJourneys
}: {
  initialJourneys: JourneyCardJourney[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [journeys, setJourneys] =
    useState<JourneyCardJourney[]>(initialJourneys);
  const [selectedJourneyIds, setSelectedJourneyIds] = useState<Set<string>>(
    new Set()
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationJourneyIds, setDeleteConfirmationJourneyIds] =
    useState<string[] | null>(null);

  useEffect(() => {
    setJourneys(initialJourneys);
    setSelectedJourneyIds(new Set());
  }, [initialJourneys]);

  const selectedCount = selectedJourneyIds.size;
  const deleteConfirmationCount = deleteConfirmationJourneyIds?.length ?? 0;

  const toggleJourneySelection = (journeyId: string) => {
    setSelectedJourneyIds(prev => {
      const next = new Set(prev);
      if (next.has(journeyId)) {
        next.delete(journeyId);
      } else {
        next.add(journeyId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedJourneyIds(prev => {
      if (prev.size === journeys.length) {
        return new Set();
      }

      return new Set(journeys.map(journey => journey.id));
    });
  };

  const handleRenameJourney = async (journey: JourneyCardJourney) => {
    const nextTitle = window.prompt('Rename journey', journey.title);

    if (!nextTitle?.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/journeys/${journey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nextTitle })
      });

      if (!response.ok) {
        throw new Error('Failed to rename journey');
      }

      setJourneys(prev =>
        prev.map(item =>
          item.id === journey.id ? { ...item, title: nextTitle.trim() } : item
        )
      );
    } catch (error) {
      console.error(error);
      window.alert('Failed to rename journey.');
    }
  };

  const requestDeleteJourneys = (journeyIds: string[]) => {
    if (journeyIds.length === 0) return;

    setDeleteConfirmationJourneyIds(journeyIds);
  };

  const deleteJourneys = async (journeyIds: string[]) => {
    if (journeyIds.length === 0) return;

    setIsDeleting(true);

    try {
      const responses = await Promise.all(
        journeyIds.map(id => fetch(`/api/journeys/${id}`, { method: 'DELETE' }))
      );

      if (responses.some(response => !response.ok)) {
        throw new Error('Failed to delete one or more journeys');
      }

      setJourneys(prev =>
        prev.filter(journey => !journeyIds.includes(journey.id))
      );
      setSelectedJourneyIds(prev => {
        const next = new Set(prev);
        journeyIds.forEach(id => next.delete(id));
        return next;
      });
    } catch (error) {
      console.error(error);
      window.alert('Failed to delete journeys.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationJourneyIds(null);
    }
  };

  const handleDeleteJourney = async (journey: JourneyCardJourney) => {
    requestDeleteJourneys([journey.id]);
  };

  const handleDeleteSelected = () => {
    requestDeleteJourneys(Array.from(selectedJourneyIds));
  };

  const handleConfirmDeleteJourneys = async () => {
    if (!deleteConfirmationJourneyIds) return;

    await deleteJourneys(deleteConfirmationJourneyIds);
  };

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

  const allSelected = journeys.length > 0 && selectedCount === journeys.length;

  if (!journeys || journeys.length === 0) {
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
            <div className='mb-6 flex h-25 w-25 items-center justify-center rounded-full bg-linear-to-b from-[#1F677A] to-[#C9F0F4]'>
              <Luggage size={40} strokeWidth={1} className='text-white' />
            </div>

            {/* Title */}
            <TextHeading className='mb-3 text-[20px] font-bold text-black'>
              No journeys yet
            </TextHeading>

            {/* Description */}
            <TextBody className='mb-8 max-w-85 text-[16px] leading-relaxed font-normal text-black'>
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
      <div className='mb-10 flex flex-wrap items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <TextHeading className='text-[36px] font-bold text-black'>
            My Journeys
          </TextHeading>

          {selectedCount > 0 && (
            <span className='text-text-muted rounded-full bg-slate-100 px-3 py-1 text-sm font-medium'>
              {selectedCount} selected
            </span>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-3'>
          <button
            type='button'
            onClick={toggleSelectAll}
            className='border-border text-text-main hover:bg-surface-light bg-background inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition'
          >
            <Check size={16} />
            {allSelected ? 'Clear selection' : 'Select all'}
          </button>

          {selectedCount > 0 && (
            <button
              type='button'
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className='inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
            >
              <Trash2 size={18} />
              {isDeleting
                ? 'Deleting...'
                : `Delete selected (${selectedCount})`}
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className='flex items-center gap-2 rounded-full bg-[#008A90] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90'
          >
            <BadgePlus size={18} />
            New Journey
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className='flex flex-wrap gap-6'>
        {journeys.map(journey => (
          <JourneyCard
            key={journey.id}
            journey={journey}
            selected={selectedJourneyIds.has(journey.id)}
            onToggleSelect={toggleJourneySelection}
            onRename={handleRenameJourney}
            onDelete={handleDeleteJourney}
          />
        ))}
      </div>

      <NewJourneyModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      <Notification
        type='delete-confirmation'
        isOpen={deleteConfirmationJourneyIds !== null}
        onCancel={() => setDeleteConfirmationJourneyIds(null)}
        onConfirm={handleConfirmDeleteJourneys}
        isLoading={isDeleting}
        title={
          deleteConfirmationCount === 1
            ? 'Delete journey?'
            : `Delete ${deleteConfirmationCount} journeys?`
        }
        description={
          deleteConfirmationCount === 1
            ? 'This action cannot be undone.'
            : 'These journeys will be removed permanently.'
        }
        confirmLabel={
          deleteConfirmationCount === 1 ? 'Delete' : 'Delete selected'
        }
        confirmLoadingLabel='Deleting...'
      />
    </div>
  );
}
