'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Draggable } from '@hello-pangea/dnd';
import { MapPin, MoreHorizontal, Eye, ArrowRightFromLine, ArrowLeftFromLine, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import ItemTimeframeModal from './ItemTimeframeModal';
import { getDayColor } from '@/lib/colors';

interface JourneyAreaPOI {
  id: string;
  name: string;
  description: string;
}

interface JourneyAreaItineraryItem {
  id: string;
  journeyId: string;
  poiId: string;
  dayNumber: number | null;
  orderIndex: number;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  poi?: JourneyAreaPOI | null;
}

interface JourneyAreaJourney {
  id: string;
  title: string;
  isFlexibleDates: boolean;
  startDate: string | null;
  endDate: string | null;
}

type ItineraryItemCardProps = {
  item: JourneyAreaItineraryItem;
  index: number;
  journey: JourneyAreaJourney | null;
  onMoveToDay?: (itemId: string, dayNumber: number) => void;
  onMoveToBasecamp?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
};

export default function ItineraryItemCard({ 
  item, 
  index, 
  journey,
  onMoveToDay, 
  onMoveToBasecamp, 
  onDelete 
}: ItineraryItemCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [timeframeModalOpen, setTimeframeModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const isBasecamp = item.dayNumber === null;

  return (
    <>
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'rounded-xl border border-border bg-surface p-3 flex gap-3 items-start relative select-none transition-shadow',
            snapshot.isDragging && 'shadow-xl ring-2 ring-primary-500 z-50 opacity-90'
          )}
          style={{
            ...provided.draggableProps.style,
            // Prevent some visual jumping during drag by ensuring default styling
          }}
        >
          <div className={cn(
            'p-2 rounded-full shrink-0 mt-0.5',
            isBasecamp ? 'bg-primary-100 text-primary-800' : `${getDayColor(item.dayNumber!)} text-white`
          )}>
            <MapPin size={16} />
          </div>
          <div className='flex flex-col flex-1 pr-6'>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const params = new URLSearchParams(searchParams.toString());
                params.set('poi', item.poiId);
                router.replace(`${pathname}?${params.toString()}`, { scroll: false });
              }}
              className='text-left text-sm font-bold line-clamp-2 leading-tight hover:text-primary-600 transition-colors'
            >
              {item.poi?.name ?? 'Unknown POI'}
            </button>
            <span className='text-xs text-text-muted mt-1'>
              {item.startTime 
                ? `${item.startTime}${item.endTime ? ` - ${item.endTime}` : ''}` 
                : isBasecamp ? 'Unscheduled' : 'Unscheduled Time'}
            </span>
          </div>

          {/* More Action Button */}
          <div className='absolute top-2 right-2' ref={dropdownRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
              className='p-1 rounded-full text-text-muted hover:text-foreground hover:bg-border transition-colors'
            >
              <MoreHorizontal size={18} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className='absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-background shadow-lg z-50 overflow-hidden py-1'>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(false);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('poi', item.poiId);
                    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                  }}
                  className='flex w-full items-center gap-2 px-3 py-2 text-sm text-text-main hover:bg-surface text-left'
                >
                  <Eye size={16} /> View {item.poi?.name ? 'Details' : 'POI'}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(false);
                    setTimeframeModalOpen(true);
                  }}
                  className='flex w-full items-center gap-2 px-3 py-2 text-sm text-text-main hover:bg-surface text-left'
                >
                  <Clock size={16} /> Edit Timeframe
                </button>
                
                {isBasecamp ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(false);
                      onMoveToDay?.(item.id, 1);
                    }}
                    className='flex w-full items-center gap-2 px-3 py-2 text-sm text-text-main hover:bg-surface text-left'
                  >
                    <ArrowRightFromLine size={16} /> Add to Itinerary
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(false);
                      onMoveToBasecamp?.(item.id);
                    }}
                    className='flex w-full items-center gap-2 px-3 py-2 text-sm text-text-main hover:bg-surface text-left'
                  >
                    <ArrowLeftFromLine size={16} /> Move to Basecamp
                  </button>
                )}

                <div className='my-1 border-t border-border'></div>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(false);
                    onDelete?.(item.id);
                  }}
                  className='flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left'
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
    <ItemTimeframeModal
      open={timeframeModalOpen}
      onClose={() => setTimeframeModalOpen(false)}
      item={item}
      journey={journey}
    />
    </>
  );
}
