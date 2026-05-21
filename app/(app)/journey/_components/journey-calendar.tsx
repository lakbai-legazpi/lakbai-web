'use client';

import { useMemo } from 'react';
import { TextHeading, TextBody } from '@/components/text';
import { MapPin, Clock } from 'lucide-react';
import { addDays, format, differenceInDays } from 'date-fns';
import { getDayColor } from '@/lib/colors';
import Link from 'next/link';

type JourneyCalendarProps = {
  startDate: Date | null;
  endDate: Date | null;
  isFlexible: boolean;
  flexibleDays?: number | null;
  flexibleMonths?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itineraryItems?: any[];
};

export default function JourneyCalendar({
  startDate,
  endDate,
  isFlexible,
  flexibleDays,
  flexibleMonths,
  itineraryItems = []
}: JourneyCalendarProps) {
  
  // Calculate total days
  const totalDays = useMemo(() => {
    if (isFlexible) {
      return flexibleDays || 5;
    } else if (startDate && endDate) {
      // +1 to make it inclusive
      return Math.max(1, differenceInDays(endDate, startDate) + 1);
    }
    return 5; // Default fallback
  }, [isFlexible, flexibleDays, startDate, endDate]);

  // Generate day headers
  const days = useMemo(() => {
    return Array.from({ length: totalDays }).map((_, index) => {
      const dayNumber = index + 1;
      let dateString = '';
      
      if (!isFlexible && startDate) {
        const currentDate = addDays(startDate, index);
        dateString = format(currentDate, 'MMM d, yyyy');
      }

      // Filter and sort items for this specific day
      const dayItems = itineraryItems
        .filter(item => item.dayNumber === dayNumber)
        .sort((a, b) => {
          if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime);
          }
          if (a.startTime) return -1;
          if (b.startTime) return 1;
          return a.orderIndex - b.orderIndex;
        });

      return {
        dayNumber,
        title: `Day ${dayNumber}`,
        dateString,
        items: dayItems
      };
    });
  }, [totalDays, isFlexible, startDate, itineraryItems]);

  return (
    <div className='border-border bg-background flex h-full max-h-[800px] print:max-h-none w-full flex-col overflow-hidden print:overflow-visible rounded-[32px] border shadow-xs print:border-none print:shadow-none print:bg-transparent'>
      <div className='border-border flex flex-col justify-center border-b px-8 py-6 print:px-0'>
        <TextHeading className='text-xl font-bold'>Itinerary Timeline</TextHeading>
        {isFlexible && flexibleMonths && flexibleMonths.length > 0 && (
          <TextBody className='text-text-muted mt-1 text-sm'>
            Sometime in {flexibleMonths.join(', ')}
          </TextBody>
        )}
      </div>

      <div className='flex-1 overflow-y-auto px-8 py-6 print:overflow-visible print:px-0'>
        {days.map((day, index) => (
          <div key={`day-${day.dayNumber}`} className='relative mb-8'>
            {/* Timeline Vertical Line connecting days */}
            {index !== days.length - 1 && (
              <div className='bg-border absolute top-8 left-[11px] bottom-[-32px] w-[2px]' />
            )}

            <div className='mb-4 flex items-center gap-4'>
              <div className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${getDayColor(day.dayNumber)}`}>
                <span className='text-[11px] font-bold text-white'>{day.dayNumber}</span>
              </div>
              <div>
                <TextHeading className='text-[16px] font-bold'>{day.title}</TextHeading>
                {day.dateString && (
                  <TextBody className='text-text-muted text-[13px] font-medium'>
                    {day.dateString}
                  </TextBody>
                )}
              </div>
            </div>

            <div className='pl-10'>
              {day.items.length === 0 ? (
                <div className='border-border bg-surface text-text-muted rounded-xl border border-dashed px-4 py-3 text-[13px]'>
                  No events planned yet.
                </div>
              ) : (
                <div className='flex flex-col gap-3'>
                  {day.items.map((item, i) => (
                    <Link 
                      href={item.poi?.id ? `/explore?poi=${item.poi.id}` : '#'}
                      key={`item-${item.id || i}`}
                      className='border-border bg-surface hover:bg-surface-light group flex flex-col gap-2 rounded-2xl border p-4 shadow-sm transition-colors print:bg-transparent print:border-none print:shadow-none print:p-0 print:gap-1'
                    >
                      <div className='flex items-start justify-between gap-3 print:flex-row-reverse print:justify-end print:gap-3'>
                        <TextBody className='text-text-main group-hover:text-primary-600 font-semibold transition-colors'>
                          {item.poi?.name || 'Unknown Location'}
                        </TextBody>
                        {item.startTime && (
                          <div className='bg-primary-50 text-primary-700 flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold print:bg-transparent print:text-text-main print:p-0 print:font-bold'>
                            <Clock size={12} className='print:hidden' />
                            <span>{item.startTime}{item.endTime && ` - ${item.endTime}`}</span>
                          </div>
                        )}
                      </div>
                      
                      {item.poi?.location && (
                        <div className='text-text-muted flex items-center gap-1.5 text-[12px]'>
                          <MapPin size={12} className='shrink-0' />
                          <span className='line-clamp-1'>{item.poi.location}</span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
