'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import NavArea from './_components/nav-area';
import MapArea from '@/components/map-area';
import type { POI } from '@/components/map-area/types';

type JourneySummary = {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
};

type JourneyDetail = {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  days: {
    id: string;
    dayNumber: number;
    title: string | null;
  }[];
  itineraryItems: JourneyItineraryItem[];
};

type JourneyItineraryItem = {
  id: string;
  dayNumber: number | null;
  orderIndex: number;
  startTime: string | null;
  poi: POI;
};

type JourneyDayResolved = {
  id: string;
  dayNumber: number;
  title: string | null;
  date?: string;
  pois: POI[];
};

const formatJourneyDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

const normalizePoi = (poi: POI): POI => ({
  ...poi,
  latitude: Number(poi.latitude),
  longitude: Number(poi.longitude),
  vouchCount: Number(poi.vouchCount),
  priceLevel: poi.priceLevel ?? null,
  primaryTagId: poi.primaryTagId ?? null,
  tags: poi.tags || [],
  galleries: poi.galleries || [],
  address: poi.address || null,
  operatingHours: poi.operatingHours || [],
  phoneNumber: poi.phoneNumber ?? null,
  email: poi.email ?? null,
  links: poi.links || [],
  reviews: poi.reviews || []
});

const compareItineraryItems = (
  a: JourneyItineraryItem,
  b: JourneyItineraryItem
) => {
  const dayA = a.dayNumber ?? Number.MAX_SAFE_INTEGER;
  const dayB = b.dayNumber ?? Number.MAX_SAFE_INTEGER;
  if (dayA !== dayB) return dayA - dayB;

  if (a.startTime && b.startTime) {
    return a.startTime.localeCompare(b.startTime);
  }

  if (a.startTime) return -1;
  if (b.startTime) return 1;

  return a.orderIndex - b.orderIndex;
};

