'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import Chatbox from './_components/chatbox';
import MapArea from '@/components/map-area';

export default function ChatClientLayout({
  initialChats,
  initialJourneys
}: {
  initialChats: any[];
  initialJourneys: any[];
}) {
  const params = useParams();
  const chatId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Automatically manage redirect if on /chat randomly
  useEffect(() => {
    if (!chatId) {
      if (initialChats?.length > 0) {
        // Auto-redirect to the most recent chat
        router.replace(`/chat/${initialChats[0].id}`);
      } else {
        // Automatically create a blank chat if no chats exist
        const createBlankChat = async () => {
          try {
            const res = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isNewContext: true, isBlank: true })
            });
            const data = await res.json();
            if (data.chat) {
              localStorage.setItem('guestChatId', data.chat.id);
              router.refresh();
              router.replace(`/chat/${data.chat.id}`);
            }
          } catch (e) {
            console.error(e);
          }
        };
        createBlankChat();
      }
    }
  }, [chatId, initialChats, router]);

  const triggerNewJourneyModal = () => {
    window.dispatchEvent(
      new CustomEvent('open-new-journey-modal', { detail: { chatId } })
    );
  };

  return (
    <div
      ref={containerRef}
      className='relative flex h-full w-full overflow-hidden'
    >
      {/* LEFT: Chatbox (Full fixed width or percentage) */}
      <div
        className={cn(
          'h-full bg-white transition-all duration-300 ease-in-out',
          isMapExpanded
            ? 'pointer-events-none w-0 overflow-hidden border-r-0 opacity-0'
            : 'w-1/2 border-r opacity-100'
        )}
      >
        <Chatbox
          onOpenNewJourneyModal={triggerNewJourneyModal}
          initialJourneys={initialJourneys}
        />
      </div>

      {/* RIGHT: MapArea */}
      <div className='h-full flex-1 bg-gray-100'>
        <MapArea
          isExpanded={isMapExpanded}
          onToggleExpand={() => setIsMapExpanded(prev => !prev)}
          overlayContainerRef={containerRef}
        />
      </div>
    </div>
  );
}
