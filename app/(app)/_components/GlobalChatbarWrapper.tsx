'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Chatbar from '../chat/_components/chatbar';
import NewJourneyModal from './NewJourneyModal';
import { createBlankChat, createJourneyChat, linkJourneyToChat } from '@/lib/chat-api';

export default function GlobalChatbarWrapper({ 
  initialChats, 
  initialJourneys,
  children 
}: { 
  initialChats: any[]; 
  initialJourneys: any[];
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleClose = () => setIsOpen(false);
    const handleOpenModal = (e: any) => {
      setActiveChatId(e?.detail?.chatId || null);
      setIsModalOpen(true);
    };
    window.addEventListener('toggle-chat-popup', handleToggle);
    window.addEventListener('close-chat-popup', handleClose);
    window.addEventListener('open-new-journey-modal', handleOpenModal);
    return () => {
      window.removeEventListener('toggle-chat-popup', handleToggle);
      window.removeEventListener('close-chat-popup', handleClose);
      window.removeEventListener('open-new-journey-modal', handleOpenModal);
    };
  }, []);

  const handleNewChat = async () => {
    const chat = await createBlankChat();
    if (chat) {
      setIsOpen(false);
      router.refresh();
      router.push(`/chat/${chat.id}`);
    }
  };

  const handleModalSubmit = async (newJourneyData: any) => {
    if (activeChatId) {
      const result = await linkJourneyToChat(activeChatId, newJourneyData);
      if (result) {
        setIsOpen(false);
        setIsModalOpen(false);
        window.dispatchEvent(new CustomEvent('journey-linked', { detail: result }));
        router.refresh();
      }
    } else {
      const result = await createJourneyChat(newJourneyData);
      if (result) {
        setIsOpen(false);
        setIsModalOpen(false);
        router.refresh();
        router.push(`/chat/${result.chat.id}`);
      }
    }
  };

  return (
    <div className="relative flex h-full w-full">
      {isOpen && (
        <>
          <div className='absolute left-0 top-0 bottom-0 z-40 bg-white shadow-xl transition-all w-[420px] border-r border-border rounded-r-[24px] overflow-hidden'>
            <Chatbar 
              chats={initialChats}
              journeys={initialJourneys}
              onNewChat={handleNewChat}
              onNewJourney={() => {
                setIsOpen(false);
                setIsModalOpen(true);
              }}
            />
          </div>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 z-30 bg-black/10 backdrop-blur-[1px] cursor-pointer" 
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
      
      <div className="flex-1 overflow-hidden h-full w-full">
        {children}
      </div>

      <NewJourneyModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
