'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { cn } from '@/lib/cn';
import NavArea from './_components/nav-area';
import MapArea from '@/components/map-area';
import { usePois } from '@/components/map-area/use-pois';
import type { POI } from '@/components/map-area/types';

export default function NavigatePage() {
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const { pois } = usePois();
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(
    []
  );

  type JourneyDay = {
    id: string;
    dayNumber: number;
    date?: string;
    pois: {
      id: string;
    }[];
  };

  const [journeyDays, setJourneyDays] = useState<JourneyDay[]>([
    {
      id: 'day-1',
      dayNumber: 1,
      date: 'Tue, Jul 21',
      pois: [
        { id: 'cmod13rjk000234i4c8qz95xl' },
        { id: 'cmod145b5001634i439yccb28' }
      ]
    },
    {
      id: 'day-2',
      dayNumber: 2,
      date: 'Wed, Jul 22',
      pois: [{ id: 'cmod13ub6000a34i41kjxja3d' }]
    }
  ]);

  const poiMap = useMemo(() => {
    return new Map(pois.map(p => [p.id, p]));
  }, [pois]);

  const journeyPois = useMemo(() => {
    return journeyDays.flatMap(day =>
      day.pois.map(p => poiMap.get(p.id)).filter((p): p is POI => Boolean(p))
    );
  }, [journeyDays, poiMap]);

  const resolvedJourneyDays = useMemo(() => {
    return journeyDays.map(day => ({
      ...day,
      pois: day.pois
        .map(p => poiMap.get(p.id))
        .filter((p): p is POI => Boolean(p))
    }));
  }, [journeyDays, poiMap]);

  const routeOrderMap = useMemo(() => {
    const map: Record<string, number> = {};
    let counter = 1;

    journeyDays.forEach(day => {
      day.pois.forEach(p => {
        map[p.id] = counter++;
      });
    });

    return map;
  }, [journeyDays]);

  const journeyKey = useMemo(() => {
    return journeyPois.map(p => p.id).join('-');
  }, [journeyPois]);

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
  }, [journeyKey]);

  return (
    <div
      ref={contentContainerRef}
      className='relative flex h-full w-full overflow-hidden'
    >
      {/* Nav Area (40%) */}
      <div
        className={cn(
          'bg-surface border-border h-full transition-all duration-300 ease-in-out',
          isMapExpanded
            ? 'pointer-events-none w-0 overflow-hidden border-r-0 opacity-0'
            : 'w-[40%] border-r opacity-100'
        )}
      >
        <NavArea journeyDays={resolvedJourneyDays} />
      </div>

      {/* Map Area (60%) */}
      <div className='bg-surface-light h-full w-[60%] flex-1'>
        <MapArea
          isExpanded={isMapExpanded}
          onToggleExpand={() => setIsMapExpanded(prev => !prev)}
          overlayContainerRef={contentContainerRef}
          overridePois={journeyPois}
          routeCoordinates={routeCoordinates}
          isRoutingActive={true}
          routeOrderMap={routeOrderMap}
        />
      </div>
    </div>
  );
}
