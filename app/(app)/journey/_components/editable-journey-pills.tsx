'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import JourneyDatePickerModal, { TimingData } from '../../_components/JourneyDatePickerModal';
import { formatFlexibleSelection, formatDateSelection } from '@/lib/date-utils';

interface EditableJourney {
  id: string;
  destination: string | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
  isFlexibleDates: boolean;
  flexibleDays: number | null;
  flexibleMonths: string | null;
  companions: string | null;
  budget: number | null;
}

export const budgetOptions = [
  { label: 'Any budget', value: null },
  { label: 'Budget', value: 1 },
  { label: 'Mid-range', value: 2 },
  { label: 'Luxury', value: 3 },
  { label: 'Ultra-Luxury', value: 4 }
];

export default function EditableJourneyPills({ journey }: { journey: EditableJourney | null }) {
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [companionsDropdownOpen, setCompanionsDropdownOpen] = useState(false);
  const [budgetDropdownOpen, setBudgetDropdownOpen] = useState(false);

  const [companionsValue, setCompanionsValue] = useState<string | null>(journey?.companions || null);
  const [budgetValue, setBudgetValue] = useState<number | null>(journey?.budget || null);

  const budgetLabel = budgetOptions.find(o => o.value === (budgetValue !== null ? budgetValue : journey?.budget))?.label || 'Any budget';

  const handleTimingSubmit = async (data: TimingData) => {
    try {
      const payload: any = {
        isFlexibleDates: data.selectedTimingType === 'flexible',
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        flexibleDays: data.flexibleDays,
        flexibleMonths: JSON.stringify(data.flexibleMonths)
      };

      const res = await fetch(`/api/journeys/${journey?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowDatePicker(false);
        router.refresh();
        window.dispatchEvent(new Event('journey-updated'));
      }
    } catch (e) {
      console.error('Failed to update dates', e);
    }
  };

  return (
    <>
      <div className='border-border bg-surface inline-flex items-center overflow-visible rounded-3xl border shadow-sm'>
        <button className='border-border text-text-main hover:bg-background rounded-l-3xl border-r px-5 py-2 text-[14px] font-medium transition-colors'>
          {journey?.destination || 'Planning exactly where'}
        </button>

        {/* Date Picker Trigger */}
        <button
          onClick={() => setShowDatePicker(true)}
          className='border-border text-text-main hover:bg-background flex items-center gap-2 border-r px-5 py-2 text-[14px] font-medium transition-colors'
        >
          <CalendarIcon size={14} />
          {journey?.isFlexibleDates
            ? formatFlexibleSelection(
                journey.flexibleDays || 5,
                journey.flexibleMonths ? JSON.parse(journey.flexibleMonths) : []
              ) || '5 days'
            : journey?.startDate
              ? formatDateSelection(
                  typeof journey.startDate === 'string' ? journey.startDate.split('T')[0] : journey.startDate.toISOString().split('T')[0],
                  journey.endDate ? (typeof journey.endDate === 'string' ? journey.endDate.split('T')[0] : journey.endDate.toISOString().split('T')[0]) : ''
                )
              : '5 days'}
        </button>

        <div className='relative'>
          <button
            onClick={() => setCompanionsDropdownOpen(prev => !prev)}
            className='border-border text-text-main hover:bg-background flex items-center gap-2 border-r px-5 py-2 text-[14px] font-medium transition-colors'
            aria-label='Select group size'
          >
            <span>{companionsValue || journey?.companions || 'Open to anyone'}</span>
            <ChevronDown
              size={16}
              className={companionsDropdownOpen ? 'rotate-180 transition-transform' : 'transition-transform'}
            />
          </button>

          {companionsDropdownOpen && (
            <>
              <div className='fixed inset-0 z-40' onClick={() => setCompanionsDropdownOpen(false)} />
              <div className='border-border bg-background absolute top-full left-0 z-50 mt-1 w-full min-w-[180px] overflow-hidden rounded-2xl border shadow-lg'>
                {['1 person', '1-2 persons', '3-4 persons', '5-8 persons', '9+ persons'].map(option => (
                  <button
                    key={option}
                    onClick={async () => {
                      setCompanionsValue(option);
                      setCompanionsDropdownOpen(false);
                      try {
                        const res = await fetch(`/api/journeys/${journey?.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ companions: option })
                        });
                        if (res.ok) {
                          router.refresh();
                          window.dispatchEvent(new Event('journey-updated'));
                        }
                      } catch (e) {
                        console.error('Failed to update companions', e);
                      }
                    }}
                    className='text-text-main hover:bg-primary-50 w-full px-5 py-3 text-left text-[15px] transition-colors'
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className='relative'>
          <button
            onClick={() => setBudgetDropdownOpen(prev => !prev)}
            className='border-border text-text-main hover:bg-background flex items-center gap-2 rounded-r-3xl border-l px-5 py-2 text-[14px] font-medium transition-colors'
            aria-label='Select budget'
          >
            <span>{budgetLabel}</span>
            <ChevronDown
              size={16}
              className={budgetDropdownOpen ? 'rotate-180 transition-transform' : 'transition-transform'}
            />
          </button>

          {budgetDropdownOpen && (
            <>
              <div className='fixed inset-0 z-40' onClick={() => setBudgetDropdownOpen(false)} />
              <div className='border-border bg-background absolute top-full right-0 z-50 mt-1 w-48 overflow-hidden rounded-2xl border shadow-lg'>
                {budgetOptions.map(option => (
                  <button
                    key={option.label}
                    onClick={async () => {
                      setBudgetValue(option.value);
                      setBudgetDropdownOpen(false);
                      try {
                        const res = await fetch(`/api/journeys/${journey?.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ budget: option.value })
                        });
                        if (res.ok) {
                          router.refresh();
                          window.dispatchEvent(new Event('journey-updated'));
                        }
                      } catch (e) {
                        console.error('Failed to update budget', e);
                      }
                    }}
                    className='text-text-main hover:bg-primary-50 w-full px-5 py-3 text-left text-[15px] transition-colors'
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <JourneyDatePickerModal
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSubmit={handleTimingSubmit}
        initialData={{
          selectedTimingType: journey?.isFlexibleDates ? 'flexible' : (journey?.startDate ? 'dates' : null),
          startDate: journey?.startDate ? (typeof journey.startDate === 'string' ? journey.startDate.split('T')[0] : journey.startDate.toISOString().split('T')[0]) : '',
          endDate: journey?.endDate ? (typeof journey.endDate === 'string' ? journey.endDate.split('T')[0] : journey.endDate.toISOString().split('T')[0]) : '',
          flexibleDays: journey?.flexibleDays || 5,
          flexibleMonths: journey?.flexibleMonths ? JSON.parse(journey.flexibleMonths) : []
        }}
      />
    </>
  );
}
