'use client';

import { useMemo, useState } from 'react';
import { TextHeading, TextBody } from '@/components/text';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import {
  addDays,
  addWeeks,
  addMonths,
  startOfWeek,
  startOfMonth,
  endOfWeek,
  endOfMonth,
  eachDayOfInterval,
  format,
  differenceInDays,
  isSameMonth,
  isSameDay
} from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type JourneyCalendarProps = {
  startDate: Date | null;
  endDate: Date | null;
  isFlexible: boolean;
  flexibleDays?: number | null;
  flexibleMonths?: string[];
  itineraryItems?: any[];
};

const HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12am';
  if (i < 12) return `${i}am`;
  if (i === 12) return '12pm';
  return `${i - 12}pm`;
});

const HOUR_HEIGHT = 56; // 56px per hour for scrollable grid

function parseTimeToMinutes(timeStr: string | null): number | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function formatTime(timeStr: string): string {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return m > 0 ? `${h12}:${m.toString().padStart(2, '0')}${ampm}` : `${h12}${ampm}`;
}

export default function JourneyCalendar({
  startDate,
  endDate,
  isFlexible,
  flexibleDays,
  flexibleMonths,
  itineraryItems = []
}: JourneyCalendarProps) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [offset, setOffset] = useState(0);

  const totalDays = useMemo(() => {
    if (isFlexible) return flexibleDays || 5;
    if (startDate && endDate) return Math.max(1, differenceInDays(endDate, startDate) + 1);
    return 5;
  }, [isFlexible, flexibleDays, startDate, endDate]);

  const itemsByDay = useMemo(() => {
    const map = new Map<number, any[]>();
    itineraryItems.forEach(item => {
      if (item.dayNumber) {
        if (!map.has(item.dayNumber)) map.set(item.dayNumber, []);
        map.get(item.dayNumber)!.push(item);
      }
    });
    // Sort items by time
    map.forEach(items => {
      items.sort((a, b) => {
        if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
        if (a.startTime) return -1;
        if (b.startTime) return 1;
        return a.orderIndex - b.orderIndex;
      });
    });
    return map;
  }, [itineraryItems]);

  // Handle pagination limits
  const handlePrev = () => setOffset(o => o - 1);
  const handleNext = () => setOffset(o => o + 1);

  // Generate Week Data
  const weekData = useMemo(() => {
    if (isFlexible) {
      const startDay = offset * 7 + 1;
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = startDay + i;
        if (d <= totalDays) {
          days.push({
            dayNumber: d,
            title: `Day ${d}`,
            subtitle: '',
            isCurrentMonth: true,
            items: itemsByDay.get(d) || []
          });
        }
      }
      return {
        title: `Days ${startDay} - ${Math.min(startDay + 6, totalDays)}`,
        days
      };
    } else {
      const baseStart = startDate || new Date();
      const currentWeekStart = startOfWeek(addWeeks(baseStart, offset), { weekStartsOn: 0 });
      const days = Array.from({ length: 7 }).map((_, i) => {
        const date = addDays(currentWeekStart, i);
        const dayNum = startDate ? differenceInDays(date, startDate) + 1 : -1;
        return {
          dayNumber: dayNum,
          date,
          title: format(date, 'eee'),
          subtitle: format(date, 'd'),
          isCurrentMonth: true,
          items: itemsByDay.get(dayNum) || []
        };
      });
      const weekStartStr = format(days[0].date, 'MMM d');
      const weekEndStr = format(days[6].date, 'MMM d, yyyy');
      return {
        title: `${weekStartStr} – ${weekEndStr}`,
        days
      };
    }
  }, [isFlexible, offset, totalDays, startDate, itemsByDay]);

  // Generate Month Data
  const monthData = useMemo(() => {
    if (isFlexible) return { title: '', days: [] };
    const baseStart = startDate || new Date();
    const currentMonthStart = startOfMonth(addMonths(baseStart, offset));
    const calendarStart = startOfWeek(currentMonthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(endOfMonth(currentMonthStart), { weekStartsOn: 0 });
    const dates = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    const days = dates.map(date => {
      const dayNum = startDate ? differenceInDays(date, startDate) + 1 : -1;
      return {
        dayNumber: dayNum,
        date,
        isCurrentMonth: isSameMonth(date, currentMonthStart),
        items: itemsByDay.get(dayNum) || []
      };
    });

    return {
      title: format(currentMonthStart, 'MMMM yyyy'),
      days
    };
  }, [isFlexible, offset, startDate, itemsByDay]);

  const activeMode = isFlexible ? 'week' : viewMode;
  const headerTitle = activeMode === 'week' ? weekData.title : monthData.title;

  return (
    <div className='border-border bg-surface flex h-[800px] max-h-[85vh] w-full flex-col overflow-hidden rounded-[24px] border shadow-sm print:h-auto print:max-h-none print:border-none print:shadow-none'>
      {/* Header */}
      <div className='border-border flex flex-col justify-between border-b px-6 py-5 sm:flex-row sm:items-center'>
        <div className='mb-4 flex items-baseline gap-3 sm:mb-0'>
          <TextHeading className='text-text-main text-2xl font-bold'>Calendar</TextHeading>
          <TextBody className='text-text-muted text-sm font-medium'>{totalDays} days</TextBody>
        </div>

        <div className='flex items-center gap-4'>
          <div className='text-text-main flex items-center gap-3 font-semibold'>
            <button onClick={handlePrev} className='hover:bg-surface-light rounded-full p-1 transition-colors'>
              <ChevronLeft size={20} />
            </button>
            <span className='min-w-[160px] text-center text-[15px]'>{headerTitle}</span>
            <button onClick={handleNext} className='hover:bg-surface-light rounded-full p-1 transition-colors'>
              <ChevronRight size={20} />
            </button>
          </div>

          {!isFlexible && (
            <div className='bg-surface-light border-border flex rounded-lg border p-1'>
              <button
                onClick={() => { setViewMode('week'); setOffset(0); }}
                className={cn('rounded-md px-3 py-1 text-sm font-medium transition-colors', activeMode === 'week' ? 'bg-white text-text-main shadow-xs' : 'text-text-muted')}
              >
                Week
              </button>
              <button
                onClick={() => { setViewMode('month'); setOffset(0); }}
                className={cn('rounded-md px-3 py-1 text-sm font-medium transition-colors', activeMode === 'month' ? 'bg-white text-text-main shadow-xs' : 'text-text-muted')}
              >
                Month
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Area */}
      <div className='flex-1 overflow-hidden relative'>
        {activeMode === 'week' ? (
          <div className='flex h-full flex-col'>
            {/* Week Headers */}
            <div className='border-border bg-surface flex border-b'>
              <div className='border-border w-16 shrink-0 border-r py-3'></div>
              <div className='flex flex-1'>
                {weekData.days.map((day, i) => (
                  <div key={i} className='border-border flex flex-1 flex-col items-center justify-center border-r last:border-r-0 py-3'>
                    <span className='text-text-muted text-xs font-semibold uppercase tracking-wider'>{day.title}</span>
                    <span className={cn('mt-1 flex h-7 w-7 items-center justify-center rounded-full text-[15px] font-bold', day.dayNumber >= 1 && day.dayNumber <= totalDays ? 'bg-primary-50 text-primary-600' : 'text-text-main')}>
                      {day.subtitle || day.dayNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Week Scrollable Grid */}
            <div className='flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-invisible'>
              <div className='flex min-h-max'>
                {/* Time Axis */}
                <div className='border-border bg-surface w-16 shrink-0 border-r sticky left-0 z-20'>
                  <div className='border-border h-[40px] border-b text-center text-xs font-medium text-text-muted flex items-center justify-center'>
                    all-day
                  </div>
                  {HOURS.map((hour, i) => (
                    <div key={i} className='border-border relative border-b text-right pr-2 text-xs font-medium text-text-muted' style={{ height: HOUR_HEIGHT }}>
                      <span className='absolute -top-2.5 right-2 bg-surface px-1'>{hour}</span>
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                <div className='flex flex-1 relative'>
                  {/* Background horizontal lines for grid */}
                  <div className='absolute inset-0 pointer-events-none'>
                    <div className='border-border h-[40px] border-b w-full'></div>
                    {HOURS.map((_, i) => (
                      <div key={i} className='border-border border-b w-full' style={{ height: HOUR_HEIGHT }}></div>
                    ))}
                  </div>

                  {weekData.days.map((day, i) => {
                    const allDayItems = day.items.filter(item => !item.startTime);
                    const timedItems = day.items.filter(item => !!item.startTime);

                    return (
                      <div key={i} className='border-border relative flex-1 border-r last:border-r-0'>
                        {/* All Day Slot */}
                        <div className='h-[40px] p-1 flex items-center gap-1 overflow-x-auto scrollbar-invisible relative z-10'>
                          {allDayItems.map(item => (
                            <Link 
                              key={item.id} 
                              href={item.poi?.id ? `/explore?poi=${item.poi.id}` : '#'}
                              className='bg-primary-100 text-primary-800 hover:bg-primary-200 block shrink-0 truncate rounded px-2 py-0.5 text-[11px] font-semibold transition-colors'
                            >
                              {item.poi?.name || 'Event'}
                            </Link>
                          ))}
                        </div>

                        {/* Timed Slots Area */}
                        <div className='relative w-full' style={{ height: HOURS.length * HOUR_HEIGHT }}>
                          {timedItems.map(item => {
                            const startMins = parseTimeToMinutes(item.startTime) || 0;
                            const endMins = parseTimeToMinutes(item.endTime) || (startMins + 60); // default 1hr
                            
                            const top = (startMins / 60) * HOUR_HEIGHT;
                            const height = ((endMins - startMins) / 60) * HOUR_HEIGHT;

                            return (
                              <Link
                                key={item.id}
                                href={item.poi?.id ? `/explore?poi=${item.poi.id}` : '#'}
                                className='absolute inset-x-1 z-10 block overflow-hidden rounded-md bg-primary-600 p-2 text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-primary-500 hover:shadow-md hover:z-20'
                                style={{ top, height: Math.max(height, 24) }} // min height
                              >
                                <div className='flex h-full flex-col'>
                                  <div className='text-[11px] font-bold opacity-90'>
                                    {formatTime(item.startTime!)} - {formatTime(item.endTime!)}
                                  </div>
                                  <div className='mt-0.5 truncate text-[12px] font-semibold leading-tight'>
                                    {item.poi?.name}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Month View */
          <div className='flex h-full flex-col'>
            {/* Days of Week Header */}
            <div className='border-border flex border-b'>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className='border-border flex-1 border-r last:border-r-0 py-3 text-center text-xs font-semibold text-text-muted'>
                  {d}
                </div>
              ))}
            </div>

            {/* Month Grid */}
            <div className='flex-1 overflow-y-auto scrollbar-invisible bg-surface-light'>
              <div className='grid grid-cols-7 h-full'>
                {monthData.days.map((day, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      'border-border min-h-[100px] border-b border-r bg-white p-2 flex flex-col',
                      !day.isCurrentMonth && 'bg-surface-light/50 opacity-50'
                    )}
                  >
                    <span className={cn('text-sm font-semibold mb-1 w-7 h-7 flex items-center justify-center rounded-full', 
                      day.dayNumber >= 1 && day.dayNumber <= totalDays ? 'bg-primary-50 text-primary-600' : 'text-text-main'
                    )}>
                      {format(day.date, 'd')}
                    </span>

                    <div className='flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-invisible'>
                      {day.items.map(item => (
                        <Link
                          key={item.id}
                          href={item.poi?.id ? `/explore?poi=${item.poi.id}` : '#'}
                          className='flex items-center gap-1.5 truncate rounded hover:bg-surface-light px-1 py-0.5 group'
                        >
                          <div className='w-2 h-2 shrink-0 rounded-full bg-primary-500'></div>
                          <span className='truncate text-[11px] font-medium text-text-main group-hover:text-primary-600 transition-colors'>
                            {item.startTime ? formatTime(item.startTime) + ' ' : ''}{item.poi?.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
