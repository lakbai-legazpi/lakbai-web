'use client';

import { useState, useEffect } from 'react';
import { CircleX, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface JourneyAreaItineraryItem {
  id: string;
  journeyId: string;
  poiId: string;
  dayNumber: number | null;
  orderIndex: number;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  poi?: any;
}

interface JourneyAreaJourney {
  id: string;
  title: string;
  isFlexibleDates: boolean;
  startDate: string | null;
  endDate: string | null;
}

type ItemTimeframeModalProps = {
  open: boolean;
  onClose: () => void;
  item: JourneyAreaItineraryItem;
  journey: JourneyAreaJourney | null;
};

export default function ItemTimeframeModal({
  open,
  onClose,
  item,
  journey
}: ItemTimeframeModalProps) {
  const router = useRouter();

  const [dayNumber, setDayNumber] = useState<number | null>(item.dayNumber);
  const [dateStr, setDateStr] = useState<string>('');

  const [startTime, setStartTime] = useState<string>(item.startTime || '');
  const [endTime, setEndTime] = useState<string>(item.endTime || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [willExtend, setWillExtend] = useState(false);

  useEffect(() => {
    if (open) {
      setDayNumber(item.dayNumber);
      setStartTime(item.startTime || '');
      setEndTime(item.endTime || '');

      if (
        journey?.startDate &&
        !journey.isFlexibleDates &&
        item.dayNumber !== null
      ) {
        const start = new Date(journey.startDate);
        const itemDate = new Date(start);
        itemDate.setDate(start.getDate() + item.dayNumber - 1);
        setDateStr(itemDate.toISOString().split('T')[0]);
      } else {
        setDateStr('');
      }
      setWillExtend(false);
    }
  }, [open, item, journey]);

  useEffect(() => {
    if (!journey || journey.isFlexibleDates || !journey.endDate || !dateStr) {
      setWillExtend(false);
      return;
    }
    const end = new Date(journey.endDate);
    const selected = new Date(dateStr);

    // Reset hours to compare dates reliably
    end.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);

    setWillExtend(selected > end);
  }, [dateStr, journey]);

  if (!open) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let finalDayNumber = dayNumber;

      if (journey && !journey.isFlexibleDates && dateStr && journey.startDate) {
        const start = new Date(journey.startDate);
        start.setHours(0, 0, 0, 0);
        const selected = new Date(dateStr);
        selected.setHours(0, 0, 0, 0);

        // Calculate day difference
        const diffTime = Math.abs(selected.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        finalDayNumber = selected >= start ? diffDays + 1 : null; // null if they somehow bypass the min constraint
      }

      await fetch(`/api/itinerary-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: finalDayNumber,
          startTime: startTime || null,
          endTime: endTime || null
        })
      });

      if (willExtend && journey && dateStr) {
        // Extend the journey
        await fetch(`/api/journeys/${journey.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endDate: new Date(dateStr).toISOString() })
        });
      }

      router.refresh();
      onClose();
    } catch (e) {
      console.error('Failed to update timeframe', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFixedDates = journey && !journey.isFlexibleDates && journey.startDate;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
      <div className='bg-background flex w-full max-w-md flex-col gap-6 overflow-hidden rounded-[24px] p-6 shadow-2xl'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-bold'>Edit Timeframe</h2>
          <button
            onClick={onClose}
            className='text-text-muted hover:text-foreground transition-colors'
          >
            <CircleX size={20} />
          </button>
        </div>

        <div className='flex flex-col gap-4'>
          {isFixedDates ? (
            <div className='flex flex-col gap-2'>
              <label className='text-text-main flex items-center gap-2 text-sm font-bold'>
                <CalendarIcon size={16} /> Date
              </label>
              <input
                type='date'
                value={dateStr}
                min={journey.startDate ? journey.startDate.split('T')[0] : ''}
                onChange={e => setDateStr(e.target.value)}
                className='border-border bg-surface focus:ring-primary-500 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2'
              />
              {willExtend && (
                <div className='mt-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800'>
                  <strong>Note:</strong> This date is after your journey's
                  scheduled end date. Proceeding will automatically extend your
                  journey to {new Date(dateStr).toLocaleDateString()}.
                </div>
              )}
            </div>
          ) : (
            <div className='flex flex-col gap-2'>
              <label className='text-text-main flex items-center gap-2 text-sm font-bold'>
                <CalendarIcon size={16} /> Day Number
              </label>
              <select
                value={dayNumber || ''}
                onChange={e =>
                  setDayNumber(
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
                className='border-border bg-surface focus:ring-primary-500 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2'
              >
                <option value=''>Unscheduled (Basecamp)</option>
                {Array.from({ length: 14 }).map((_, i) => (
                  <option key={i} value={i + 1}>
                    Day {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className='flex gap-4'>
            <div className='flex flex-1 flex-col gap-2'>
              <label className='text-text-main flex items-center gap-2 text-sm font-bold'>
                <Clock size={16} /> Start Time
              </label>
              <input
                type='time'
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className='border-border bg-surface focus:ring-primary-500 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2'
              />
            </div>
            <div className='flex flex-1 flex-col gap-2'>
              <label className='text-text-main flex items-center gap-2 text-sm font-bold'>
                <Clock size={16} /> End Time
              </label>
              <input
                type='time'
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className='border-border bg-surface focus:ring-primary-500 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2'
              />
            </div>
          </div>
        </div>

        <div className='mt-4 flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='text-text-muted hover:bg-surface rounded-xl px-5 py-2.5 font-bold transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !!(isFixedDates && !dateStr)}
            className='bg-primary-600 hover:bg-primary-700 rounded-xl px-5 py-2.5 font-bold text-white transition-colors disabled:opacity-50'
          >
            {isSubmitting ? 'Saving...' : 'Save Timeframe'}
          </button>
        </div>
      </div>
    </div>
  );
}
