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

export default function ItemTimeframeModal({ open, onClose, item, journey }: ItemTimeframeModalProps) {
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
      
      if (journey?.startDate && !journey.isFlexibleDates && item.dayNumber !== null) {
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
    end.setHours(0,0,0,0);
    selected.setHours(0,0,0,0);
    
    setWillExtend(selected > end);
  }, [dateStr, journey]);

  if (!open) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let finalDayNumber = dayNumber;
      
      if (journey && !journey.isFlexibleDates && dateStr && journey.startDate) {
        const start = new Date(journey.startDate);
        start.setHours(0,0,0,0);
        const selected = new Date(dateStr);
        selected.setHours(0,0,0,0);
        
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
      <div className='bg-background w-full max-w-md overflow-hidden rounded-[24px] shadow-2xl flex flex-col p-6 gap-6'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-bold'>Edit Timeframe</h2>
          <button onClick={onClose} className='text-text-muted hover:text-foreground transition-colors'>
            <CircleX size={20} />
          </button>
        </div>

        <div className='flex flex-col gap-4'>
          {isFixedDates ? (
            <div className='flex flex-col gap-2'>
              <label className='text-sm font-bold text-text-main flex items-center gap-2'>
                <CalendarIcon size={16} /> Date
              </label>
              <input 
                type="date" 
                value={dateStr}
                min={journey.startDate ? journey.startDate.split('T')[0] : ''}
                onChange={(e) => setDateStr(e.target.value)}
                className='border border-border rounded-lg px-4 py-3 bg-surface focus:ring-2 focus:ring-primary-500 outline-none w-full'
              />
              {willExtend && (
                <div className='mt-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200'>
                  <strong>Note:</strong> This date is after your trip's scheduled end date. Proceeding will automatically extend your journey to {new Date(dateStr).toLocaleDateString()}.
                </div>
              )}
            </div>
          ) : (
            <div className='flex flex-col gap-2'>
              <label className='text-sm font-bold text-text-main flex items-center gap-2'>
                <CalendarIcon size={16} /> Day Number
              </label>
              <select 
                value={dayNumber || ''}
                onChange={(e) => setDayNumber(e.target.value ? parseInt(e.target.value, 10) : null)}
                className='border border-border rounded-lg px-4 py-3 bg-surface focus:ring-2 focus:ring-primary-500 outline-none w-full'
              >
                <option value="">Unscheduled (Basecamp)</option>
                {Array.from({ length: 14 }).map((_, i) => (
                  <option key={i} value={i + 1}>Day {i + 1}</option>
                ))}
              </select>
            </div>
          )}

          <div className='flex gap-4'>
            <div className='flex flex-col gap-2 flex-1'>
              <label className='text-sm font-bold text-text-main flex items-center gap-2'>
                <Clock size={16} /> Start Time
              </label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className='border border-border rounded-lg px-4 py-3 bg-surface focus:ring-2 focus:ring-primary-500 outline-none w-full'
              />
            </div>
            <div className='flex flex-col gap-2 flex-1'>
              <label className='text-sm font-bold text-text-main flex items-center gap-2'>
                <Clock size={16} /> End Time
              </label>
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className='border border-border rounded-lg px-4 py-3 bg-surface focus:ring-2 focus:ring-primary-500 outline-none w-full'
              />
            </div>
          </div>
        </div>

        <div className='flex justify-end gap-3 mt-4'>
          <button 
            onClick={onClose}
            className='px-5 py-2.5 font-bold text-text-muted hover:bg-surface rounded-xl transition-colors'
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !!(isFixedDates && !dateStr)}
            className='px-5 py-2.5 font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50'
          >
            {isSubmitting ? 'Saving...' : 'Save Timeframe'}
          </button>
        </div>
      </div>
    </div>
  );
}
