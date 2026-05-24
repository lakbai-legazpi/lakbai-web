'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Plus,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { TextHeading, TextBody } from '@/components/text';
import { getPrimaryTag, getTagIcon } from './get-tag-icon';
import type { POI } from './types';

interface PoiHoverCardProps {
  poi: POI;
  onFavorite?: (poiId: string) => void;
  onAdd?: (poiId: string) => void;
  onClick?: (poiId: string) => void;
}

export default function PoiHoverCard({
  poi,
  onFavorite,
  onAdd,
  onClick
}: PoiHoverCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = useMemo(
    () =>
      (poi.galleries || []).filter(
        image => Boolean(image?.imageUrl) && image.imageUrl.trim().length > 0
      ),
    [poi.galleries]
  );

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [poi.id]);

  useEffect(() => {
    if (images.length === 0) {
      setCurrentImageIndex(0);
      return;
    }

    if (currentImageIndex > images.length - 1) {
      setCurrentImageIndex(images.length - 1);
    }
  }, [images.length, currentImageIndex]);

  const detailAddress = poi.address
    ? [poi.address.cityMunicipality, poi.address.province]
        .filter(Boolean)
        .join(', ') || 'Unknown Location'
    : 'Unknown Location';

  const { icon: TagIcon } = getTagIcon(poi.tags || [], poi.primaryTagId);
  const primaryTag = getPrimaryTag(poi.tags || [], poi.primaryTagId);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex(prev =>
      prev === 0 ? Math.max(0, images.length - 1) : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div 
      className={cn(
        'bg-background flex w-64 flex-col overflow-hidden transition-shadow',
        onClick && 'cursor-pointer hover:shadow-lg'
      )}
      onClick={() => onClick?.(poi.id)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(poi.id);
        }
      }}
    >
      {/* Top Half: Image Gallery Wrapper */}
      <div className='group relative h-40 w-full shrink-0 overflow-hidden'>
        {images.length > 0 ? (
          <img
            key={`${poi.id}-${images[currentImageIndex].id || images[currentImageIndex].imageUrl}-${currentImageIndex}`}
            src={images[currentImageIndex].imageUrl}
            alt={poi.name}
            className='h-full w-full object-cover'
          />
        ) : (
          <div className='bg-muted flex h-full w-full items-center justify-center'>
            <span className='text-muted-foreground text-xs'>No image</span>
          </div>
        )}

        {/* Overlay Gradients */}
        <div className='pointer-events-none absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-transparent' />
        <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent' />

        {/* Action Buttons */}
        <div className='absolute top-2 right-2 z-10 flex gap-1.5'>
          <button
            type='button'
            onClick={e => {
              e.stopPropagation();
              onFavorite?.(poi.id);
            }}
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className='flex h-7 w-7 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition hover:bg-black/50'
          >
            <Bookmark className='h-4 w-4 text-white' />
          </button>
          <button
            type='button'
            onClick={e => {
              e.stopPropagation();
              onAdd?.(poi.id);
            }}
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className='flex h-7 w-7 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition hover:bg-black/50'
          >
            <Plus className='h-4 w-4 text-white' />
          </button>
        </div>

        {/* Gallery Controls (Shown on hover) */}
        {images.length > 1 && (
          <>
            <button
              type='button'
              onClick={handlePrevImage}
              onMouseDown={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className='absolute top-1/2 left-1 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100 hover:bg-black/50'
            >
              <ChevronLeft className='h-4 w-4' />
            </button>
            <button
              type='button'
              onClick={handleNextImage}
              onMouseDown={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className='absolute top-1/2 right-1 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100 hover:bg-black/50'
            >
              <ChevronRight className='h-4 w-4' />
            </button>

            {/* Pagination Dots */}
            <div className='absolute right-0 bottom-2 left-0 flex justify-center gap-1'>
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-all',
                    currentImageIndex === idx ? 'bg-white' : 'bg-white/50'
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom Half: Details */}
      <div className='flex flex-col gap-1.5 p-3'>
        <div className='border-border/50 flex items-start justify-between gap-2 border-b pb-2'>
          <TextHeading className='line-clamp-2 flex-1 text-sm leading-tight font-bold'>
            {poi.name}
          </TextHeading>
          <div className='flex shrink-0 items-center gap-0.5 text-xs font-semibold'>
            <Star className='h-3 w-3 fill-current' />
            {/* hardcoded placeholder similar to PoiDetailsOverlay */}
            4.6{' '}
            <span className='text-muted-foreground font-normal'>
              ({poi.vouchCount})
            </span>
          </div>
        </div>

        <div className='flex flex-col gap-0.5'>
          <div className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium'>
            {TagIcon && <TagIcon className='h-3.5 w-3.5' />}
            {primaryTag ? primaryTag.name : 'Location'}
          </div>

          <div className='text-muted-foreground line-clamp-1 flex items-center gap-1 text-xs'>
            <MapPin className='h-3 w-3 shrink-0' />
            {detailAddress}
          </div>
        </div>

        {poi.description && (
          <TextBody className='text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed'>
            {poi.description}
          </TextBody>
        )}
      </div>
    </div>
  );
}
