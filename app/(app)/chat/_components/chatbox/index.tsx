'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import JourneyArea from '../journey-area';
import { 
  Luggage, 
  Share, 
  ChevronDown, 
  Mic, 
  CornerDownRight,
  Pencil,
  Map,
  Trash2
} from 'lucide-react';
import { TextBody, TextHeading } from '@/components/text';
import { createBlankChat, linkJourneyToChat } from '@/lib/chat-api';

type ChatboxProps = {
  onOpenNewJourneyModal?: () => void;
};


export default function Chatbox({ onOpenNewJourneyModal }: ChatboxProps) {
  const [message, setMessage] = useState('');
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [chat, setChat] = useState<any>(null);
  const [journey, setJourney] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const params = useParams();
  const chatId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  useEffect(() => {
    if (!chatId) {
       setChat(null);
       setJourney(null);
       setMessages([]);
       return;
    }

    async function fetchChat() {
      try {
        const res = await fetch(`/api/chat?id=${chatId}`);
        
        // Only redirect if the chat genuinely doesn't exist (404)
        if (res.status === 404) {
          const chat = await createBlankChat();
          if (chat) router.replace(`/chat/${chat.id}`);
          return;
        }

        const data = await res.json();
        if (data.chat) {
          setChat(data.chat);
          setJourney(data.journey || null); // journey may be null for blank chats
          setMessages(data.chat.messages || []);
        }
      } catch (err) {
        console.error("Failed to load chat", err);
      }
    }
    fetchChat();
  }, [chatId, router]);

  useEffect(() => {
    const handleJourneyLinked = (e: any) => {
      const result = e.detail;
      if (result && result.chat?.id === chat?.id) {
        setJourney(result.journey);
        setChat(result.chat);
        setMessages(result.chat.messages || []);
        setJourneyOpen(true); // Smoothly open the journey area
      }
    };
    window.addEventListener('journey-linked', handleJourneyLinked);
    return () => window.removeEventListener('journey-linked', handleJourneyLinked);
  }, [chat]);

  useEffect(() => {
    const handleJourneyUpdated = async () => {
      if (!chatId) return;
      try {
        const res = await fetch(`/api/chat?id=${chatId}`);
        const data = await res.json();
        if (data.chat) {
          setChat(data.chat);
          setJourney(data.journey || null);
          setMessages(data.chat.messages || []);
        }
      } catch (err) {
        console.error("Failed to refresh chat on journey update", err);
      }
    };
    window.addEventListener('journey-updated', handleJourneyUpdated);
    return () => window.removeEventListener('journey-updated', handleJourneyUpdated);
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!message.trim() || !chat) return;
    
    const userMsg = message;
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chat.id,
          journeyId: journey.id,
          message: userMsg
        })
      });
      const data = await res.json();
      if (data.journey) {
        setJourney(data.journey);
        if (data.chat?.messages) {
            setMessages(data.chat.messages);
        } else {
            setMessages(prev => [...prev, { role: 'ai', content: data.aiText || `I've updated the journey based on your request.` }]);
        }
      }
    } catch(e) {
      console.error(e);
    }
    setIsAiTyping(false);
  };


  const isBlankJourney = !chat?.journeyId;
  const poiCount = journey?.itineraryItems?.length || 0;
  const chatTitle = chat?.title || journey?.title || 'Start a new journey';

  return (
    <div className='relative flex h-full w-full flex-col gap-4 bg-surface p-4'>
      {/* Top Action Bar */}
      {chat && (
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {isBlankJourney ? (
              <button
                onClick={() => onOpenNewJourneyModal?.()}
                className='flex items-center gap-2 rounded-full border border-text-muted bg-primary-600 py-[6px] pl-4 pr-4 shadow-sm hover:bg-primary-700 transition-colors'
              >
                <Luggage size={18} strokeWidth={2} className='text-white' />
                <span className='text-[15px] font-medium text-white'>Create a Journey</span>
              </button>
            ) : (
              <button
                onClick={() => setJourneyOpen(true)}
                className='flex items-center gap-2 rounded-full border border-text-muted bg-background py-[6px] pl-3 pr-[6px] shadow-sm hover:bg-surface'
              >
                <Luggage size={18} strokeWidth={2} className='text-text-main' />
                <span className='text-[15px] font-medium text-text-main'>Journey</span>
                <div className='flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white'>
                  {poiCount}
                </div>
              </button>
            )}
          </div>

          <button className='flex h-9 w-9 items-center justify-center rounded-full border border-text-muted bg-background text-text-main shadow-sm hover:bg-surface'>
            <Share size={18} strokeWidth={2} className='-mt-0.5' />
          </button>
        </div>
      )}

      {/* Main Container */}
      {chat && (
        /* ACTIVE CHAT UI */
        <div className='flex flex-1 flex-col overflow-hidden rounded-[24px] border border-text-muted bg-background'>
          
          {/* Chat Card Header with Dropdown */}
          <div className='relative flex items-center justify-between border-b border-text-muted px-5 py-4'>
            <TextBody className='leading-tight font-bold truncate max-w-[80%]'>
              {chatTitle}
            </TextBody>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-text-muted hover:bg-surface ml-3'
            >
              <ChevronDown size={18} strokeWidth={2} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className='absolute right-4 top-14 z-20 w-48 rounded-xl border border-border bg-background shadow-lg p-2'>
                <button 
                  className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-main hover:bg-surface'
                  onClick={() => setDropdownOpen(false)}
                >
                  <Pencil size={16} /> Rename Chat
                </button>
                <button 
                  className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-main hover:bg-surface'
                  onClick={() => { setJourneyOpen(true); setDropdownOpen(false); }}
                >
                  <Map size={16} /> View Journey
                </button>
                <div className='my-1 border-t border-border'></div>
                <button 
                  className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50'
                  onClick={() => setDropdownOpen(false)}
                >
                  <Trash2 size={16} /> Delete Chat
                </button>
              </div>
            )}
          </div>

          {/* Chat Body Area */}
          <div className='flex flex-1 flex-col justify-end overflow-hidden'>
            {/* Messages Area */}
            <div className='flex-1 overflow-y-auto p-4 space-y-4'>
              {messages.length === 0 ? (
                <div className='flex h-full items-center justify-center text-text-muted text-sm'>
                  No messages yet. Send a message to get started!
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-surface text-text-main border border-border'}`}>
                      <TextBody className='text-[15px]'>{m.content}</TextBody>
                    </div>
                  </div>
                ))
              )}
              {isAiTyping && (
                <div className='flex w-full justify-start mt-2'>
                  <div className='max-w-[80%] rounded-2xl px-4 py-2 bg-surface text-text-main border border-border flex items-center gap-2'>
                    <span className='animate-pulse'>...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Input Area */}
            <div className='px-4 pb-4 pt-1'>
              <div className='flex items-center gap-3 rounded-[24px] border border-text-muted bg-background px-5 py-[14px]'>
                <input
                  type='text'
                  placeholder='Ask anything to update your journey...'
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage() }}
                  className='flex-1 bg-transparent text-[15px] text-text-main placeholder:text-text-muted outline-none'
                />
                <button className='text-text-main hover:text-primary-800 hover:bg-surface p-1 rounded-full'>
                  <Mic size={22} strokeWidth={1.5} />
                </button>
                <button 
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className='text-text-main hover:text-primary-800 hover:bg-surface p-1 rounded-full disabled:opacity-50'
                >
                  <CornerDownRight size={22} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {journey && (
        <JourneyArea 
          open={journeyOpen} 
          onClose={() => setJourneyOpen(false)} 
          journey={journey}
        />
      )}

    </div>
  );
}