export default function NavigatePage() {
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(
    []
  );
  const [journeys, setJourneys] = useState<JourneySummary[]>([]);
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  const [activeJourney, setActiveJourney] = useState<JourneyDetail | null>(
    null
  );
  const [isJourneysLoading, setIsJourneysLoading] = useState(true);
  const [isJourneyLoading, setIsJourneyLoading] = useState(false);

  const journeyParam = searchParams.get('journey');

  useEffect(() => {
    let isActive = true;

    async function fetchJourneys() {
      setIsJourneysLoading(true);
      try {
        const res = await fetch('/api/journeys');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!isActive) return;
        setJourneys(data.journeys || []);
      } catch (err) {
        console.error('Failed to load journeys', err);
        if (isActive) setJourneys([]);
      } finally {
        if (isActive) setIsJourneysLoading(false);
      }
    }

    fetchJourneys();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (journeys.length === 0) {
      setActiveJourneyId(null);
      setActiveJourney(null);
      return;
    }

    if (journeyParam && journeys.some(journey => journey.id === journeyParam)) {
      setActiveJourneyId(journeyParam);
      return;
    }

    if (
      !activeJourneyId ||
      !journeys.some(journey => journey.id === activeJourneyId)
    ) {
      setActiveJourneyId(journeys[0]?.id ?? null);
    }
  }, [journeys, journeyParam, activeJourneyId]);

  useEffect(() => {
    if (!activeJourneyId) {
      setActiveJourney(null);
      return;
    }

    let isActive = true;

    async function fetchJourney() {
      setActiveJourney(null);
      setIsJourneyLoading(true);
      try {
        const res = await fetch(`/api/journeys/${activeJourneyId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!isActive) return;
        setActiveJourney(data.journey ?? null);
      } catch (err) {
        console.error('Failed to load journey', err);
        if (isActive) setActiveJourney(null);
      } finally {
        if (isActive) setIsJourneyLoading(false);
      }
    }

    fetchJourney();

    return () => {
      isActive = false;
    };
  }, [activeJourneyId]);

  const normalizedItineraryItems = useMemo(() => {
    if (!activeJourney?.itineraryItems?.length) return [];
    return activeJourney.itineraryItems.map(item => ({
      ...item,
      poi: normalizePoi(item.poi)
    }));
  }, [activeJourney]);

  const orderedItems = useMemo(() => {
    const scheduledItems = normalizedItineraryItems.filter(
      item => item.dayNumber !== null
    );
    return [...scheduledItems].sort(compareItineraryItems);
  }, [normalizedItineraryItems]);

  const journeyPois = useMemo(() => {
    const seen = new Set<string>();
    const unique: POI[] = [];
    orderedItems.forEach(item => {
      if (seen.has(item.poi.id)) return;
      seen.add(item.poi.id);
      unique.push(item.poi);
    });
    return unique;
  }, [orderedItems]);

  const resolvedJourneyDays = useMemo<JourneyDayResolved[]>(() => {
    if (!activeJourney) return [];

    const groupedItems = new Map<number, JourneyItineraryItem[]>();
    orderedItems.forEach(item => {
      if (item.dayNumber === null) return;
      const list = groupedItems.get(item.dayNumber) ?? [];
      list.push(item);
      groupedItems.set(item.dayNumber, list);
    });

    groupedItems.forEach(items => items.sort(compareItineraryItems));

    const daysSource = activeJourney.days.length
      ? activeJourney.days
      : Array.from(groupedItems.keys())
          .sort((a, b) => a - b)
          .map(dayNumber => ({
            id: `day-${dayNumber}`,
            dayNumber,
            title: `Day ${dayNumber}`
          }));

    const startDate = activeJourney.startDate
      ? new Date(activeJourney.startDate)
      : null;

    return daysSource
      .slice()
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map(day => {
        const date = startDate
          ? formatJourneyDate(
              new Date(startDate.getTime() + (day.dayNumber - 1) * 86400000)
            )
          : undefined;
        return {
          id: day.id,
          dayNumber: day.dayNumber,
          title: day.title,
          date,
          pois: (groupedItems.get(day.dayNumber) ?? []).map(item => item.poi)
        };
      });
  }, [activeJourney, orderedItems]);

  const routeOrderMap = useMemo(() => {
    const map: Record<string, number> = {};
    orderedItems.forEach((item, index) => {
      if (map[item.poi.id]) return;
      map[item.poi.id] = index + 1;
    });
    return map;
  }, [orderedItems]);

  const routeDayMap = useMemo(() => {
    const map: Record<string, number> = {};
    orderedItems.forEach(item => {
      if (map[item.poi.id] || item.dayNumber === null) return;
      map[item.poi.id] = item.dayNumber;
    });
    return map;
  }, [orderedItems]);

  const journeyKey = useMemo(() => {
    const ids = journeyPois.map(p => p.id).join('-');
    return activeJourneyId ? `${activeJourneyId}-${ids}` : ids;
  }, [activeJourneyId, journeyPois]);

  const handleSelectJourney = (journeyId: string) => {
    setActiveJourneyId(journeyId);
    const params = new URLSearchParams(searchParams.toString());
    params.set('journey', journeyId);
    router.replace(`?${params.toString()}`, {
      scroll: false
    });
  };

  useEffect(() => {
    if (journeyPois.length < 2) {
      setRouteCoordinates([]);
      return;
    }

    const fallbackRoute = journeyPois.map(
      p => [p.longitude, p.latitude] as [number, number]
    );

    async function fetchRoute() {
      try {
        const coordinatesString = journeyPois
          .map(p => `${p.longitude},${p.latitude}`)
          .join(';');

        console.log('Fetching route:', coordinatesString);

        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (data.routes?.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: number[]) => [lng, lat] as [number, number]
          );

          setRouteCoordinates(coords);
        } else {
          setRouteCoordinates(fallbackRoute);
        }
      } catch (err) {
        console.error('OSRM failed, using fallback:', err);

        setRouteCoordinates(fallbackRoute);
      }
    }

    fetchRoute();
  }, [journeyKey, journeyPois]);

  return (
    <div
      ref={contentContainerRef}
      className='relative flex h-full w-full overflow-hidden print:overflow-visible print:h-auto'
    >
      {/* Nav Area (40%) */}
      <div
        className={cn(
          'bg-surface border-border h-full transition-all duration-300 ease-in-out print:hidden',
          isMapExpanded
            ? 'pointer-events-none w-0 overflow-hidden border-r-0 opacity-0'
            : 'w-[40%] border-r opacity-100'
        )}
      >
        <NavArea
          journeys={journeys}
          activeJourneyId={activeJourneyId}
          onSelectJourney={handleSelectJourney}
          journeyDays={resolvedJourneyDays}
          routeOrderMap={routeOrderMap}
          isJourneysLoading={isJourneysLoading}
          isJourneyLoading={isJourneyLoading}
        />
      </div>

      {/* Map Area (60%) */}
      <div className='bg-surface-light h-full w-[60%] flex-1 print:w-full print:h-[100vh] print:absolute print:inset-0 print:z-50'>
        <MapArea
          isExpanded={isMapExpanded}
          onToggleExpand={() => setIsMapExpanded(prev => !prev)}
          overlayContainerRef={contentContainerRef}
          overridePois={journeyPois}
          routeCoordinates={routeCoordinates}
          isRoutingActive={true}
          routeOrderMap={routeOrderMap}
          routeDayMap={routeDayMap}
          showLegend={false}
          showExportMap={true}
          journeyTitle={activeJourney?.title}
        />
      </div>
    </div>
  );
}
