'use client';

import { type ReactNode, type RefObject } from 'react';

import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerHoverPopup,
  MapRoute,
  type MapRef
} from '@/components/ui/map';
import { cn } from '@/lib/cn';

import { LEGAZPI_MAP_CENTER, MAP_LIGHT_STYLE_URL } from './constants';
import { getTagIcon } from './get-tag-icon';
import { getDayColor } from '@/lib/colors';
import type { POI } from './types';

type PoiMapCanvasProps = {
  pois: POI[];
  center?: [number, number];
  zoom?: number;
  mapRef?: RefObject<MapRef | null>;
  mapClassName?: string;
  controlsClassName?: string;
  markerContentClassName?: string;
  markerCircleClassName?: string;
  showControls?: boolean;
  selectedPoiId?: string | null;
  routeCoordinates?: [number, number][];
  isRoutingActive?: boolean;
  routeOrderMap?: Record<string, number>;
  routeDayMap?: Record<string, number>;
  hoveredPoiId?: string | null;
  onHoverPoi?: (poiId: string | null) => void;
  onMarkerClick?: (poi: POI) => void;
  renderPopup?: (poi: POI) => ReactNode;
  renderHoverPopup?: (poi: POI) => ReactNode;
};

export default function PoiMapCanvas({
  pois,
  center,
  zoom = 12,
  routeCoordinates,
  isRoutingActive = false,
  routeOrderMap,
  routeDayMap,
  mapRef,
  mapClassName,
  controlsClassName,
  markerContentClassName,
  markerCircleClassName,
  showControls = true,
  selectedPoiId,
  hoveredPoiId,
  onHoverPoi,
  onMarkerClick,
  renderPopup,
  renderHoverPopup
}: PoiMapCanvasProps) {
  const resolvedCenter =
    center ??
    (pois.length > 0
      ? [pois[0].longitude, pois[0].latitude]
      : LEGAZPI_MAP_CENTER);

  return (
    <Map
      ref={mapRef}
      className={mapClassName}
      center={resolvedCenter}
      zoom={zoom}
      theme='light'
      styles={{ light: MAP_LIGHT_STYLE_URL }}
    >
      {isRoutingActive && routeCoordinates && (
        <MapRoute
          coordinates={routeCoordinates}
          color='#0ea5e9'
          width={6}
          opacity={0.9}
        />
      )}

      {showControls && <MapControls className={controlsClassName} />}

      {pois.map(poi => {
        const { icon: Icon, color } = getTagIcon(
          poi.tags || [],
          poi.primaryTagId
        );
        const isSelected = selectedPoiId === poi.id;
        const routeOrder = routeOrderMap?.[poi.id];
        const dayNumber = routeDayMap?.[poi.id];
        const isFirstRoute = routeOrder === 1;
        const dynamicColor = dayNumber ? getDayColor(dayNumber) : color;

        return (
          <MapMarker
            key={poi.id}
            longitude={poi.longitude}
            latitude={poi.latitude}
            onClick={onMarkerClick ? () => onMarkerClick(poi) : undefined}
          >
            <MarkerContent
              className={cn(
                onMarkerClick ? undefined : 'cursor-default',
                markerContentClassName
              )}
            >
              <div
                onMouseEnter={onHoverPoi ? () => onHoverPoi(poi.id) : undefined}
                onMouseLeave={onHoverPoi ? () => onHoverPoi(null) : undefined}
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lg transition-all duration-300',
                  markerCircleClassName ?? dynamicColor,
                  (isSelected || hoveredPoiId === poi.id) ? 'scale-125 ring-primary-500 ring-2 ring-offset-1 z-50' : 'hover:scale-110'
                )}
              >
                {isFirstRoute && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-primary-500 opacity-50"></div>
                )}
                {isRoutingActive ? (
                  <span className='text-xs font-bold text-white'>
                    {routeOrder ?? ''}
                  </span>
                ) : (
                  <Icon className='h-4 w-4 text-white' />
                )}
              </div>
            </MarkerContent>

            {renderPopup && (
              <MarkerPopup className='flex w-50 flex-col gap-1 p-4'>
                {renderPopup(poi)}
              </MarkerPopup>
            )}

            {renderHoverPopup && (
              <MarkerHoverPopup delay={300}>
                {renderHoverPopup(poi)}
              </MarkerHoverPopup>
            )}
          </MapMarker>
        );
      })}
    </Map>
  );
}
