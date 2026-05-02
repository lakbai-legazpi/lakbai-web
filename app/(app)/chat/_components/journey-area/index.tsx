'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  X,
  Undo2,
  Redo2,
  Navigation,
  ChevronDown,
  MoreHorizontal,
  PlusCircle,
  MapPin,
  Calendar as CalendarIcon
} from 'lucide-react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { TextHeading, TextBody } from '@/components/text';
import ItineraryItemCard from './ItineraryItemCard';
import { useRouter } from 'next/navigation';
import JourneyDatePickerModal, {
  TimingData,
  formatDateSelection,
  formatFlexibleSelection
} from '../../../_components/JourneyDatePickerModal';
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

interface LinkedChat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
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
  chats?: LinkedChat[];
}

type JourneyAreaProps = {
  open: boolean;
  onClose: () => void;
  journey?: JourneyAreaJourney | null;
};

export default function JourneyArea({
  open,
  onClose,
  journey
}: JourneyAreaProps) {
  const router = useRouter();

  // Local state for optimistic updates
  const [items, setItems] = useState<JourneyAreaItineraryItem[]>([]);
  const [days, setDays] = useState<JourneyAreaJourneyDay[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [toastConfig, setToastConfig] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: '' });
  const [activeDayDropdown, setActiveDayDropdown] = useState<string | null>(
    null
  );
  const [basecampDropdownOpen, setBasecampDropdownOpen] = useState(false);
  const [companionsDropdownOpen, setCompanionsDropdownOpen] = useState(false);
  const [companionsValue, setCompanionsValue] = useState('');
  const [budgetDropdownOpen, setBudgetDropdownOpen] = useState(false);
  const [budgetValue, setBudgetValue] = useState<number | null>(null);
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    dayId: string;
    initialName: string;
  }>({ isOpen: false, dayId: '', initialName: '' });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    dayId: string;
  }>({ isOpen: false, dayId: '' });

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
    setCompanionsValue(journey?.companions || '');
  }, [journey?.companions]);

  useEffect(() => {
    setBudgetValue(journey?.budget ?? null);
  }, [journey?.budget]);

  useEffect(() => {
    if (journey) {
      setTimingData({
        selectedTimingType: journey.isFlexibleDates
          ? 'flexible'
          : journey.startDate
            ? 'dates'
            : null,
        startDate: journey.startDate ? journey.startDate.split('T')[0] : '',
        endDate: journey.endDate ? journey.endDate.split('T')[0] : '',
        flexibleDays: journey.flexibleDays || 5,
        flexibleMonths: journey.flexibleMonths
          ? JSON.parse(journey.flexibleMonths)
          : []
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
  const budgetOptions: Array<{ label: string; value: number | null }> = [
    { label: 'Any budget', value: null },
    { label: '₱', value: 1 },
    { label: '₱₱', value: 2 },
    { label: '₱₱₱', value: 3 },
    { label: '₱₱₱₱', value: 4 }
  ];
  const budgetLabel =
    budgetOptions.find(option => option.value === budgetValue)?.label ??
    'Any budget';

  const handleUpdateDates = async (newTiming: TimingData) => {
    if (!journey?.id) return;
    try {
      const res = await fetch(`/api/journeys/${journey.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: newTiming.startDate
            ? new Date(newTiming.startDate).toISOString()
            : null,
          endDate: newTiming.endDate
            ? new Date(newTiming.endDate).toISOString()
            : null,
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
          setTimeout(
            () => setToastConfig({ isOpen: false, message: '' }),
            5000
          );
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
    const destList =
      newDayNumber === null
        ? [...groupedItinerary.basecamp]
        : [...groupedItinerary.scheduledDays[newDayNumber]];

    // Find item
    const itemIndex = items.findIndex(i => i.id === draggableId);
    if (itemIndex === -1) return;
    const item = items[itemIndex];

    // Check if moving to same list
    const sameList =
      (source.droppableId === 'basecamp' &&
        destination.droppableId === 'basecamp') ||
      source.droppableId === destination.droppableId;

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

    setItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? { ...i, dayNumber, startTime: newStartTime, endTime: newEndTime }
          : i
      )
    );
    try {
      await fetch(`/api/itinerary-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber,
          orderIndex: list.length,
          startTime: newStartTime,
          endTime: newEndTime
        })
      });
      router.refresh();
      window.dispatchEvent(new Event('journey-updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveToBasecamp = async (itemId: string) => {
    setItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? { ...i, dayNumber: null, startTime: null, endTime: null }
          : i
      )
    );
    try {
      await fetch(`/api/itinerary-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: null,
          orderIndex: 0,
          startTime: null,
          endTime: null
        })
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
        method: 'DELETE'
      });
      router.refresh();
      window.dispatchEvent(new Event('journey-updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearBasecamp = async () => {
    const basecampItems = groupedItinerary.basecamp;
    if (basecampItems.length === 0) {
      setBasecampDropdownOpen(false);
      return;
    }

    setItems(prev => prev.filter(i => i.dayNumber !== null));
    setBasecampDropdownOpen(false);

    try {
      await Promise.all(
        basecampItems.map(item =>
          fetch(`/api/itinerary-items/${item.id}`, { method: 'DELETE' })
        )
      );
      router.refresh();
      window.dispatchEvent(new Event('journey-updated'));
    } catch (e) {
      console.error('Failed to clear basecamp', e);
    }
  };

  const handleClearDay = async (dayNumber: number) => {
    const dayItems = groupedItinerary.scheduledDays[dayNumber] || [];
    if (dayItems.length === 0) {
      setActiveDayDropdown(null);
      return;
    }

    setItems(prev => prev.filter(i => i.dayNumber !== dayNumber));
    setActiveDayDropdown(null);

    try {
      await Promise.all(
        dayItems.map(item =>
          fetch(`/api/itinerary-items/${item.id}`, { method: 'DELETE' })
        )
      );
      router.refresh();
      window.dispatchEvent(new Event('journey-updated'));
    } catch (e) {
      console.error('Failed to clear day', e);
    }
  };

  return (
    <div className='bg-background absolute inset-0 z-10 flex flex-col'>
      {/* Header */}
      <div className='relative flex items-center justify-between px-6 pt-6 pb-4'>
        <TextHeading className='text-text-main pr-10 text-[28px] tracking-tight'>
          {journey?.title || 'Journey Title'}
        </TextHeading>
        <button
          onClick={onClose}
          className='text-text-muted hover:text-foreground absolute top-6 right-6'
        >
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* Connected Pills */}
      <div className='relative px-6 pb-5'>
        <div className='border-border bg-surface inline-flex items-center overflow-visible rounded-3xl border'>
          <button className='border-border text-text-main hover:bg-background rounded-l-3xl border-r px-5 py-2 text-[14px] font-medium transition-colors'>
            {journey?.destination || 'Where'}
          </button>

          {/* Date Picker Trigger */}
          <button
            onClick={() => setShowDatePicker(true)}
            className='border-border text-text-main hover:bg-background flex items-center gap-2 border-r px-5 py-2 text-[14px] font-medium transition-colors'
          >
            <CalendarIcon size={14} />
            {journey?.isFlexibleDates
              ? formatFlexibleSelection(
                  journey.flexibleDays || 5,
                  journey.flexibleMonths
                    ? JSON.parse(journey.flexibleMonths)
                    : []
                ) || 'Flexible'
              : journey?.startDate
                ? formatDateSelection(
                    journey.startDate.split('T')[0],
                    journey.endDate?.split('T')[0] || ''
                  )
                : 'Date'}
          </button>

          <div className='relative'>
            <button
              onClick={() => setCompanionsDropdownOpen(prev => !prev)}
              className='border-border text-text-main hover:bg-background flex items-center gap-2 border-r px-5 py-2 text-[14px] font-medium transition-colors'
              aria-label='Select group size'
            >
              <span>
                {companionsValue || journey?.companions || 'How many'}
              </span>
              <ChevronDown
                size={16}
                className={
                  companionsDropdownOpen
                    ? 'rotate-180 transition-transform'
                    : 'transition-transform'
                }
              />
            </button>

            {companionsDropdownOpen && (
              <>
                <div
                  className='fixed inset-0 z-40'
                  onClick={() => setCompanionsDropdownOpen(false)}
                />
                <div className='border-border bg-background absolute top-full left-0 z-50 mt-1 w-full min-w-[180px] overflow-hidden rounded-2xl border shadow-lg'>
                  {[
                    '1 person',
                    '1-2 persons',
                    '3-4 persons',
                    '5-8 persons',
                    '9+ persons'
                  ].map(option => (
                    <button
                      key={option}
                      onClick={async () => {
                        setCompanionsValue(option);
                        setCompanionsDropdownOpen(false);
                        try {
                          const res = await fetch(
                            `/api/journeys/${journey?.id}`,
                            {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ companions: option })
                            }
                          );
                          if (res.ok) {
                            router.refresh();
                            window.dispatchEvent(new Event('journey-updated'));
                          }
                        } catch (e) {
                          console.error('Failed to update companions', e);
                        }
                      }}
                      className='text-text-main hover:bg-primary-50 w-full px-5 py-3 text-left text-[15px] transition-colors'
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className='relative'>
            <button
              onClick={() => setBudgetDropdownOpen(prev => !prev)}
              className='border-border text-text-main hover:bg-background flex items-center gap-2 rounded-r-3xl border-l px-5 py-2 text-[14px] font-medium transition-colors'
              aria-label='Select budget'
            >
              <span>{budgetLabel}</span>
              <ChevronDown
                size={16}
                className={
                  budgetDropdownOpen
                    ? 'rotate-180 transition-transform'
                    : 'transition-transform'
                }
              />
            </button>

            {budgetDropdownOpen && (
              <>
                <div
                  className='fixed inset-0 z-40'
                  onClick={() => setBudgetDropdownOpen(false)}
                />
                <div className='border-border bg-background absolute top-full right-0 z-50 mt-1 w-48 overflow-hidden rounded-2xl border shadow-lg'>
                  {budgetOptions.map(option => (
                    <button
                      key={option.label}
                      onClick={async () => {
                        setBudgetValue(option.value);
                        setBudgetDropdownOpen(false);
                        try {
                          const res = await fetch(
                            `/api/journeys/${journey?.id}`,
                            {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ budget: option.value })
                            }
                          );
                          if (res.ok) {
                            router.refresh();
                            window.dispatchEvent(new Event('journey-updated'));
                          }
                        } catch (e) {
                          console.error('Failed to update budget', e);
                        }
                      }}
                      className='text-text-main hover:bg-primary-50 w-full px-5 py-3 text-left text-[15px] transition-colors'
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
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
          type='rename-confirmation'
          isOpen={renameModal.isOpen}
          initialValue={renameModal.initialName}
          onCancel={() =>
            setRenameModal({ isOpen: false, dayId: '', initialName: '' })
          }
          onConfirm={async newName => {
            if (!newName) return;
            setDays(prev =>
              prev.map(d =>
                d.id === renameModal.dayId ? { ...d, title: newName } : d
              )
            );
            setRenameModal({ isOpen: false, dayId: '', initialName: '' });
            await fetch(
              `/api/journeys/${journey?.id}/days/${renameModal.dayId}`,
              {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newName })
              }
            );
            window.dispatchEvent(new Event('journey-updated'));
          }}
        />

        <Notification
          type='delete-confirmation'
          isOpen={deleteModal.isOpen}
          onCancel={() => setDeleteModal({ isOpen: false, dayId: '' })}
          onConfirm={async () => {
            const dayIdToDelete = deleteModal.dayId;
            setDeleteModal({ isOpen: false, dayId: '' });
            await fetch(`/api/journeys/${journey?.id}/days/${dayIdToDelete}`, {
              method: 'DELETE'
            });
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
      <div className='border-border flex items-center justify-between border-b px-6 pb-2'>
        <div className='flex items-center gap-4'>
          <span className='text-text-main border-text-main -mb-[10px] cursor-pointer border-b-2 pb-[9px] text-[15px] font-bold'>
            Itinerary
          </span>
          <span className='text-text-muted hover:text-foreground cursor-pointer text-[15px]'>
            Calendar
          </span>
        </div>

        <div className='flex items-center gap-2'>
          <button className='border-text-main text-text-main hover:bg-surface flex h-7 w-7 items-center justify-center rounded-full border'>
            <Undo2 size={15} strokeWidth={1.5} />
          </button>
          <button className='border-text-main text-text-main hover:bg-surface flex h-7 w-7 items-center justify-center rounded-full border'>
            <Redo2 size={15} strokeWidth={1.5} />
          </button>
          <button className='border-text-main hover:bg-surface flex h-7 items-center gap-1.5 rounded-3xl border px-3 font-medium'>
            <Navigation
              size={14}
              className='fill-primary-500 text-primary-600'
            />
            <span className='text-text-main text-[13px] font-medium'>
              Navigate
            </span>
          </button>
        </div>
      </div>

      {/* Journey Content - Wrapped in DragDropContext */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className='flex-1 overflow-y-auto px-6 py-6'>
          {/* Connected Chats Section */}
          {journey?.chats && journey.chats.length > 0 && (
            <div className='group mb-8'>
              <div className='mb-3 flex items-center justify-between'>
                <div className='flex items-center'>
                  <TextBody className='text-foreground text-[15px] font-bold'>
                    Connected Chats
                  </TextBody>
                  <TextBody className='text-text-muted ml-3 pt-[2px] text-xs font-medium'>
                    {journey.chats.length} chat
                    {journey.chats.length !== 1 ? 's' : ''}
                  </TextBody>
                </div>
              </div>
              <div className='space-y-2'>
                {journey.chats.map(chat => (
                  <a
                    key={chat.id}
                    href={`/chat/${chat.id}`}
                    className='border-border bg-primary-50 hover:bg-primary-100 dark:bg-primary-900 dark:hover:bg-primary-800 flex items-center justify-between rounded-lg border px-4 py-2 transition-colors'
                  >
                    <div className='min-w-0 flex-1'>
                      <TextBody className='text-text-main truncate text-[14px] font-medium'>
                        {chat.title}
                      </TextBody>
                      <TextBody className='text-text-muted text-xs'>
                        {new Date(chat.createdAt).toLocaleDateString()}
                      </TextBody>
                    </div>
                    <span className='text-text-main ml-2 text-sm'>→</span>
                  </a>
                ))}
              </div>
              <div className='border-border my-6 border-b'></div>
            </div>
          )}

          {/* Basecamp Section */}
          <div className='group mb-8'>
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex cursor-pointer items-center'>
                <div className='flex w-7 items-center justify-start'>
                  <ChevronDown
                    size={20}
                    strokeWidth={2}
                    className='text-foreground'
                  />
                </div>
                <TextBody className='text-foreground text-[15px] font-bold'>
                  Basecamp
                </TextBody>
                <TextBody className='text-text-muted ml-3 pt-[2px] text-xs font-medium'>
                  {totalBasecampItems} item{totalBasecampItems !== 1 ? 's' : ''}
                </TextBody>
              </div>

              <div className='relative'>
                <button
                  onClick={() => setBasecampDropdownOpen(prev => !prev)}
                  className='text-text-muted hover:bg-surface hover:text-foreground rounded-full p-1.5 transition-colors'
                  aria-label='Basecamp actions'
                >
                  <MoreHorizontal size={18} />
                </button>

                {basecampDropdownOpen && (
                  <>
                    <div
                      className='fixed inset-0 z-40'
                      onClick={() => setBasecampDropdownOpen(false)}
                    />
                    <div className='border-border bg-background absolute top-full right-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border py-1 shadow-lg'>
                      <button
                        onClick={handleClearBasecamp}
                        className='text-text-main hover:bg-surface w-full px-4 py-2 text-left text-sm transition-colors'
                      >
                        Clear basecamp
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Droppable Basecamp Area */}
            <Droppable droppableId='basecamp'>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`ml-7 flex min-h-[50px] flex-col gap-3 rounded-2xl pb-4 transition-colors ${snapshot.isDraggingOver ? 'bg-surface/50 border-primary-300 border-2 border-dashed' : ''}`}
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
                <TextBody className='text-foreground text-[15px] font-bold'>
                  Itinerary
                </TextBody>
                <TextBody className='text-text-muted ml-4 pt-[2px] text-xs font-medium'>
                  {totalItems - totalBasecampItems} item
                  {totalItems - totalBasecampItems !== 1 ? 's' : ''}
                </TextBody>
              </div>
            </div>

            {days.length === 0 ? (
              <div className='text-text-muted pl-7 text-sm'>
                Please set travel dates to plan your itinerary.
              </div>
            ) : (
              days.map((day, index) => {
                const dayNumber = day.dayNumber;
                return (
                  <div key={`day-${day.id}`} className='group relative mb-6'>
                    <div className='mb-3 flex items-center justify-between'>
                      <div className='flex cursor-pointer items-center'>
                        <div className='flex w-7 items-center justify-start'>
                          <ChevronDown
                            size={20}
                            strokeWidth={2}
                            className='text-foreground'
                          />
                        </div>
                        <TextBody className='text-foreground text-[15px] font-bold'>
                          {day.title || `Day ${dayNumber}`}
                        </TextBody>
                        <TextBody className='text-text-muted ml-3 pt-[2px] text-xs font-medium'>
                          {
                            (groupedItinerary.scheduledDays[dayNumber] || [])
                              .length
                          }{' '}
                          items
                        </TextBody>
                      </div>

                      {/* Day Action Menu */}
                      <div className='relative'>
                        <button
                          onClick={() =>
                            setActiveDayDropdown(
                              activeDayDropdown === day.id ? null : day.id
                            )
                          }
                          className='text-text-muted hover:text-foreground hover:bg-surface rounded-full p-1.5 transition-colors'
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {activeDayDropdown === day.id && (
                          <>
                            <div
                              className='fixed inset-0 z-40'
                              onClick={() => setActiveDayDropdown(null)}
                            />
                            <div className='bg-background border-border absolute top-full right-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border py-1 shadow-lg'>
                              <button
                                onClick={() => {
                                  setRenameModal({
                                    isOpen: true,
                                    dayId: day.id,
                                    initialName: day.title || ''
                                  });
                                  setActiveDayDropdown(null);
                                }}
                                className='text-text-main hover:bg-surface w-full px-4 py-2 text-left text-sm transition-colors'
                              >
                                Rename Day
                              </button>
                              <button
                                onClick={() => handleClearDay(dayNumber)}
                                className='text-text-main hover:bg-surface w-full px-4 py-2 text-left text-sm transition-colors'
                              >
                                Clear day
                              </button>
                              <button
                                onClick={async () => {
                                  setActiveDayDropdown(null);
                                  await fetch(
                                    `/api/journeys/${journey?.id}/days`,
                                    {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({
                                        action: 'add-before',
                                        dayNumber: day.dayNumber
                                      })
                                    }
                                  );
                                  router.refresh();
                                  window.dispatchEvent(
                                    new Event('journey-updated')
                                  );
                                }}
                                className='text-text-main hover:bg-surface w-full px-4 py-2 text-left text-sm transition-colors'
                              >
                                Add Day Before
                              </button>
                              <button
                                onClick={async () => {
                                  setActiveDayDropdown(null);
                                  await fetch(
                                    `/api/journeys/${journey?.id}/days`,
                                    {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({
                                        action: 'add-after',
                                        dayNumber: day.dayNumber
                                      })
                                    }
                                  );
                                  router.refresh();
                                  window.dispatchEvent(
                                    new Event('journey-updated')
                                  );
                                }}
                                className='text-text-main hover:bg-surface w-full px-4 py-2 text-left text-sm transition-colors'
                              >
                                Add Day After
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDayDropdown(null);
                                  setDeleteModal({
                                    isOpen: true,
                                    dayId: day.id
                                  });
                                }}
                                className='border-border mt-1 w-full border-t px-4 py-2 pt-1 text-left text-sm text-red-600 transition-colors hover:bg-red-50'
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
                          className={`ml-7 flex min-h-[50px] flex-col gap-3 rounded-2xl pb-4 transition-colors ${snapshot.isDraggingOver ? 'bg-surface/50 border-primary-300 border-2 border-dashed' : ''}`}
                        >
                          {(
                            groupedItinerary.scheduledDays[dayNumber] || []
                          ).map((item, itemIndex) => (
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

                          {(groupedItinerary.scheduledDays[dayNumber] || [])
                            .length === 0 &&
                            !snapshot.isDraggingOver && (
                              <div className='text-text-muted/60 py-2 pl-2 text-xs italic'>
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
                className='border-border hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 text-text-muted ml-7 flex w-[calc(100%-28px)] items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm font-semibold transition-colors'
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
