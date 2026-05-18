'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, Bookmark, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import SelectJourneyModal from './SelectJourneyModal';
import { Toast } from '@/app/(app)/_components/Notificaiton';

interface PoiActionButtonsProps {
  poiId: string;
  initialVouchCount: number;
  layout?: 'row' | 'compact';
  className?: string;
  buttonClassName?: string;
}

export function PoiActionButtons({
  poiId,
  initialVouchCount,
  layout = 'row',
  className,
  buttonClassName
}: PoiActionButtonsProps) {
  const [vouchCount, setVouchCount] = useState(initialVouchCount);
  const [isVouched, setIsVouched] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/pois/${poiId}/user-status`);
        if (res.ok) {
          const data = await res.json();
          setIsVouched(data.isVouched);
          setIsFavorited(data.isFavorited);
        }
      } catch (err) {
        console.error('Failed to fetch user status for POI', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStatus();
  }, [poiId]);

  const handleVouch = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    const wasVouched = isVouched;
    setIsVouched(!wasVouched);
    setVouchCount(prev => (wasVouched ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/pois/${poiId}/vouch`, { method: 'POST' });
      if (!res.ok) throw new Error('Vouch failed');
      const data = await res.json();
      setIsVouched(data.isVouched);
      setToast({ message: data.isVouched ? 'Location vouched' : 'Vouch removed', type: 'success' });
    } catch (err) {
      // Revert optimistic update
      setIsVouched(wasVouched);
      setVouchCount(prev => (wasVouched ? prev + 1 : prev - 1));
      setToast({ message: 'Failed to vouch', type: 'error' });
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    const wasFavorited = isFavorited;
    setIsFavorited(!wasFavorited);

    try {
      const res = await fetch(`/api/pois/${poiId}/favorite`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Favorite failed');
      const data = await res.json();
      setIsFavorited(data.isFavorited);
      setToast({ message: data.isFavorited ? 'Added to favorites' : 'Removed from favorites', type: 'success' });
    } catch (err) {
      // Revert optimistic update
      setIsFavorited(wasFavorited);
      setToast({ message: 'Failed to favorite', type: 'error' });
    }
  };

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        <button
          type='button'
          onClick={handleVouch}
          disabled={isLoading}
          title={isVouched ? 'Remove vouch' : 'Vouch for this location'}
          className={cn(
            'border-foreground/40 text-foreground inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition disabled:opacity-50',
            isVouched
              ? 'bg-primary-500 border-primary-500 hover:bg-primary-600 text-white'
              : 'hover:bg-muted',
            buttonClassName
          )}
        >
          <ThumbsUp
            className={cn('h-3.5 w-3.5', isVouched ? 'fill-white' : '')}
          />
          {layout === 'row' ? (
            <>
              <span>Vouch</span>
              <span className='text-xs opacity-75'>{vouchCount}</span>
            </>
          ) : (
            vouchCount
          )}
        </button>

        <button
          type='button'
          onClick={handleFavorite}
          disabled={isLoading}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          className={cn(
            'border-foreground/40 text-foreground inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition disabled:opacity-50',
            isFavorited
              ? 'bg-primary-500 border-primary-500 hover:bg-primary-600 text-white'
              : 'hover:bg-muted',
            buttonClassName
          )}
        >
          <Bookmark
            className={cn('h-3.5 w-3.5', isFavorited ? 'fill-white' : '')}
          />
          {layout === 'row' && 'Favorite'}
        </button>

        <button
          type='button'
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          title='Add this location to a journey'
          className={cn(
            'border-foreground/40 text-foreground hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition',
            buttonClassName
          )}
        >
          <PlusCircle className='h-3.5 w-3.5' />
          {layout === 'row' && 'Add to Journey'}
        </button>
      </div>

      {isModalOpen && (
        <SelectJourneyModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          poiId={poiId}
        />
      )}

      <Toast
        isOpen={toast !== null}
        message={toast?.message || ''}
        type={toast?.type || 'success'}
      />
    </>
  );
}
