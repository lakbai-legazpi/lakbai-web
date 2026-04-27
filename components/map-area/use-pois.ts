'use client';

import { useCallback, useEffect, useState } from 'react';

import type { POI } from './types';

type UsePoisResult = {
  pois: POI[];
  isLoading: boolean;
  error: string | null;
  refreshPois: () => Promise<void>;
};

function normalizePoi(poi: Partial<POI>): POI {
  return {
    id: poi.id ?? '',
    name: poi.name ?? '',
    description: poi.description ?? '',
    latitude: Number(poi.latitude ?? 0),
    longitude: Number(poi.longitude ?? 0),
    vouchCount: Number(poi.vouchCount ?? 0),
    primaryTagId: poi.primaryTagId ?? null,
    tags: poi.tags ?? [],
    galleries: poi.galleries ?? [],
    address: poi.address ?? null,
    operatingHours: poi.operatingHours ?? [],
    phoneNumber: (poi as any).phoneNumber ?? null,
    email: (poi as any).email ?? null,
    links: (poi as any).links ?? [],
    reviews: (poi as any).reviews ?? [],
  };
}

export function usePois(): UsePoisResult {
  const [pois, setPois] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPois = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/pois');
      if (!res.ok) {
        throw new Error('Failed to fetch POIs');
      }

      const data = (await res.json()) as { pois?: Partial<POI>[] };
      const normalized = (data.pois ?? []).map(normalizePoi);
      setPois(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load POIs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPois();
  }, [refreshPois]);

  return {
    pois,
    isLoading,
    error,
    refreshPois,
  };
}
