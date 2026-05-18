'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Minus,
  Plus
} from 'lucide-react';
import { TextHeading, TextBody } from '@/components/text';
import { cn } from '@/lib/utils';

import JourneyDatePickerModal, { TimingData } from './JourneyDatePickerModal';
import { formatDateSelection, formatFlexibleSelection, sortMonthsByTimeline } from '@/lib/date-utils';
import { AutocompleteInput } from '@/components/ui/AutocompleteInput';

const DESTINATION_OPTIONS = ['Legazpi City', 'Daraga', 'Tabaco City', 'Ligao City', 'Camalig', 'Guinobatan', 'Polangui', 'Oas', 'Sorsogon City', 'Naga City', 'Iriga City', 'Bicol Region'];

export default function NewJourneyModal({
  open,
  onClose,
  onSubmit
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [companions, setCompanions] = useState('1 person');
  const [destination, setDestination] = useState('');
  const [companionsDropdownOpen, setCompanionsDropdownOpen] = useState(false);
  const [budgetDropdownOpen, setBudgetDropdownOpen] = useState(false);
  const [budgetValue, setBudgetValue] = useState<number | null>(null);

  const [timingData, setTimingData] = useState<TimingData>({
    selectedTimingType: null,
    startDate: '',
    endDate: '',
    flexibleDays: 5,
    flexibleMonths: []
  });

  const [preferences, setPreferences] = useState('');

  const [timingModalOpen, setTimingModalOpen] = useState(false);

  const sortedFlexibleMonths = sortMonthsByTimeline(timingData.flexibleMonths);
  const dateSummary = formatDateSelection(
    timingData.startDate,
    timingData.endDate
  );
  const flexibleSummary = formatFlexibleSelection(
    timingData.flexibleDays,
    sortedFlexibleMonths
  );

  const hasValidDates = Boolean(timingData.startDate && timingData.endDate);
  const hasValidFlexible = timingData.flexibleMonths.length > 0;
  const hasValidTiming =
    (timingData.selectedTimingType === 'dates' && hasValidDates) ||
    (timingData.selectedTimingType === 'flexible' && hasValidFlexible);

  if (!open) return null;

  const handleSubmit = () => {
    if (!hasValidTiming) return;

    onSubmit({
      companions,
      destination,
      dates: {
        isFlexible: timingData.selectedTimingType === 'flexible',
        days: timingData.flexibleDays,
        month: sortedFlexibleMonths[0],
        months: sortedFlexibleMonths,
        from: timingData.startDate,
        to: timingData.endDate
      },
      preferences,
      budget: budgetValue
    });
    onClose();
  };

  const budgetOptions: Array<{ label: string; value: number | null }> = [
    { label: 'Any budget', value: null },
    { label: '₱ - Budget (Under ₱1,000/day)', value: 1 },
    { label: '₱₱ - Mid-range (₱1,000 - ₱3,000/day)', value: 2 },
    { label: '₱₱₱ - Luxury (₱3,000 - ₱5,000/day)', value: 3 },
    { label: '₱₱₱₱ - Ultra-Luxury (₱5,000+/day)', value: 4 }
  ];

  const budgetLabel =
    budgetOptions.find(option => option.value === budgetValue)?.label ??
    'Any budget';

  return (
    <>
      <div className='fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
        <div className='bg-background relative flex h-146 w-full max-w-225 overflow-hidden rounded-[24px] shadow-2xl'>
          <button
            onClick={onClose}
            className='text-text-main hover:text-primary-500 absolute top-5 right-5 z-10 rounded-full p-1.5 transition-colors'
            aria-label='Close journey modal'
          >
            <CircleX size={24} />
          </button>

          <div className='bg-primary-500 relative h-146 w-75 shrink-0 overflow-hidden'>
            <Image
              src='/JourneySideImage.png'
              alt='Journey'
              fill
              className='object-cover object-center'
              sizes='300px'
              priority
            />
          </div>

          <div className='flex h-146 flex-1 flex-col p-8'>
            <div className='mb-6'>
              <TextHeading className='text-3xl font-bold'>
                Plan a new Journey
              </TextHeading>
            </div>

            <div className='flex flex-1 flex-col gap-6 overflow-y-auto rounded-2xl'>
              <div>
                <TextBody className='text-foreground mb-2 text-sm font-bold'>
                  Destination
                </TextBody>
                <AutocompleteInput
                  id='journey-destination'
                  value={destination}
                  onValueChange={setDestination}
                  placeholder="Where's your next adventure?"
                  options={DESTINATION_OPTIONS}
                  className='bg-surface/90 focus:ring-primary-500 w-full rounded-full px-5 py-3 text-[15px] outline-none focus:ring-2 focus:ring-inset'
                />
              </div>

              <div>
                <TextBody className='text-foreground mb-2 text-sm font-bold'>
                  Group Size
                </TextBody>
                <div className='relative'>
                  <button
                    onClick={() =>
                      setCompanionsDropdownOpen(!companionsDropdownOpen)
                    }
                    className='bg-surface/90 focus:ring-primary-500 flex w-full cursor-pointer items-center justify-between rounded-full px-5 py-3 text-[15px] transition-all outline-none focus:ring-2 focus:ring-inset'
                  >
                    <span className='text-text-main'>{companions}</span>
                    <ChevronDown
                      size={18}
                      className={cn(
                        'text-text-main transition-transform',
                        companionsDropdownOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {companionsDropdownOpen && (
                    <div className='bg-background border-border absolute top-full z-10 mt-1 w-full rounded-2xl border shadow-lg'>
                      {[
                        '1 person',
                        '1-2 persons',
                        '3-4 persons',
                        '5-8 persons',
                        '9+ persons'
                      ].map(option => (
                        <button
                          key={option}
                          onClick={() => {
                            setCompanions(option);
                            setCompanionsDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full px-5 py-3 text-left text-[15px] transition-colors',
                            'hover:bg-primary-50 text-text-main',
                            companions === option &&
                              'bg-primary-100 text-primary-900 font-semibold',
                            'not-last:border-border not-last:border-b',
                            'first:rounded-t-2xl last:rounded-b-2xl'
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <TextBody className='text-foreground mb-2 text-sm font-bold'>
                  Budget
                </TextBody>
                <div className='relative'>
                  <button
                    onClick={() => setBudgetDropdownOpen(!budgetDropdownOpen)}
                    className='bg-surface/90 focus:ring-primary-500 flex w-full cursor-pointer items-center justify-between rounded-full px-5 py-3 text-[15px] transition-all outline-none focus:ring-2 focus:ring-inset'
                  >
                    <span className='text-text-main'>{budgetLabel}</span>
                    <ChevronDown
                      size={18}
                      className={cn(
                        'text-text-main transition-transform',
                        budgetDropdownOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {budgetDropdownOpen && (
                    <div className='bg-background border-border absolute top-full z-10 mt-1 w-full rounded-2xl border shadow-lg'>
                      {budgetOptions.map(option => (
                        <button
                          key={option.label}
                          onClick={() => {
                            setBudgetValue(option.value);
                            setBudgetDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full px-5 py-3 text-left text-[15px] transition-colors',
                            'hover:bg-primary-50 text-text-main',
                            budgetValue === option.value &&
                              'bg-primary-100 text-primary-900 font-semibold',
                            'not-last:border-border not-last:border-b',
                            'first:rounded-t-2xl last:rounded-b-2xl'
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <TextBody className='text-foreground mb-2 text-sm font-bold'>
                  Timing
                </TextBody>
                <div className='flex gap-3'>
                  <button
                    onClick={() => setTimingModalOpen(true)}
                    className={cn(
                      'bg-surface text-text-main hover:bg-surface-light focus:ring-primary-500 flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center rounded-full border border-transparent px-4 py-3 text-center transition-all focus:ring-2 focus:ring-inset',
                      hasValidDates && 'ring-primary-300 ring-2',
                      timingData.selectedTimingType === 'dates' &&
                        'ring-primary-500 shadow-primary-500/25 shadow-lg ring-2'
                    )}
                  >
                    <span
                      className={cn(
                        'max-w-full px-1 text-sm leading-tight wrap-break-word whitespace-normal',
                        hasValidDates ? 'font-semibold' : 'font-medium',
                        timingData.selectedTimingType === 'dates' && 'font-bold'
                      )}
                    >
                      {dateSummary || 'Select Date'}
                    </span>
                  </button>
                  <button
                    onClick={() => setTimingModalOpen(true)}
                    className={cn(
                      'bg-surface text-text-main hover:bg-surface-light focus:ring-primary-500 flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center rounded-full border border-transparent px-4 py-3 text-center transition-all focus:ring-2 focus:ring-inset',
                      hasValidFlexible && 'ring-secondary-300 ring-2',
                      timingData.selectedTimingType === 'flexible' &&
                        'ring-secondary-500 shadow-secondary-500/25 shadow-lg ring-2'
                    )}
                  >
                    <span
                      className={cn(
                        'max-w-full px-1 text-sm leading-tight wrap-break-word whitespace-normal',
                        hasValidFlexible ? 'font-semibold' : 'font-medium',
                        timingData.selectedTimingType === 'flexible' &&
                          'font-bold'
                      )}
                    >
                      {flexibleSummary || 'Flexible'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <TextBody className='text-foreground mb-2 text-sm font-bold'>
                  Journey Preferences
                </TextBody>
                <textarea
                  value={preferences}
                  onChange={e => setPreferences(e.target.value)}
                  placeholder='Any specific interests, budget constraints, etc?'
                  maxLength={20000}
                  className='bg-surface/90 focus:ring-primary-500 h-24 w-full resize-none rounded-xl px-5 py-4 text-[15px] outline-none focus:ring-2 focus:ring-inset'
                />
                <div className='text-text-muted mt-1 text-right text-xs'>
                  {preferences.length}/20000
                </div>
              </div>
            </div>

            <div className='mt-6 shrink-0'>
              <button
                onClick={handleSubmit}
                disabled={!destination || !hasValidTiming}
                className='bg-primary-600 w-full rounded-xl py-3.5 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50'
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>

      <JourneyDatePickerModal
        open={timingModalOpen}
        onClose={() => setTimingModalOpen(false)}
        initialData={timingData}
        onSubmit={data => {
          setTimingData(data);
          setTimingModalOpen(false);
        }}
      />
    </>
  );
}
