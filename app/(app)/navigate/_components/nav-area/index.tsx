'use client';

import type { POI } from '@/components/map-area/types';

type JourneyDayResolved = {
  id: string;
  dayNumber: number;
  date?: string;
  pois: POI[];
};

type NavAreaProps = {
  journeyDays: JourneyDayResolved[];
};

export default function NavArea({ journeyDays }: NavAreaProps) {
  return (
    <div className='flex h-full flex-col gap-6 overflow-y-auto p-4'>
      {/* Itinerary */}
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Itinerary</h2>
          <span className='text-muted-foreground text-sm'>
            {journeyDays.length} days
          </span>
        </div>

        {journeyDays.map(dayBlock => (
          <div key={dayBlock.dayNumber} className='flex flex-col gap-3'>
            {/* Day Header */}
            <div className='flex items-center gap-2 text-sm font-medium'>
              <span>Day {dayBlock.dayNumber}</span>
              <span className='text-muted-foreground'>{dayBlock.date}</span>
            </div>

            {/* POIs */}
            {dayBlock.pois.map((poi, index) => {
              return (
                <div
                  key={poi.id}
                  className='flex items-center justify-between rounded-xl border p-3'
                >
                  <div className='flex items-center gap-3'>
                    {/* Step Number */}
                    <div className='flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white'>
                      {index + 1}
                    </div>

                    {/* POI Info */}
                    <div>
                      <p className='text-sm font-medium'>{poi.name}</p>
                      <p className='text-muted-foreground text-xs'>
                        {typeof poi.address === 'string'
                          ? poi.address
                          : poi.address
                            ? 'Address available'
                            : 'No address'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
