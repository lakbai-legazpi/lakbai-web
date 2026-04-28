'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, Bookmark, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import SelectJourneyModal from './SelectJourneyModal';

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
    setVouchCount(prev => wasVouched ? prev - 1 : prev + 1);

    try {
      const res = await fetch(`/api/pois/${poiId}/vouch`, { method: 'POST' });
      if (!res.ok) throw new Error('Vouch failed');
      const data = await res.json();
      setIsVouched(data.isVouched);
    } catch (err) {
      // Revert optimistic update
      setIsVouched(wasVouched);
      setVouchCount(prev => wasVouched ? prev + 1 : prev - 1);
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic update
    const wasFavorited = isFavorited;
    setIsFavorited(!wasFavorited);

    try {
      const res = await fetch(`/api/pois/${poiId}/favorite`, { method: 'POST' });
      if (!res.ok) throw new Error('Favorite failed');
      const data = await res.json();
      setIsFavorited(data.isFavorited);
    } catch (err) {
      // Revert optimistic update
      setIsFavorited(wasFavorited);
    }
  };

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <button
          type='button'
          onClick={handleVouch}
          disabled={isLoading}
          className={cn(
            'border-foreground/40 text-foreground inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition disabled:opacity-50',
            isVouched ? 'bg-primary-500 text-white border-primary-500 hover:bg-primary-600' : 'hover:bg-muted',
            buttonClassName
          )}
        >
          <ThumbsUp className={cn("h-3.5 w-3.5", isVouched ? "fill-white" : "")} /> 
          {vouchCount}
        </button>
        
        <button
          type='button'
          onClick={handleFavorite}
          disabled={isLoading}
          className={cn(
            'border-foreground/40 text-foreground inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition disabled:opacity-50',
            isFavorited ? 'bg-primary-500 text-white border-primary-500 hover:bg-primary-600' : 'hover:bg-muted',
            buttonClassName
          )}
        >
          <Bookmark className={cn("h-3.5 w-3.5", isFavorited ? "fill-white" : "")} /> 
          {layout === 'row' && 'Favorite'}
        </button>
        
        <button
          type='button'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          className={cn(
            'border-foreground/40 text-foreground inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition hover:bg-muted',
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
    </>
  );
}
