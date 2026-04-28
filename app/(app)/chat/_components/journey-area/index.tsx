'use client';

import { useMemo, useState, useEffect } from 'react';
import { 
  X, Undo2, Redo2, Navigation, ChevronDown, 
  MoreHorizontal, PlusCircle, MapPin, Calendar as CalendarIcon
} from 'lucide-react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { TextHeading, TextBody } from '@/components/text';
import ItineraryItemCard from './ItineraryItemCard';
import { useRouter } from 'next/navigation';
import JourneyDatePickerModal, { TimingData, formatDateSelection, formatFlexibleSelection } from '../../../_components/JourneyDatePickerModal';
import Notification, { Toast } from '../../../_components/Notificaiton';

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

interface JourneyAreaJourneyDay {
  id: string;
  dayNumber: number;
  title: string | null;
}

export interface JourneyAreaJourney {
  id: string;
  title: string;
  description: string | null;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  isFlexibleDates: boolean;
  flexibleDays: number | null;
  flexibleMonths: string | null;
  companions: string | null;
  budget: number | null;
  itineraryItems: JourneyAreaItineraryItem[];
  days: JourneyAreaJourneyDay[];
}

type JourneyAreaProps = {
  open: boolean;
  onClose: () => void;
  journey?: JourneyAreaJourney | null;
};

