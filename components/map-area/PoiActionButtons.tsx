'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, Bookmark, PlusCircle, Loader2 } from 'lucide-react';
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
  const [isVouching, setIsVouching] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
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
    setIsVouching(true);

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
    } finally {
      setIsVouching(false);
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    const wasFavorited = isFavorited;
    setIsFavorited(!wasFavorited);
    setIsFavoriting(true);

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
    } finally {
      setIsFavoriting(false);
    }
  };

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        <button
          type='button'
          onClick={handleVouch}
          disabled={isLoading || isVouching}
          className={cn(
            'group/vouch relative border-foreground/40 text-foreground inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition disabled:opacity-50',
            isVouched
              ? 'bg-primary-500 border-primary-500 hover:bg-primary-600 text-white'
              : 'hover:bg-muted',
            buttonClassName
          )}
        >
          {layout === 'compact' && (
            <span className='absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover/vouch:opacity-100 pointer-events-none z-50 shadow-md'>
              {isVouched ? 'Remove vouch' : 'Vouch'}
            </span>
          )}
          {isVouching ? (
            <Loader2 className={cn('h-3.5 w-3.5 animate-spin', isVouched ? 'text-white' : '')} />
          ) : (
            <ThumbsUp className={cn('h-3.5 w-3.5', isVouched ? 'fill-white' : '')} />
          )}
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
          disabled={isLoading || isFavoriting}
          className={cn(
            'group/favorite relative border-foreground/40 text-foreground inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition disabled:opacity-50',
            isFavorited
              ? 'bg-primary-500 border-primary-500 hover:bg-primary-600 text-white'
              : 'hover:bg-muted',
            buttonClassName
          )}
        >
          {layout === 'compact' && (
            <span className='absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover/favorite:opacity-100 pointer-events-none z-50 shadow-md'>
              {isFavorited ? 'Remove favorite' : 'Favorite'}
            </span>
          )}
          {isFavoriting ? (
            <Loader2 className={cn('h-3.5 w-3.5 animate-spin', isFavorited ? 'text-white' : '')} />
          ) : (
            <Bookmark className={cn('h-3.5 w-3.5', isFavorited ? 'fill-white' : '')} />
          )}
          {layout === 'row' && 'Favorite'}
        </button>

        <button
          type='button'
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          className={cn(
            'group/add relative border-foreground/40 text-foreground hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition',
            buttonClassName
          )}
        >
          {layout === 'compact' && (
            <span className='absolute -bottom-8 right-0 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover/add:opacity-100 pointer-events-none z-50 shadow-md'>
              Add to Journey
            </span>
          )}
          <PlusCircle className='h-3.5 w-3.5' />
          {layout === 'row' && 'Add to Journey'}
        </button>
      </div>

      {isModalOpen && (
        <SelectJourneyModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          poiId={poiId}
          onSuccess={() => setToast({ message: 'Added to journey', type: 'success' })}
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
