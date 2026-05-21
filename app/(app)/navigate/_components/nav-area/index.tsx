'use client';

import { useRef, useEffect } from 'react';
import type { POI } from '@/components/map-area/types';
import { MapPin, Navigation, Clock, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getDayColor } from '@/lib/colors';

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
  hoveredPoiId?: string | null;
  onHoverPoi?: (poiId: string | null) => void;
};

export default function NavArea({
  journeys,
  activeJourneyId,
  onSelectJourney,
  journeyDays,
  routeOrderMap,
  isJourneysLoading,
  isJourneyLoading,
  hoveredPoiId,
  onHoverPoi
}: NavAreaProps) {
  const activeJourney = journeys.find(
    journey => journey.id === activeJourneyId
  );
  const resolvedJourney = activeJourney;
  const selectedJourneyId = activeJourneyId;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected tab
  useEffect(() => {
    if (!scrollContainerRef.current || !selectedJourneyId) return;
    const activeTab = scrollContainerRef.current.querySelector('[data-active="true"]');
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedJourneyId]);

  return (
    <div className='flex h-full flex-col bg-background/50 backdrop-blur-md overflow-hidden'>
      {/* Header & Journey Selector */}
      <div className='border-border bg-surface/80 backdrop-blur-xl border-b p-5 pb-0 z-10 shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary-100 text-primary-600 rounded-lg p-2'>
              <Navigation className='w-5 h-5' />
            </div>
            <div>
              <h2 className='text-lg font-bold text-text-main leading-tight'>Navigating</h2>
              <span className='text-text-muted text-xs font-medium uppercase tracking-wider'>Your Journeys</span>
            </div>
          </div>
        </div>

        {isJourneysLoading ? (
          <div className='text-text-muted text-sm pb-5 flex items-center gap-2'>
            <div className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
            Loading journeys...
          </div>
        ) : journeys.length === 0 ? (
          <div className='border-border bg-surface flex flex-col gap-3 rounded-xl border border-dashed p-4 mb-5'>
            <p className='text-sm font-semibold'>No journeys yet</p>
            <p className='text-text-muted text-xs'>
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
          <div className='relative'>
            <p className='text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 pl-1'>Select Journey</p>
            <div 
              ref={scrollContainerRef}
              className='flex gap-2 overflow-x-auto pb-4 scrollbar-invisible scroll-smooth snap-x'
            >
              {journeys.map(journey => {
                const isActive = journey.id === selectedJourneyId;
                return (
                  <button
                    key={journey.id}
                    data-active={isActive}
                    onClick={() => onSelectJourney(journey.id)}
                    className={cn(
                      'whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 snap-center border',
                      isActive 
                        ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-sm ring-1 ring-primary-500/20' 
                        : 'bg-surface hover:bg-surface-light text-text-muted border-border hover:border-text-muted/30'
                    )}
                  >
                    {journey.title}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className='flex-1 overflow-y-auto px-5 py-6 scrollbar-invisible relative'>
        {!activeJourneyId && journeys.length > 0 ? (
          <div className='flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4'>
            <div className='text-center mb-6'>
              <div className='bg-primary-100 text-primary-600 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm'>
                <Navigation className='w-8 h-8' />
              </div>
              <h3 className='text-2xl font-bold text-text-main'>Where to next?</h3>
              <p className='text-text-muted mt-2'>Select a journey above or below to begin navigating.</p>
            </div>
            
            <div className='grid gap-4'>
              {journeys.map((journey) => (
                <button
                  key={journey.id}
                  onClick={() => onSelectJourney(journey.id)}
                  className='text-left border-border hover:border-primary-300 bg-surface/50 hover:bg-surface backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group'
                >
                  <h4 className='text-lg font-bold text-text-main group-hover:text-primary-700 transition-colors'>{journey.title}</h4>
                  <p className='text-text-muted text-sm mt-1 line-clamp-1'>
                    {journey.destination || 'Multiple destinations'}
                  </p>
                  <div className='flex items-center gap-4 mt-4'>
                    <span className='bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full'>
                      Start Journey
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : journeys.length > 0 && activeJourneyId ? (
          <div className='flex flex-col gap-6 relative'>
            <div className='flex items-center justify-between sticky top-0 bg-background z-20 pt-1 pb-3 px-1 border-b border-border shadow-sm -mt-2 mb-2'>
              <div>
                <h3 className='text-lg font-bold text-text-main line-clamp-1'>{resolvedJourney?.title}</h3>
                <span className='text-text-muted text-xs font-medium'>
                  {journeyDays.length} Day{journeyDays.length === 1 ? '' : 's'} Total
                </span>
              </div>
            </div>

            {isJourneyLoading ? (
              <div className='text-text-muted text-sm flex items-center gap-2 justify-center py-10'>
                <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                Plotting route...
              </div>
            ) : journeyDays.length === 0 ? (
              <div className='text-text-muted border-border rounded-xl border border-dashed p-8 text-center text-sm'>
                <MapPin className="w-8 h-8 text-border mx-auto mb-3" />
                No stops scheduled yet. Add places to this journey to build a route.
              </div>
            ) : (
              <div className='relative pl-4 mt-2'>
                {/* Continuous Timeline Background Line */}
                <div className='absolute left-8 top-8 bottom-8 w-0.5 bg-border rounded-full' />

                {journeyDays.map((dayBlock, dayIndex) => {
                  const dayColorClass = getDayColor(dayBlock.dayNumber);
                  
                  return (
                    <div key={dayBlock.id} className='mb-8 relative'>
                      <div className='flex items-center gap-3 text-sm font-bold text-text-main mb-6 bg-surface/80 backdrop-blur-md w-fit pr-4 pl-1 py-1 rounded-full shadow-sm border border-border z-10 relative ml-0.5'>
                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white text-xs', dayColorClass)}>
                          D{dayBlock.dayNumber}
                        </div>
                        {dayBlock.title || `Day ${dayBlock.dayNumber}`}
                        {dayBlock.date && (
                          <span className='text-text-muted font-medium text-xs ml-1 bg-surface-light px-2 py-0.5 rounded-full border border-border/50'>
                            {dayBlock.date}
                          </span>
                        )}
                      </div>

                      {dayBlock.pois.length === 0 ? (
                        <div className='text-text-muted border-border rounded-xl border border-dashed px-4 py-4 text-xs ml-8 bg-surface/50'>
                          No stops scheduled for this day.
                        </div>
                      ) : (
                        <div className='flex flex-col gap-5 ml-8'>
                          {dayBlock.pois.map((poi, index) => {
                            const routeOrder = routeOrderMap[poi.id];
                            const isStart = routeOrder === 1;
                            const displayOrder = routeOrder ?? index + 1;
                            const isHovered = hoveredPoiId === poi.id;
                            const thumbnail = poi.galleries?.[0]?.imageUrl;

                            return (
                              <div
                                key={poi.id}
                                onMouseEnter={() => onHoverPoi?.(poi.id)}
                                onMouseLeave={() => onHoverPoi?.(null)}
                                className={cn(
                                  'group relative flex items-stretch gap-4 rounded-2xl border p-3 transition-all duration-300 cursor-default bg-surface/60 backdrop-blur-sm',
                                  isHovered 
                                    ? 'border-primary-300 shadow-lg scale-[1.02] -translate-y-0.5 bg-surface ring-1 ring-primary-500/20' 
                                    : 'border-border hover:border-primary-200 hover:shadow-md hover:bg-surface'
                                )}
                              >
                                {/* Timeline Node */}
                                <div className='absolute -left-[27px] top-1/2 -translate-y-1/2 z-10'>
                                  <div className={cn(
                                    'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold border-2 border-white shadow-md transition-transform duration-300',
                                    isStart ? 'bg-primary-600 text-white w-7 h-7 -left-[2px] ring-2 ring-primary-500/30' : cn('text-white', dayColorClass),
                                    isHovered ? 'scale-125' : ''
                                  )}>
                                    {displayOrder}
                                  </div>
                                </div>

                                {/* Thumbnail */}
                                <div className='w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-surface-light border border-border/50 flex items-center justify-center'>
                                  {thumbnail ? (
                                    <img src={thumbnail} alt={poi.name} className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110' />
                                  ) : (
                                    <ImageIcon className='w-6 h-6 text-text-muted/40' />
                                  )}
                                </div>

                                {/* Content */}
                                <div className='flex flex-col justify-center py-1 flex-1 min-w-0'>
                                  <div className='flex items-start justify-between gap-2'>
                                    <p className={cn(
                                      'text-sm font-bold line-clamp-1 transition-colors duration-300',
                                      isHovered ? 'text-primary-700' : 'text-text-main'
                                    )}>
                                      {poi.name}
                                    </p>
                                    {isStart && (
                                      <span className='bg-primary-100 text-primary-700 shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full'>
                                        Start
                                      </span>
                                    )}
                                  </div>
                                  
                                  <p className='text-text-muted text-xs line-clamp-2 mt-1 pr-2 leading-relaxed'>
                                    {typeof poi.address === 'string'
                                      ? poi.address
                                      : poi.address
                                        ? `${poi.address.street || ''} ${poi.address.cityMunicipality || ''}`
                                        : 'Address details available'}
                                  </p>

                                  {/* Optional info badges (e.g. Price, Rating, Time) could go here */}
                                  <div className='mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                                    <span className='text-[10px] font-semibold text-primary-600 flex items-center gap-1'>
                                      <MapPin className="w-3 h-3" /> View on Map
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