export default function JourneyArea({ open, onClose, journey }: JourneyAreaProps) {
  const router = useRouter();
  
  // Local state for optimistic updates
  const [items, setItems] = useState<JourneyAreaItineraryItem[]>([]);
  const [days, setDays] = useState<JourneyAreaJourneyDay[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [toastConfig, setToastConfig] = useState<{isOpen: boolean, message: string}>({ isOpen: false, message: '' });
  const [activeDayDropdown, setActiveDayDropdown] = useState<string | null>(null);
  const [renameModal, setRenameModal] = useState<{isOpen: boolean, dayId: string, initialName: string}>({ isOpen: false, dayId: '', initialName: '' });
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, dayId: string}>({ isOpen: false, dayId: '' });

  const [timingData, setTimingData] = useState<TimingData>({
    selectedTimingType: null,
    startDate: '',
    endDate: '',
    flexibleDays: 5,
    flexibleMonths: []
  });

  // Sync props to local state
  useEffect(() => {
    if (journey?.itineraryItems) {
      setItems(journey.itineraryItems);
    }
    if (journey?.days) {
      setDays(journey.days);
    }
  }, [journey?.itineraryItems, journey?.days]);

  useEffect(() => {
    if (journey) {
      setTimingData({
        selectedTimingType: journey.isFlexibleDates ? 'flexible' : (journey.startDate ? 'dates' : null),
        startDate: journey.startDate ? journey.startDate.split('T')[0] : '',
        endDate: journey.endDate ? journey.endDate.split('T')[0] : '',
        flexibleDays: journey.flexibleDays || 5,
        flexibleMonths: journey.flexibleMonths ? JSON.parse(journey.flexibleMonths) : []
      });
    }
  }, [journey]);

  // Group items by day
  const groupedItinerary = useMemo(() => {
    const basecamp: JourneyAreaItineraryItem[] = [];
    const scheduledDays: Record<number, JourneyAreaItineraryItem[]> = {};

    days.forEach(day => {
      scheduledDays[day.dayNumber] = [];
    });

    items.forEach(item => {
      if (item.dayNumber === null) {
        basecamp.push(item);
      } else {
        if (!scheduledDays[item.dayNumber]) {
          scheduledDays[item.dayNumber] = [];
        }
        scheduledDays[item.dayNumber].push(item);
      }
    });

    basecamp.sort((a, b) => a.orderIndex - b.orderIndex);
    
    // Strict sort by time for scheduled days
    Object.keys(scheduledDays).forEach(key => {
      scheduledDays[parseInt(key, 10)].sort((a, b) => {
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        if (a.startTime) return -1;
        if (b.startTime) return 1;
        return a.orderIndex - b.orderIndex;
      });
    });

    return { basecamp, scheduledDays };
  }, [items, days]);

  if (!open) return null;

  const totalItems = items.length;
  const totalBasecampItems = groupedItinerary.basecamp.length;

  const handleUpdateDates = async (newTiming: TimingData) => {
    if (!journey?.id) return;
    try {
      const res = await fetch(`/api/journeys/${journey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: newTiming.startDate ? new Date(newTiming.startDate).toISOString() : null,
          endDate: newTiming.endDate ? new Date(newTiming.endDate).toISOString() : null,
          isFlexibleDates: newTiming.selectedTimingType === 'flexible',
          flexibleDays: newTiming.flexibleDays,
          flexibleMonths: newTiming.flexibleMonths
        })
      });
      if (res.ok) {
        const data = await res.json();
        setShowDatePicker(false);
        router.refresh();
        window.dispatchEvent(new Event('journey-updated'));
        if (data.returnedItemsCount && data.returnedItemsCount > 0) {
          setToastConfig({
            isOpen: true,
            message: `${data.returnedItemsCount} item${data.returnedItemsCount > 1 ? 's' : ''} did not fit in the new timeframe and ${data.returnedItemsCount > 1 ? 'were' : 'was'} returned to Basecamp.`
          });
          setTimeout(() => setToastConfig({ isOpen: false, message: '' }), 5000);
        }
      }
    } catch (err) {
      console.error('Failed to update dates', err);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // Determine target day
    let newDayNumber: number | null = null;
    if (destination.droppableId !== 'basecamp') {
      newDayNumber = parseInt(destination.droppableId.replace('day-', ''), 10);
    }

    // Determine target list
    const destList = newDayNumber === null 
      ? [...groupedItinerary.basecamp] 
      : [...groupedItinerary.scheduledDays[newDayNumber]];
    
    // Find item
    const itemIndex = items.findIndex(i => i.id === draggableId);
    if (itemIndex === -1) return;
    const item = items[itemIndex];

    // Check if moving to same list
    const sameList = 
      (source.droppableId === 'basecamp' && destination.droppableId === 'basecamp') ||
      (source.droppableId === destination.droppableId);

    if (sameList) {
      destList.splice(source.index, 1);
      destList.splice(destination.index, 0, item);
    } else {
      destList.splice(destination.index, 0, item);
    }

    let newStartTime = item.startTime;
    let newEndTime = item.endTime;
    
    // Auto-scheduling logic if moving to a specific day
    if (newDayNumber !== null) {
      if (destination.index > 0) {
        const prevItem = destList[destination.index - 1];
        if (prevItem && prevItem.endTime) {
          const [h, m] = prevItem.endTime.split(':').map(Number);
          const totalMins = h * 60 + m + 30; // 30 min buffer
          const newH = Math.floor(totalMins / 60) % 24;
          const newM = totalMins % 60;
          newStartTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
          
          const endMins = totalMins + 120; // 2 hour duration
          const endH = Math.floor(endMins / 60) % 24;
          const endM = endMins % 60;
          newEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        } else {
          newStartTime = '09:00';
          newEndTime = '11:00';
        }
      } else {
        // First item in the day
        newStartTime = '09:00';
        newEndTime = '11:00';
      }
    } else {
      newStartTime = null;
      newEndTime = null;
    }

    // Assign new orderIndex values based on the resulting list
    const updatedItems = items.map(i => {
      if (i.id === item.id) {
        return { 
          ...i, 
          dayNumber: newDayNumber, 
          orderIndex: destination.index,
          startTime: newStartTime,
          endTime: newEndTime
        };
      }
      return i;
    });

    setItems(updatedItems);

    // Persist
    try {
      await fetch(`/api/itinerary-items/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: newDayNumber,
          orderIndex: destination.index,
          startTime: newStartTime,
          endTime: newEndTime
        })
      });
      router.refresh();
      window.dispatchEvent(new Event('journey-updated'));
    } catch (e) {
      console.error('Drag sync failed', e);
    }
  };

  const handleMoveToDay = async (itemId: string, dayNumber: number) => {
    const list = groupedItinerary.scheduledDays[dayNumber] || [];
    
    let newStartTime = '09:00';
    let newEndTime = '11:00';
    
    if (list.length > 0) {
      const prevItem = list[list.length - 1];
      if (prevItem && prevItem.endTime) {
        const [h, m] = prevItem.endTime.split(':').map(Number);
        const totalMins = h * 60 + m + 30; // 30 min buffer
        const newH = Math.floor(totalMins / 60) % 24;
        const newM = totalMins % 60;
        newStartTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
        
        const endMins = totalMins + 120; // 2 hour duration
        const endH = Math.floor(endMins / 60) % 24;
        const endM = endMins % 60;
        newEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }
    }

    setItems(prev => prev.map(i => i.id === itemId ? { ...i, dayNumber, startTime: newStartTime, endTime: newEndTime } : i));
    try {
      await fetch(`/api/itinerary-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayNumber, orderIndex: list.length, startTime: newStartTime, endTime: newEndTime })
      });
      router.refresh();
      window.dispatchEvent(new Event('journey-updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveToBasecamp = async (itemId: string) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, dayNumber: null, startTime: null, endTime: null } : i));
    try {
      await fetch(`/api/itinerary-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayNumber: null, orderIndex: 0, startTime: null, endTime: null })
      });
      router.refresh();
      window.dispatchEvent(new Event('journey-updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
    try {
      await fetch(`/api/itinerary-items/${itemId}`, {
        method: 'DELETE',
      });
      router.refresh();
      window.dispatchEvent(new Event('journey-updated'));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className='absolute inset-0 z-10 flex flex-col bg-background'>
      {/* Header */}
      <div className='relative flex items-center justify-between px-6 pb-4 pt-6'>
        <TextHeading className='text-[28px] tracking-tight text-text-main pr-10'>
          {journey?.title || 'Journey Title'}
        </TextHeading>
        <button
          onClick={onClose}
          className='absolute right-6 top-6 text-text-muted hover:text-foreground'
        >
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* Connected Pills */}
      <div className='px-6 pb-5 relative'>
        <div className='inline-flex items-center rounded-3xl border border-border bg-surface overflow-visible'>
          <button className='px-5 py-2 text-[14px] font-medium border-r border-border text-text-main hover:bg-background rounded-l-3xl transition-colors'>
            {journey?.destination || 'Where'}
          </button>
          
          {/* Date Picker Trigger */}
          <button 
            onClick={() => setShowDatePicker(true)}
            className='px-5 py-2 flex items-center gap-2 text-[14px] font-medium border-r border-border text-text-main hover:bg-background transition-colors'
          >
            <CalendarIcon size={14} />
            {journey?.isFlexibleDates 
              ? formatFlexibleSelection(
                  journey.flexibleDays || 5, 
                  journey.flexibleMonths ? JSON.parse(journey.flexibleMonths) : []
                ) || 'Flexible'
              : (journey?.startDate 
                  ? formatDateSelection(journey.startDate.split('T')[0], journey.endDate?.split('T')[0] || '')
                  : 'Date')}
          </button>

          <button className='px-5 py-2 text-[14px] font-medium border-r border-border text-text-main hover:bg-background transition-colors'>
            {journey?.companions || 'How many'}
          </button>
          <button className='px-5 py-2 text-[14px] font-medium text-text-muted bg-surface cursor-not-allowed rounded-r-3xl'>
            {journey?.budget ? `Budget: ${journey.budget}` : 'Budget'}
          </button>
        </div>

        {/* Modals and Toasts */}
      {journey && (
        <JourneyDatePickerModal
          open={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSubmit={handleUpdateDates}
          initialData={timingData}
        />
      )}

      <Notification 
        type="rename-confirmation"
        isOpen={renameModal.isOpen}
        initialValue={renameModal.initialName}
        onCancel={() => setRenameModal({ isOpen: false, dayId: '', initialName: '' })}
        onConfirm={async (newName) => {
          if (!newName) return;
          setDays(prev => prev.map(d => d.id === renameModal.dayId ? { ...d, title: newName } : d));
          setRenameModal({ isOpen: false, dayId: '', initialName: '' });
          await fetch(`/api/journeys/${journey?.id}/days/${renameModal.dayId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newName })
          });
          window.dispatchEvent(new Event('journey-updated'));
        }}
      />

      <Notification 
        type="delete-confirmation"
        isOpen={deleteModal.isOpen}
        onCancel={() => setDeleteModal({ isOpen: false, dayId: '' })}
        onConfirm={async () => {
          const dayIdToDelete = deleteModal.dayId;
          setDeleteModal({ isOpen: false, dayId: '' });
          await fetch(`/api/journeys/${journey?.id}/days/${dayIdToDelete}`, { method: 'DELETE' });
          router.refresh();
          window.dispatchEvent(new Event('journey-updated'));
        }}
      />

      <Toast 
        isOpen={toastConfig.isOpen}
        message={toastConfig.message}
        onClose={() => setToastConfig({ isOpen: false, message: '' })}
      />
    </div>

      {/* Tabs Row */}
      <div className='flex items-center justify-between border-b border-border px-6 pb-2'>
        <div className='flex items-center gap-4'>
          <span className='cursor-pointer text-[15px] font-bold text-text-main border-b-2 border-text-main pb-[9px] -mb-[10px]'>
            Itinerary
          </span>
          <span className='cursor-pointer text-[15px] text-text-muted hover:text-foreground'>
            Calendar
          </span>
        </div>

        <div className='flex items-center gap-2'>
          <button className='flex h-7 w-7 items-center justify-center rounded-full border border-text-main text-text-main hover:bg-surface'>
            <Undo2 size={15} strokeWidth={1.5} />
          </button>
          <button className='flex h-7 w-7 items-center justify-center rounded-full border border-text-main text-text-main hover:bg-surface'>
            <Redo2 size={15} strokeWidth={1.5} />
          </button>
          <button className='flex h-7 items-center gap-1.5 rounded-3xl border border-text-main px-3 font-medium hover:bg-surface'>
            <Navigation size={14} className='fill-primary-500 text-primary-600' />
            <span className='text-[13px] font-medium text-text-main'>Navigate</span>
          </button>
        </div>
      </div>

      {/* Journey Content - Wrapped in DragDropContext */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className='flex-1 overflow-y-auto px-6 py-6'>
          
          {/* Basecamp Section */}
          <div className='group mb-8'>
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex cursor-pointer items-center'>
                <div className='flex w-7 items-center justify-start'>
                  <ChevronDown size={20} strokeWidth={2} className='text-foreground' />
                </div>
                <TextBody className='font-bold text-[15px] text-foreground'>Basecamp</TextBody>
                <TextBody className='ml-3 pt-[2px] text-xs font-medium text-text-muted'>
                  {totalBasecampItems} item{totalBasecampItems !== 1 ? 's' : ''}
                </TextBody>
              </div>
            </div>

            {/* Droppable Basecamp Area */}
            <Droppable droppableId="basecamp">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`ml-7 flex flex-col gap-3 pb-4 min-h-[50px] rounded-2xl transition-colors ${snapshot.isDraggingOver ? 'bg-surface/50 border-dashed border-2 border-primary-300' : ''}`}
                >
                  {groupedItinerary.basecamp.map((item, index) => (
                    <ItineraryItemCard 
                      key={item.id} 
                      item={item} 
                      index={index} 
                      journey={journey || null}
                      onMoveToDay={handleMoveToDay}
                      onDelete={handleDelete}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Itinerary Section */}
          <div className='mb-4'>
            <div className='mb-4 flex items-center justify-between'>
              <div className='flex items-center'>
                <div className='flex w-7 items-center justify-start' />
                <TextBody className='font-bold text-[15px] text-foreground'>
                  Itinerary
                </TextBody>
                <TextBody className='ml-4 pt-[2px] text-xs font-medium text-text-muted'>
                  {totalItems - totalBasecampItems} item{(totalItems - totalBasecampItems) !== 1 ? 's' : ''}
                </TextBody>
              </div>
            </div>

            {days.length === 0 ? (
              <div className='pl-7 text-sm text-text-muted'>
                Please set travel dates to plan your itinerary.
              </div>
            ) : (
              days.map((day, index) => {
                const dayNumber = day.dayNumber;
                return (
                <div key={`day-${day.id}`} className='mb-6 relative group'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex cursor-pointer items-center'>
                      <div className='flex w-7 items-center justify-start'>
                        <ChevronDown size={20} strokeWidth={2} className='text-foreground' />
                      </div>
                      <TextBody className='font-bold text-[15px] text-foreground'>
                        {day.title || `Day ${dayNumber}`}
                      </TextBody>
                      <TextBody className='ml-3 pt-[2px] text-xs font-medium text-text-muted'>
                        {(groupedItinerary.scheduledDays[dayNumber] || []).length} items
                      </TextBody>
                    </div>
                    
                    {/* Day Action Menu */}
                    <div className='relative'>
                      <button 
                        onClick={() => setActiveDayDropdown(activeDayDropdown === day.id ? null : day.id)}
                        className='p-1.5 text-text-muted hover:text-foreground hover:bg-surface rounded-full transition-colors'
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      
                      {activeDayDropdown === day.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setActiveDayDropdown(null)}
                          />
                          <div className='absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden'>
                            <button 
                              onClick={() => {
                                setRenameModal({ isOpen: true, dayId: day.id, initialName: day.title || '' });
                                setActiveDayDropdown(null);
                              }}
                              className='w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface transition-colors'
                            >
                              Rename Day
                            </button>
                            <button 
                              onClick={async () => {
                                setActiveDayDropdown(null);
                                await fetch(`/api/journeys/${journey?.id}/days`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'add-before', dayNumber: day.dayNumber })
                                });
                                router.refresh();
                                window.dispatchEvent(new Event('journey-updated'));
                              }}
                              className='w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface transition-colors'
                            >
                              Add Day Before
                            </button>
                            <button 
                              onClick={async () => {
                                setActiveDayDropdown(null);
                                await fetch(`/api/journeys/${journey?.id}/days`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'add-after', dayNumber: day.dayNumber })
                                });
                                router.refresh();
                                window.dispatchEvent(new Event('journey-updated'));
                              }}
                              className='w-full text-left px-4 py-2 text-sm text-text-main hover:bg-surface transition-colors'
                            >
                              Add Day After
                            </button>
                            <button 
                              onClick={() => {
                                setActiveDayDropdown(null);
                                setDeleteModal({ isOpen: true, dayId: day.id });
                              }}
                              className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-border mt-1 pt-1'
                            >
                              Remove Day
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Droppable Day Area */}
                  <Droppable droppableId={`day-${dayNumber}`}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`ml-7 flex flex-col gap-3 pb-4 min-h-[50px] rounded-2xl transition-colors ${snapshot.isDraggingOver ? 'bg-surface/50 border-dashed border-2 border-primary-300' : ''}`}
                      >
                        {(groupedItinerary.scheduledDays[dayNumber] || []).map((item, itemIndex) => (
                          <ItineraryItemCard 
                            key={item.id} 
                            item={item} 
                            index={itemIndex} 
                            journey={journey || null}
                            onMoveToBasecamp={handleMoveToBasecamp}
                            onDelete={handleDelete}
                          />
                        ))}
                        {provided.placeholder}

                        {(groupedItinerary.scheduledDays[dayNumber] || []).length === 0 && !snapshot.isDraggingOver && (
                          <div className='text-xs text-text-muted/60 italic py-2 pl-2'>
                            Drag items here...
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })
            )}
            
            {days.length > 0 && (
              <button 
                onClick={async () => {
                  await fetch(`/api/journeys/${journey?.id}/days`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'add-end' })
                  });
                  router.refresh();
                  window.dispatchEvent(new Event('journey-updated'));
                }}
                className='ml-7 flex items-center justify-center gap-2 border border-dashed border-border hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 text-text-muted rounded-xl py-3 text-sm font-semibold transition-colors w-[calc(100%-28px)]'
              >
                <PlusCircle size={16} /> Add Day
              </button>
            )}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
