'use client';

import type { POI } from '@/components/map-area/types';

type JourneySummary = {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
};

type JourneyDayResolved = {
  id: string;
  dayNumber: number;
  title: string | null;
  date?: string;
  pois: POI[];
};

type NavAreaProps = {
  journeys: JourneySummary[];
  activeJourneyId: string | null;
  onSelectJourney: (journeyId: string) => void;
  journeyDays: JourneyDayResolved[];
  routeOrderMap: Record<string, number>;
  isJourneysLoading: boolean;
  isJourneyLoading: boolean;
};

export default function NavArea({
  journeys,
  activeJourneyId,
  onSelectJourney,
  journeyDays,
  routeOrderMap,
  isJourneysLoading,
  isJourneyLoading
}: NavAreaProps) {
  const activeJourney = journeys.find(
    journey => journey.id === activeJourneyId
  );
  const resolvedJourney = activeJourney ?? journeys[0];
  const selectedJourneyId = activeJourneyId ?? journeys[0]?.id ?? '';

  return (
    <div className='flex h-full flex-col gap-6 overflow-y-auto p-4'>
      <div className='border-border bg-background flex flex-col gap-3 rounded-2xl border p-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Navigation</h2>
          <span className='text-muted-foreground text-xs'>Active journey</span>
        </div>

        {isJourneysLoading ? (
          <div className='text-muted-foreground text-sm'>
            Loading journeys...
          </div>
        ) : journeys.length === 0 ? (
          <div className='border-border bg-surface flex flex-col gap-3 rounded-xl border border-dashed p-4'>
            <p className='text-sm font-semibold'>No journeys yet</p>
            <p className='text-muted-foreground text-xs'>
              Create a journey to start navigating between points.
            </p>
            <a
              href='/chat'
              className='bg-primary-600 hover:bg-primary-700 w-fit rounded-lg px-3 py-2 text-xs font-semibold text-white transition'
            >
              Create a journey
            </a>
          </div>
        ) : (
          <div className='flex flex-col gap-2'>
            <select
              value={selectedJourneyId}
              onChange={event =>
                event.target.value && onSelectJourney(event.target.value)
              }
              className='border-border bg-background text-text-main focus-visible:ring-primary-500 w-full rounded-xl border px-3 py-2 text-sm font-medium shadow-sm focus-visible:ring-2 focus-visible:outline-none'
            >
              {journeys.map(journey => (
                <option key={journey.id} value={journey.id}>
                  {journey.title}
                </option>
              ))}
            </select>
            <div className='text-muted-foreground text-xs'>
              Showing itinerary for {resolvedJourney?.title ?? 'your journey'}
            </div>
          </div>
        )}
      </div>

      {journeys.length > 0 && activeJourneyId ? (
        <div className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Itinerary</h3>
            <span className='text-muted-foreground text-sm'>
              {journeyDays.length} day{journeyDays.length === 1 ? '' : 's'}
            </span>
          </div>

          {isJourneyLoading ? (
            <div className='text-muted-foreground text-sm'>
              Loading itinerary...
            </div>
          ) : journeyDays.length === 0 ? (
            <div className='text-muted-foreground border-border rounded-xl border border-dashed p-4 text-sm'>
              No stops yet. Add POIs to your journey to see the route.
            </div>
          ) : (
            journeyDays.map(dayBlock => (
              <div key={dayBlock.id} className='flex flex-col gap-3'>
                <div className='flex items-center gap-2 text-sm font-medium'>
                  <span>{dayBlock.title || `Day ${dayBlock.dayNumber}`}</span>
                  {dayBlock.date && (
                    <span className='text-muted-foreground'>
                      {dayBlock.date}
                    </span>
                  )}
                </div>

                {dayBlock.pois.length === 0 ? (
                  <div className='text-muted-foreground border-border rounded-xl border border-dashed px-3 py-3 text-xs'>
                    No stops scheduled for this day.
                  </div>
                ) : (
                  dayBlock.pois.map((poi, index) => {
                    const routeOrder = routeOrderMap[poi.id];
                    const isStart = routeOrder === 1;
                    const displayOrder = routeOrder ?? index + 1;

                    return (
                      <div
                        key={poi.id}
                        className='flex items-center justify-between rounded-xl border p-3'
                      >
                        <div className='flex items-center gap-3'>
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                              isStart
                                ? 'bg-primary-600 text-white'
                                : 'bg-surface-light text-text-main border-border border'
                            }`}
                          >
                            {displayOrder}
                          </div>

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

                        {isStart && (
                          <span className='text-primary-600 text-[10px] font-semibold uppercase'>
                            Start
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
