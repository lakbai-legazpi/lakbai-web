'use client';

import { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Minus,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  WEEK_DAYS,
  MONTH_NAMES,
  CURRENT_MONTH_INDEX,
  FLEXIBLE_MONTH_OPTIONS,
  toISODate,
  monthLabel,
  buildMonthDays,
  formatDateSelection,
  sortMonthsByTimeline,
  formatFlexibleSelection
} from '@/lib/date-utils';

export type TimingData = {
  selectedTimingType: 'dates' | 'flexible' | null;
  startDate: string;
  endDate: string;
  flexibleDays: number;
  flexibleMonths: string[];
};

type JourneyDatePickerModalProps = {
  open: boolean;
  onClose: () => void;
  initialData?: TimingData;
  onSubmit: (data: TimingData) => void;
};

export default function JourneyDatePickerModal({
  open,
  onClose,
  initialData,
  onSubmit
}: JourneyDatePickerModalProps) {
  const [timingModalMode, setTimingModalMode] = useState<'dates' | 'flexible'>(
    initialData?.selectedTimingType || 'dates'
  );
  const [selectedTimingType, setSelectedTimingType] = useState<'dates' | 'flexible' | null>(
    initialData?.selectedTimingType || null
  );

  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [flexibleDays, setFlexibleDays] = useState(initialData?.flexibleDays || 5);
  const [flexibleMonths, setFlexibleMonths] = useState<string[]>(initialData?.flexibleMonths || []);
  
  const [calendarMonth, setCalendarMonth] = useState(() => {
    if (initialData?.startDate) {
      const d = new Date(`${initialData.startDate}T00:00:00`);
      if (!Number.isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  if (!open) return null;

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayISO = toISODate(todayDate);
  const minCalendarMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
  const minMonthKey = minCalendarMonth.getFullYear() * 12 + minCalendarMonth.getMonth();

  const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
  const calendarMonthKey = calendarMonth.getFullYear() * 12 + calendarMonth.getMonth();
  const canGoPrevMonth = calendarMonthKey > minMonthKey;
  
  const leftMonthCells = buildMonthDays(calendarMonth);
  const rightMonthCells = buildMonthDays(nextMonth);
  
  const sortedFlexibleMonths = sortMonthsByTimeline(flexibleMonths);
  const dateSummary = formatDateSelection(startDate, endDate);
  const flexibleSummary = formatFlexibleSelection(flexibleDays, sortedFlexibleMonths);

  const handleDateSelect = (iso: string) => {
    if (iso < todayISO) return;

    if (!startDate || endDate) {
      setStartDate(iso);
      setEndDate('');
      return;
    }

    if (iso < startDate) return; // Safety check: invalid end dates are disabled

    setEndDate(iso);
  };

  const handleFlexibleMonthToggle = (month: string) => {
    setFlexibleMonths(currentMonths =>
      currentMonths.includes(month)
        ? currentMonths.filter(currentMonth => currentMonth !== month)
        : [...currentMonths, month]
    );
  };

  const isInSelectedRange = (iso: string) => {
    if (!startDate) return false;
    if (!endDate) return iso === startDate;
    return iso >= startDate && iso <= endDate;
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
      <div className='bg-surface-light text-text-main border-border flex w-full max-w-270 flex-col overflow-hidden rounded-[24px] border shadow-2xl'>
        <div className='border-border flex flex-col border-b px-8 py-5'>
          <div className='flex items-center justify-between'>
            <div />
            <h2 className='text-2xl font-semibold'>When</h2>
            <button
              onClick={onClose}
              className='text-text-muted hover:text-primary-500 transition-colors'
              aria-label='Close timing modal'
            >
              <CircleX size={20} />
            </button>
          </div>
          <p className='text-text-muted mt-2 text-center text-sm font-medium'>
            {timingModalMode === 'dates'
              ? startDate && endDate
                ? dateSummary
                : !startDate
                  ? 'Step 1: Select start date'
                  : 'Step 2: Select end date'
              : flexibleSummary || `${flexibleDays} days`}
          </p>
        </div>

        <div className='flex-1 overflow-y-auto px-8 py-7'>
          <div className='mb-8 flex items-center justify-center'>
            <div className='bg-background inline-flex rounded-full p-1'>
              <button
                onClick={() => setTimingModalMode('dates')}
                className={cn(
                  'rounded-full px-6 py-2 font-semibold transition-colors',
                  timingModalMode === 'dates'
                    ? 'bg-primary-500 text-white'
                    : 'text-text-main hover:text-primary-700'
                )}
              >
                Dates
              </button>
              <button
                onClick={() => setTimingModalMode('flexible')}
                className={cn(
                  'rounded-full px-6 py-2 font-semibold transition-colors',
                  timingModalMode === 'flexible'
                    ? 'bg-secondary-500 text-white'
                    : 'text-text-main hover:text-secondary-700'
                )}
              >
                Flexible
              </button>
            </div>
          </div>

          {timingModalMode === 'dates' && (
            <div>
              <div className='mb-8 flex items-center justify-center gap-3'>
                <button
                  onClick={() => {
                    if (!canGoPrevMonth) return;
                    const previousMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
                    const previousMonthKey = previousMonth.getFullYear() * 12 + previousMonth.getMonth();
                    setCalendarMonth(previousMonthKey < minMonthKey ? minCalendarMonth : previousMonth);
                  }}
                  disabled={!canGoPrevMonth}
                  className='bg-background text-text-main hover:bg-primary-50 hover:text-primary-700 disabled:text-text-muted/40 disabled:bg-background/70 rounded-full p-2 transition-colors disabled:cursor-not-allowed'
                >
                  <ChevronLeft size={18} />
                </button>

                <div className='flex w-full max-w-215 gap-8'>
                  <div className='flex-1'>
                    <h3 className='mb-4 text-center text-lg font-semibold'>{monthLabel(calendarMonth)}</h3>
                    <div className='text-text-muted grid grid-cols-7 gap-y-2 text-center text-xs'>
                      {WEEK_DAYS.map(day => <span key={day}>{day}</span>)}
                    </div>
                    <div className='mt-3 grid grid-cols-7 gap-y-1.5 text-center'>
                      {leftMonthCells.map((cell, index) => {
                        if (!cell) return <span key={`left-empty-${index}`} className='h-9' />;
                        const selected = isInSelectedRange(cell.iso);
                        const edge = cell.iso === startDate || cell.iso === endDate;
                        const isPastDate = cell.iso < todayISO;
                        const isInvalidEndDate = Boolean(startDate && !endDate && cell.iso < startDate);
                        const isDisabled = Boolean(isPastDate || isInvalidEndDate);
                        return (
                          <button
                            key={cell.iso}
                            onClick={() => handleDateSelect(cell.iso)}
                            disabled={isDisabled}
                            className={cn(
                              'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors',
                              selected ? 'bg-primary-100 text-primary-900' : 'text-text-main hover:bg-primary-50 hover:text-primary-700',
                              edge && 'bg-primary-500 hover:bg-primary-500 text-white',
                              isDisabled && 'text-text-muted/40 hover:text-text-muted/40 cursor-not-allowed hover:bg-transparent'
                            )}
                          >
                            {cell.day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className='flex-1'>
                    <h3 className='mb-4 text-center text-lg font-semibold'>{monthLabel(nextMonth)}</h3>
                    <div className='text-text-muted grid grid-cols-7 gap-y-2 text-center text-xs'>
                      {WEEK_DAYS.map(day => <span key={day}>{day}</span>)}
                    </div>
                    <div className='mt-3 grid grid-cols-7 gap-y-1.5 text-center'>
                      {rightMonthCells.map((cell, index) => {
                        if (!cell) return <span key={`right-empty-${index}`} className='h-9' />;
                        const selected = isInSelectedRange(cell.iso);
                        const edge = cell.iso === startDate || cell.iso === endDate;
                        const isPastDate = cell.iso < todayISO;
                        const isInvalidEndDate = Boolean(startDate && !endDate && cell.iso < startDate);
                        const isDisabled = Boolean(isPastDate || isInvalidEndDate);
                        return (
                          <button
                            key={cell.iso}
                            onClick={() => handleDateSelect(cell.iso)}
                            disabled={isDisabled}
                            className={cn(
                              'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors',
                              selected ? 'bg-primary-100 text-primary-900' : 'text-text-main hover:bg-primary-50 hover:text-primary-700',
                              edge && 'bg-primary-500 hover:bg-primary-500 text-white',
                              isDisabled && 'text-text-muted/40 hover:text-text-muted/40 cursor-not-allowed hover:bg-transparent'
                            )}
                          >
                            {cell.day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  className='bg-background text-text-main hover:bg-primary-50 hover:text-primary-700 rounded-full p-2 transition-colors'
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {timingModalMode === 'flexible' && (
            <div>
              <div className='mb-10 flex flex-col items-center gap-5'>
                <span className='text-xl font-semibold'>How many days?</span>
                <div className='flex items-center gap-4'>
                  <button
                    onClick={() => setFlexibleDays(Math.max(1, flexibleDays - 1))}
                    className='bg-background text-text-main hover:bg-primary-50 hover:text-primary-700 flex h-10 w-10 items-center justify-center rounded-full transition-colors'
                  >
                    <Minus size={18} />
                  </button>
                  <span className='bg-background text-text-main flex h-10 min-w-20 items-center justify-center rounded-full px-5 text-xl font-medium'>
                    {flexibleDays}
                  </span>
                  <button
                    onClick={() => setFlexibleDays(flexibleDays + 1)}
                    className='bg-background text-text-main hover:bg-primary-50 hover:text-primary-700 flex h-10 w-10 items-center justify-center rounded-full transition-colors'
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className='mb-10 flex w-full flex-col items-center gap-5'>
                <span className='text-xl font-semibold'>Travel anytime</span>
                <div className='grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6'>
                  {FLEXIBLE_MONTH_OPTIONS.map(month => (
                    <button
                      key={month}
                      onClick={() => handleFlexibleMonthToggle(month)}
                      className={cn(
                        'bg-background text-text-main hover:bg-primary-50 hover:text-primary-700 flex h-28 flex-col items-center justify-center gap-3 rounded-2xl transition-colors',
                        flexibleMonths.includes(month) && 'bg-primary-100 text-primary-900 ring-primary-300 ring-2'
                      )}
                    >
                      <CalendarIcon size={22} className='opacity-80' />
                      <span className='text-base'>{month}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className='border-border flex shrink-0 items-center justify-end gap-4 border-t px-8 py-5'>
          <button
            onClick={() => {
              const newTimingType = timingModalMode;
              setSelectedTimingType(newTimingType);
              
              const updatedData: TimingData = {
                selectedTimingType: newTimingType,
                startDate: startDate,
                endDate: endDate,
                flexibleDays: flexibleDays,
                flexibleMonths: flexibleMonths
              };
              
              onSubmit(updatedData);
            }}
            disabled={
              timingModalMode === 'dates'
                ? (!startDate || !endDate) && !initialData?.startDate
                : flexibleMonths.length === 0
            }
            className='bg-primary-500 hover:bg-primary-400 rounded-full px-8 py-3 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40'
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
