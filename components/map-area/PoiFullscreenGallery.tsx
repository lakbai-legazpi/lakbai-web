'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Share2 } from 'lucide-react';
import { PoiActionButtons } from './PoiActionButtons';

import type { POIGallery } from '@/components/map-area/types';

type PoiFullscreenGalleryProps = {
  isOpen: boolean;
  poiId: string;
  title: string;
  images: POIGallery[];
  onClose: () => void;
  onShare?: () => void;
};

export default function PoiFullscreenGallery({
  isOpen,
  poiId,
  title,
  images,
  onClose,
  onShare
}: PoiFullscreenGalleryProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) {
    return null;
  }

  return createPortal(
    <div className='bg-background fixed inset-0 z-[100] overflow-y-auto'>
      <div className='border-text-main/10 bg-surface sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 sm:px-10'>
        <div className='flex items-center gap-4'>
          <button
            type='button'
            onClick={onClose}
            className='text-text-main hover:bg-text-main/10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-transparent transition'
            aria-label='Close full-screen gallery'
          >
            <X className='h-5 w-5' />
          </button>
          <h3 className='text-text-main truncate text-sm font-semibold sm:text-base'>
            {title}
          </h3>
        </div>

        <div className='flex items-center gap-2'>
          <PoiActionButtons 
            poiId={poiId} 
            initialVouchCount={0} 
            layout="row" 
            buttonClassName="h-9 border-text-main bg-surface text-text-main hover:bg-text-main/10"
          />
          <button
            type='button'
            className='border-text-main text-text-main hover:bg-text-main/10 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-transparent transition'
            onClick={onShare}
            title='Share'
          >
            <Share2 className='h-4 w-4' />
          </button>
        </div>
      </div>

      <div className='flex w-full flex-col gap-16 py-10'>
        {images.length === 0 ? (
          <div className='flex h-[calc(100vh-144px)] w-full shrink-0 items-center justify-center bg-black text-sm text-white/80'>
            No gallery images available for this location.
          </div>
        ) : (
          images.map((image, index) => (
            <figure
              key={image.id || `${image.imageUrl}-${index}`}
              className='bg-background relative flex h-[calc(100vh-144px)] w-full shrink-0 items-center justify-center overflow-hidden'
            >
              <img
                src={image.imageUrl}
                alt={`${title} image ${index + 1}`}
                className='h-full w-full object-contain'
              />
            </figure>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}
