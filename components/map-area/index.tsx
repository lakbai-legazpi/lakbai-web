'use client';

import { useEffect, useMemo, useState, useRef, type RefObject } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Binoculars,
  Download,
  Printer
} from 'lucide-react';
import type { MapRef } from '@/components/ui/map';

import PoiMapCanvas from './PoiMapCanvas';
import { usePois } from './use-pois';
import PoiDetailsOverlay from './PoiDetailsOverlay';
import PoiHoverCard from './PoiHoverCard';
import MapLegend from './MapLegend';
import { getTagLabel, getTagVisual } from './get-tag-icon';
import type { POI } from './types';

type MapAreaProps = {
  mode?: 'view' | 'contribute';
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  overlayContainerRef?: RefObject<HTMLElement | null>;
  overridePois?: POI[];
  routeCoordinates?: [number, number][];
  isRoutingActive?: boolean;
  routeOrderMap?: Record<string, number>;
  routeDayMap?: Record<string, number>;
  showLegend?: boolean;
  showExportMap?: boolean;
  journeyTitle?: string;
  hoveredPoiId?: string | null;
  onHoverPoi?: (poiId: string | null) => void;
};

export default function MapArea({
  mode = 'view',
  isExpanded = false,
  onToggleExpand,
  overlayContainerRef,
  overridePois,
  routeCoordinates,
  isRoutingActive = false,
  routeOrderMap,
  routeDayMap,
  showLegend = true,
  showExportMap = false,
  journeyTitle,
  hoveredPoiId,
  onHoverPoi
}: MapAreaProps) {
  const { pois, isLoading: isPoisLoading, refreshPois } = usePois();
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isAddLocationMode, setIsAddLocationMode] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const mapRef = useRef<MapRef | null>(null);
  const legendContainerRef = useRef<HTMLDivElement | null>(null);
  const legendButtonRef = useRef<HTMLButtonElement | null>(null);
  const exportContainerRef = useRef<HTMLDivElement | null>(null);
  const exportButtonRef = useRef<HTMLButtonElement | null>(null);

  // Fallback for dynamically fetching a single shared POI not in local bounds
  const [isolatedPoi, setIsolatedPoi] = useState<POI | null>(null);

  const downloadMapPng = () => {
    const map = mapRef.current;
    if (!map) return;
    const canvas = map.getCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    const filename = journeyTitle
      ? `${journeyTitle.toLowerCase().replace(/\s+/g, "_")}_map.png`
      : "lakbai_route_map.png";
    link.download = filename;
    link.href = dataUrl;
    link.click();
    setIsExportDropdownOpen(false);
  };

  const printMap = () => {
    const map = mapRef.current;
    if (map) {
      map.resize();
    }
    setIsExportDropdownOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  useEffect(() => {
    const handleBeforePrint = () => {
      const map = mapRef.current;
      if (map) {
        map.resize();
      }
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, []);

  useEffect(() => {
    if (!isExportDropdownOpen) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (exportContainerRef.current?.contains(target)) return;
      if (exportButtonRef.current?.contains(target)) return;
      setIsExportDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isExportDropdownOpen]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isContribute = mode === 'contribute';

  const iconTooltipClass =
    'pointer-events-none absolute top-1/2 left-full z-40 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-primary-dark-700 bg-primary-dark-900 px-2.5 py-1.5 text-xs font-medium text-primary-dark-50 opacity-0 shadow-sm transition-opacity group-hover/map-toggle:opacity-100';

  const legendTooltipClass =
    'pointer-events-none absolute top-1/2 right-full z-40 mr-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-primary-dark-700 bg-primary-dark-900 px-2.5 py-1.5 text-xs font-medium text-primary-dark-50 opacity-0 shadow-sm transition-opacity group-hover/map-legend:opacity-100';

  const combinedPois = useMemo(() => {
    // Routing mode: show journey POIs
    if (isRoutingActive && overridePois) {
      // If a POI from URL is not in journey, include it temporarily
      if (isolatedPoi && !overridePois.some(p => p.id === isolatedPoi.id)) {
        return [...overridePois, isolatedPoi];
      }

      return overridePois;
    }

    // Normal mode
    if (isolatedPoi && !pois.some(p => p.id === isolatedPoi.id)) {
      return [...pois, isolatedPoi];
    }

    return pois;
  }, [pois, isolatedPoi, overridePois, isRoutingActive]);

  const selectedPoi = useMemo(
    () => combinedPois.find(poi => poi.id === selectedPoiId) ?? null,
    [combinedPois, selectedPoiId]
  );

  const shareUrl = useMemo(() => {
    if (!selectedPoiId) return '';
    if (typeof window === 'undefined')
      return `${pathname}?poi=${selectedPoiId}`;
    return `${window.location.origin}${pathname}?poi=${selectedPoiId}`;
  }, [pathname, selectedPoiId]);

  const updatePoiInUrl = (poiId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (poiId) {
      params.set('poi', poiId);
    } else {
      params.delete('poi');
    }

    const nextQuery = params.toString();
    const nextPath = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextPath, { scroll: false });
  };

  const handleOpenPoi = (poiId: string) => {
    // If contributing and adding location, don't open details
    if (isContribute && isAddLocationMode) return;
    setSelectedPoiId(poiId);
    updatePoiInUrl(poiId);
  };

  const handleClosePoi = () => {
    setSelectedPoiId(null);
    updatePoiInUrl(null);
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl || typeof navigator === 'undefined') return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy URL', error);
    }
  };

  useEffect(() => {
    if (!isContribute) return;
    const canvas = mapRef.current?.getCanvas();
    if (!canvas) return;

    canvas.style.cursor = isAddLocationMode ? 'crosshair' : '';

    return () => {
      if (canvas.style.cursor === 'crosshair') {
        canvas.style.cursor = '';
      }
    };
  }, [isAddLocationMode, isContribute]);

  useEffect(() => {
    if (!isLegendOpen) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (legendContainerRef.current?.contains(target)) return;
      if (legendButtonRef.current?.contains(target)) return;
      setIsLegendOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isLegendOpen]);

  // Handle URL sync and dynamic fetching of shared isolated POIs
  useEffect(() => {
    const poiFromUrl = searchParams.get('poi');

    if (!poiFromUrl) {
      setSelectedPoiId(null);
      return;
    }

    // Wait until initial batch fetch finishes to check if isolated
    if (isPoisLoading) return;

    const existsInBatch = pois.some(poi => poi.id === poiFromUrl);

    if (existsInBatch) {
      setSelectedPoiId(poiFromUrl);
    } else {
      // Dynamic hydration logic for isolated POIs
      fetch(`/api/pois/${poiFromUrl}`)
        .then(res => {
          if (!res.ok) throw new Error('Dynamic POI fetch failed');
          return res.json();
        })
        .then(data => {
          if (data.poi) {
            // Normalize to match types
            const p = data.poi;
            setIsolatedPoi({
              ...p,
              latitude: Number(p.latitude),
              longitude: Number(p.longitude),
              vouchCount: Number(p.vouchCount),
              priceLevel: p.priceLevel ?? null,
              primaryTagId: p.primaryTagId ?? null,
              tags: p.tags || [],
              galleries: p.galleries || [],
              address: p.address || null,
              operatingHours: p.operatingHours || [],
              phoneNumber: p.phoneNumber ?? null,
              email: p.email ?? null,
              links: p.links || [],
              reviews: p.reviews || []
            });
            setSelectedPoiId(poiFromUrl);
          } else {
            setSelectedPoiId(null);
          }
        })
        .catch(err => {
          console.error(err);
          setSelectedPoiId(null);
        });
    }
  }, [pois, searchParams, isPoisLoading]);

  return (
    <div className='relative flex h-full w-full flex-col'>
      {!isContribute && onToggleExpand && (
        <div className='absolute top-4 left-4 z-30'>
          <button
            type='button'
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Collapse map' : 'Expand map'}
            className='group/map-toggle border-border bg-background/95 text-text-main hover:bg-surface-light relative flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition'
          >
            {isExpanded ? (
              <ArrowRightFromLine className='h-4 w-4' />
            ) : (
              <ArrowLeftFromLine className='h-4 w-4' />
            )}
            <span className={iconTooltipClass}>
              {isExpanded ? 'Collapse' : 'Expand'}
            </span>
          </button>
        </div>
      )}

      {((showLegend && !isAddLocationMode) || showExportMap) && (
        <div className='absolute top-4 right-4 z-30 flex flex-col items-end gap-3 print:hidden'>
          {showLegend && !isAddLocationMode && (
            <div className="relative">
              <button
                type='button'
                onClick={() => setIsLegendOpen(previous => !previous)}
                aria-label='Toggle map legends'
                aria-pressed={isLegendOpen}
                ref={legendButtonRef}
                className='group/map-legend border-border bg-background/95 text-text-main hover:bg-surface-light relative flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition cursor-pointer'
              >
                <Binoculars className='h-4 w-4' />
                <span className={legendTooltipClass}>Map Legends</span>
              </button>
              {isLegendOpen && (
                <div ref={legendContainerRef} className="absolute right-0 top-11 z-50">
                  <MapLegend className='w-56' />
                </div>
              )}
            </div>
          )}

          {showExportMap && (
            <div className="relative" ref={exportContainerRef}>
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen(prev => !prev)}
                aria-label="Export map options"
                aria-pressed={isExportDropdownOpen}
                ref={exportButtonRef}
                className="group/map-export border-border bg-background/95 text-text-main hover:bg-surface-light relative flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span className={legendTooltipClass.replace('map-legend', 'map-export')}>Export Map</span>
              </button>

              {isExportDropdownOpen && (
                <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-border bg-background p-3 shadow-lg flex flex-col gap-2">
                  <p className="text-xs font-semibold text-text-main pb-1 border-b">Export Options</p>
                  
                  <button
                    onClick={printMap}
                    className="flex items-center gap-2 rounded-lg p-2 text-left text-xs font-medium hover:bg-surface-light transition text-text-main cursor-pointer"
                  >
                    <Printer className="h-4 w-4 text-primary-500 shrink-0" />
                    <div className="flex flex-col">
                      <span>Print Map / Save PDF</span>
                      <span className="text-[10px] text-text-muted">Includes route line & POI markers</span>
                    </div>
                  </button>

                  <button
                    onClick={downloadMapPng}
                    className="flex items-center gap-2 rounded-lg p-2 text-left text-xs font-medium hover:bg-surface-light transition text-text-main cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-primary-500 shrink-0" />
                    <div className="flex flex-col">
                      <span>Download PNG Image</span>
                      <span className="text-[10px] text-text-muted">Map canvas and route line only</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <PoiMapCanvas
        pois={combinedPois}
        routeOrderMap={routeOrderMap}
        mapRef={mapRef}
        selectedPoiId={selectedPoiId}
        onMarkerClick={poi => handleOpenPoi(poi.id)}
        hoveredPoiId={hoveredPoiId}
        onHoverPoi={onHoverPoi}
        routeCoordinates={routeCoordinates}
        isRoutingActive={isRoutingActive}
        routeDayMap={routeDayMap}
        mapClassName={
          isContribute && isAddLocationMode
            ? '[&_.maplibregl-canvas]:cursor-crosshair'
            : ''
        }
        controlsClassName={isContribute ? '[&_button]:cursor-default' : ''}
        markerContentClassName={
          isContribute && isAddLocationMode ? 'cursor-default' : ''
        }
        renderHoverPopup={
          !isContribute || !isAddLocationMode
            ? poi => (
                <PoiHoverCard
                  poi={poi}
                  onFavorite={id => console.log('Favorited', id)}
                  onAdd={id => handleOpenPoi(id)}
                />
              )
            : undefined
        }
      />

      {selectedPoi && !isAddLocationMode && (
        <PoiDetailsOverlay
          poi={selectedPoi as any}
          copied={copied}
          onClose={handleClosePoi}
          onCopyShareUrl={handleCopyShareUrl}
          onReviewSubmitted={() => {
            void refreshPois();
          }}
          portalContainer={overlayContainerRef?.current}
          panelMode={isContribute}
        />
      )}
    </div>
  );
}
