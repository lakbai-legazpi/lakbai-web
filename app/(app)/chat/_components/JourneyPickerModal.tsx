'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface Journey {
  id: string;
  title: string;
  destination?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  isFlexibleDates?: boolean;
  flexibleDays?: number | null;
  budget?: number | null;
  itineraryItems?: any[];
  createdAt: Date;
  updatedAt: Date;
}

interface JourneyPickerModalProps {
  open: boolean;
  journeys: Journey[];
  onClose: () => void;
  onSelectJourney: (journeyId: string) => Promise<void>;
  onCreateNewJourney: () => void;
  isSubmitting?: boolean;
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function JourneyPickerModal({
  open,
  journeys,
  onClose,
  onSelectJourney,
  onCreateNewJourney,
  isSubmitting = false
}: JourneyPickerModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async (journeyId: string) => {
    setIsLoading(true);
    try {
      await onSelectJourney(journeyId);
      setSelectedId(null);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedId(null);
    onCreateNewJourney();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className='fixed inset-0 z-40 bg-black/50' onClick={onClose} />

      {/* Modal */}
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
        <div className='bg-background border-border relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border shadow-xl'>
          {/* Header */}
          <div className='border-border bg-background sticky top-0 flex items-center justify-between border-b px-6 py-4'>
            <h2 className='text-text-main text-lg font-bold'>
              Connect to a Journey
            </h2>
            <button
              onClick={onClose}
              className='text-text-muted hover:text-text-main transition-colors'
              disabled={isLoading || isSubmitting}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className='space-y-4 p-6'>
            {journeys.length > 0 ? (
              <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                {journeys.map(journey => (
                  <button
                    key={journey.id}
                    onClick={() => handleSelect(journey.id)}
                    disabled={isLoading || isSubmitting}
                    className='border-border rounded-lg border p-3 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800'
                  >
                    <div className='text-text-main line-clamp-2 text-sm font-semibold'>
                      {journey.title}
                    </div>
                    {journey.destination && (
                      <div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                        📍 {journey.destination}
                      </div>
                    )}
                    <div className='mt-2 text-xs text-gray-400 dark:text-gray-500'>
                      {journey.startDate && journey.endDate
                        ? `${formatDate(journey.startDate)} - ${formatDate(journey.endDate)}`
                        : journey.isFlexibleDates && journey.flexibleDays
                          ? `${journey.flexibleDays} days (flexible)`
                          : 'Dates TBD'}
                    </div>
                    {journey.budget && (
                      <div className='mt-1 text-xs text-gray-400 dark:text-gray-500'>
                        💰 ${journey.budget.toLocaleString()}
                      </div>
                    )}
                    {journey.itineraryItems &&
                      journey.itineraryItems.length > 0 && (
                        <div className='mt-1 text-xs text-gray-400 dark:text-gray-500'>
                          {journey.itineraryItems.length} poi
                          {journey.itineraryItems.length !== 1 ? 's' : ''}
                        </div>
                      )}
                  </button>
                ))}
              </div>
            ) : (
              <div className='p-8 text-center text-gray-500 dark:text-gray-400'>
                <p className='mb-2'>No journeys yet</p>
                <p className='text-sm'>
                  Create your first journey to get started
                </p>
              </div>
            )}

            {/* Create new journey button */}
            <button
              onClick={handleCreateNew}
              disabled={isLoading || isSubmitting}
              className='border-border w-full rounded-lg border-2 border-dashed p-3 text-center transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800'
            >
              <div className='flex items-center justify-center gap-2'>
                <Plus className='h-4 w-4' />
                <span className='text-sm font-medium'>Create New Journey</span>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className='border-border bg-background sticky bottom-0 flex justify-end gap-2 border-t px-6 py-4'>
            <button
              onClick={onClose}
              disabled={isLoading || isSubmitting}
              className='border-border rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800'
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
