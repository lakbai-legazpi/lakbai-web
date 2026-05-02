'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { TextBody } from '@/components/text';

export type JourneyCardJourney = {
  id: string;
  title: string;
  destination: string | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  createdAt: Date | string;
  coverImageUrl?: string | null;
};

type JourneyCardProps = {
  journey: JourneyCardJourney;
  selected: boolean;
  onToggleSelect: (journeyId: string) => void;
  onRename: (journey: JourneyCardJourney) => void;
  onDelete: (journey: JourneyCardJourney) => void;
};

export default function JourneyCard({
  journey,
  selected,
  onToggleSelect,
  onRename,
  onDelete
}: JourneyCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // Compute days if dates exist
  let daysText = 'TBD days';
  if (journey.startDate && journey.endDate) {
    const start = new Date(journey.startDate);
    const end = new Date(journey.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysText = `${diffDays || 1} day${diffDays > 1 ? 's' : ''}`;
  }

  const coverImageUrl = journey.coverImageUrl?.trim();

  return (
    <div className='group bg-surface-200 border-border relative h-55 w-full overflow-hidden rounded-[24px] border transition-all hover:shadow-md sm:h-65 md:h-75 lg:h-87.5 lg:w-112.5'>
      <div className='absolute inset-0'>
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={journey.title}
            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
            loading='lazy'
          />
        ) : (
          <div className='absolute inset-0 bg-linear-to-br from-slate-200 via-slate-300 to-slate-400' />
        )}
      </div>

      {/* Gradient overlay for text readability */}
      <div className='absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent opacity-95' />

      <div className='absolute top-4 left-4 z-20'>
        <button
          type='button'
          onClick={() => onToggleSelect(journey.id)}
          className={
            selected
              ? 'bg-primary-600 border-primary-600 flex h-9 w-9 items-center justify-center rounded-full border text-white shadow-sm'
              : 'bg-background/90 text-text-muted border-border flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur'
          }
          aria-label={selected ? 'Deselect journey' : 'Select journey'}
          aria-pressed={selected}
        >
          {selected ? <Check size={18} /> : null}
        </button>
      </div>

      <div ref={menuRef} className='absolute top-4 right-4 z-20'>
        <button
          type='button'
          onClick={() => setIsMenuOpen(prev => !prev)}
          className='bg-background/90 border-border text-text-main flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur transition hover:bg-white'
          aria-label='Journey actions'
          aria-expanded={isMenuOpen}
        >
          <MoreHorizontal size={18} />
        </button>

        {isMenuOpen && (
          <div className='border-border bg-background absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border shadow-lg'>
            <button
              type='button'
              onClick={() => {
                setIsMenuOpen(false);
                onRename(journey);
              }}
              className='hover:bg-surface-light text-text-main flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors'
            >
              <Pencil size={14} />
              Rename
            </button>
            <button
              type='button'
              onClick={() => {
                setIsMenuOpen(false);
                onDelete(journey);
              }}
              className='flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50'
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content (bottom-left) */}
      <div className='absolute bottom-0 left-0 w-full p-5'>
        <TextBody className='truncate text-lg font-bold text-white'>
          {journey.title}
        </TextBody>

        <TextBody className='mt-0.5 text-sm text-white/80'>
          {journey.destination || 'Planning exactly where'} • {daysText}
        </TextBody>
      </div>
    </div>
  );
}
