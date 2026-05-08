'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import JourneyArea from '../journey-area';
import { JourneyPickerModal } from '../JourneyPickerModal';
import {
  Luggage,
  Share,
  ChevronDown,
  Mic,
  CornerDownRight,
  Pencil,
  Map,
  Trash2,
  X
} from 'lucide-react';
import { TextBody } from '@/components/text';
import Notification, { Toast } from '../../../_components/Notificaiton';
import { createBlankChat, attachJourneyToChat } from '@/lib/chat-api';

type ChatboxProps = {
  onOpenNewJourneyModal?: () => void;
  initialJourneys?: any[];
};

export default function Chatbox({
  onOpenNewJourneyModal,
  initialJourneys = []
}: ChatboxProps) {
  const [message, setMessage] = useState('');
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [journeyPickerOpen, setJourneyPickerOpen] = useState(false);
  const [isAttachingJourney, setIsAttachingJourney] = useState(false);

  const [chat, setChat] = useState<any>(null);
  const [journey, setJourney] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [userLabel, setUserLabel] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const params = useParams();
  const chatId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const examplePrompts = [
    'Build a 3-day itinerary using nearby POIs.',
    'Make a relaxed day plan with food stops and sunset views.',
    'Reorder my itinerary by travel time and energy level.',
    'Suggest budget-friendly places for my current journey.'
  ];

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
          setIsRateLimited(false);
          setRateLimitMessage('');
        }
      } catch (err) {
        console.error('Failed to load chat', err);
      }
    }
    fetchChat();
  }, [chatId, router]);

  useEffect(() => {
    let isActive = true;
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) return;
        const data = await res.json();
        if (!isActive || !data?.profile) return;
        const firstName = data.profile.firstName || '';
        const username = data.profile.username || '';
        const label = firstName || (username ? `@${username}` : '');
        setUserLabel(label || null);
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    };
    loadProfile();
    return () => {
      isActive = false;
    };
  }, []);

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
    return () =>
      window.removeEventListener('journey-linked', handleJourneyLinked);
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
        console.error('Failed to refresh chat on journey update', err);
      }
    };
    window.addEventListener('journey-updated', handleJourneyUpdated);
    return () =>
      window.removeEventListener('journey-updated', handleJourneyUpdated);
  }, [chatId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop();
      }
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleTranscription = async (audioBlob: Blob) => {
    if (!audioBlob.size) return;
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      const audioFile = new File([audioBlob], 'lakbai-voice.webm', {
        type: audioBlob.type || 'audio/webm'
      });
      formData.append('file', audioFile);

      const res = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        setToast({
          message: data.error || 'Failed to transcribe audio.',
          type: 'error'
        });
        return;
      }

      if (data.text) {
        setMessage(prev => (prev ? `${prev} ${data.text}` : data.text));
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to transcribe audio.', type: 'error' });
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    if (isRecording || isRateLimited || isTranscribing) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setToast({
        message: 'Voice input is not supported in this browser.',
        type: 'error'
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        });
        await handleTranscription(audioBlob);
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Microphone access was denied.', type: 'error' });
    }
  };

  const stopRecording = () => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state === 'inactive'
    ) {
      return;
    }
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleConfirmRename = async (newName?: string) => {
    if (!chat?.id || !newName?.trim()) return;
    setIsRenaming(true);
    try {
      const response = await fetch(`/api/chat?type=chat&id=${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newName })
      });

      if (response.ok) {
        setChat((prev: any) => (prev ? { ...prev, title: newName } : prev));
        setRenameOpen(false);
        setToast({
          message: `Chat name has been updated to "${newName}"`,
          type: 'success'
        });
        router.refresh();
      } else {
        const error = await response.json();
        setToast({
          message: error.error || 'Failed to rename',
          type: 'error'
        });
      }
    } catch (e) {
      console.error(e);
      setToast({ message: 'Failed to rename', type: 'error' });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!chat?.id) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/chat?type=chat&id=${chat.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDeleteOpen(false);
        setChat(null);
        setJourney(null);
        setMessages([]);
        setToast({ message: 'Chat has been removed', type: 'success' });
        router.refresh();
        router.replace('/chat');
      } else {
        const error = await response.json();
        setToast({
          message: error.error || 'Failed to delete',
          type: 'error'
        });
      }
    } catch (e) {
      console.error(e);
      setToast({ message: 'Failed to delete', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAttachJourney = async (journeyId: string) => {
    if (!chat?.id) return;
    setIsAttachingJourney(true);
    try {
      const result = await attachJourneyToChat(chat.id, journeyId);
      if (result) {
        setChat(result.chat);
        setJourney(result.journey);
        setJourneyPickerOpen(false);
        setToast({
          message: `Chat connected to "${result.journey.title}"`,
          type: 'success'
        });
        // Fetch updated messages
        const res = await fetch(`/api/chat?id=${chat.id}`);
        const data = await res.json();
        if (data.chat) {
          setMessages(data.chat.messages || []);
        }
      }
    } catch (e) {
      console.error(e);
      setToast({ message: 'Failed to attach journey', type: 'error' });
    } finally {
      setIsAttachingJourney(false);
    }
  };

  const handleSendMessage = async (overrideMessage?: string) => {
    const userMsg = (overrideMessage ?? message).trim();
    if (!userMsg || !chat || isRateLimited) return;

    setMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chat.id,
          journeyId: journey?.id ?? null,
          message: userMsg
        })
      });

      const data = await res.json();

      if (res.status === 429 && data?.rateLimited) {
        setIsRateLimited(true);
        setRateLimitMessage(
          data.error || 'Daily AI limit reached. Please try again tomorrow.'
        );
        setIsAiTyping(false);
        return;
      }

      if (!res.ok) {
        setToast({
          message: data?.error || 'Failed to send message.',
          type: 'error'
        });
        setIsAiTyping(false);
        return;
      }

      if (data.chat) {
        setChat(data.chat);
      }
      if (data.journey) {
        setJourney(data.journey);
      }
      if (data.chat?.messages) {
        setMessages(data.chat.messages);
      } else if (data.aiText) {
        setMessages(prev => [...prev, { role: 'ai', content: data.aiText }]);
      }
    } catch (e) {
      console.error(e);
    }
    setIsAiTyping(false);
  };

  const isBlankJourney = !chat?.journeyId;
  const poiCount = journey?.itineraryItems?.length || 0;
  const chatTitle = chat?.title || journey?.title || 'Start a new journey';

  return (
    <div className='bg-surface relative flex h-full w-full flex-col gap-4 p-4'>
      {/* Top Action Bar */}
      {chat && (
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {isBlankJourney ? (
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => onOpenNewJourneyModal?.()}
                  className='border-text-muted bg-primary-600 hover:bg-primary-700 flex items-center gap-2 rounded-full border py-[6px] pr-4 pl-4 shadow-sm transition-colors'
                >
                  <Luggage size={18} strokeWidth={2} className='text-white' />
                  <span className='text-[15px] font-medium text-white'>
                    Create Journey
                  </span>
                </button>
                {initialJourneys.length > 0 && (
                  <button
                    onClick={() => setJourneyPickerOpen(true)}
                    disabled={isAttachingJourney}
                    className='border-text-muted bg-background hover:bg-surface flex items-center gap-2 rounded-full border py-[6px] pr-4 pl-4 shadow-sm transition-colors disabled:opacity-50'
                  >
                    <Luggage
                      size={18}
                      strokeWidth={2}
                      className='text-text-main'
                    />
                    <span className='text-text-main text-[15px] font-medium'>
                      Attach Journey
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setJourneyOpen(true)}
                className='border-text-muted bg-background hover:bg-surface flex items-center gap-2 rounded-full border py-[6px] pr-[6px] pl-3 shadow-sm'
              >
                <Luggage size={18} strokeWidth={2} className='text-text-main' />
                <span className='text-text-main text-[15px] font-medium'>
                  Journey
                </span>
                <div className='bg-primary-600 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold text-white'>
                  {poiCount}
                </div>
              </button>
            )}
          </div>

          <button className='border-text-muted bg-background text-text-main hover:bg-surface flex h-9 w-9 items-center justify-center rounded-full border shadow-sm'>
            <Share size={18} strokeWidth={2} className='-mt-0.5' />
          </button>
        </div>
      )}

      {/* Main Container */}
      {chat && (
        /* ACTIVE CHAT UI */
        <div className='border-text-muted bg-background flex flex-1 flex-col overflow-hidden rounded-[24px] border'>
          {/* Chat Card Header with Dropdown */}
          <div className='border-text-muted relative flex items-center justify-between border-b px-5 py-4'>
            <TextBody className='max-w-[80%] truncate leading-tight font-bold'>
              {chatTitle}
            </TextBody>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className='border-text-muted hover:bg-surface ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border'
            >
              <ChevronDown size={18} strokeWidth={2} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className='border-border bg-background absolute top-14 right-4 z-20 w-48 rounded-xl border p-2 shadow-lg'>
                <button
                  className='text-text-main hover:bg-surface flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm'
                  onClick={() => {
                    setDropdownOpen(false);
                    setRenameOpen(true);
                  }}
                >
                  <Pencil size={16} /> Rename Chat
                </button>
                <button
                  className='text-text-main hover:bg-surface flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm'
                  onClick={() => {
                    setJourneyOpen(true);
                    setDropdownOpen(false);
                  }}
                >
                  <Map size={16} /> View Journey
                </button>
                <div className='border-border my-1 border-t'></div>
                <button
                  className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50'
                  onClick={() => {
                    setDropdownOpen(false);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 size={16} /> Delete Chat
                </button>
              </div>
            )}
          </div>

          {/* Chat Body Area */}
          <div className='relative flex flex-1 flex-col justify-end overflow-hidden'>
            {/* Messages Area */}
            <div className='flex-1 space-y-4 overflow-y-auto p-4'>
              {messages.length === 0 ? (
                <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
                  <h2 className='text-text-main text-2xl font-semibold'>
                    Where to travel this time{userLabel ? `, ${userLabel}` : ''}
                    ?
                  </h2>
                  <p className='text-text-muted mt-2 text-sm'>
                    Hey there, I am here to assist you in planning your
                    experience. Ask me anything travel related.
                  </p>
                  <ul className='text-text-muted mt-4 grid gap-2 text-left text-xs sm:text-sm'>
                    <li>Build multi-day itineraries from local POIs.</li>
                    <li>Reorder days, time blocks, and stop sequences.</li>
                    <li>Adjust budget, dates, and trip preferences.</li>
                    <li>Recommend places that match your journey goals.</li>
                  </ul>
                  <div className='mt-5 flex flex-wrap justify-center gap-2'>
                    <button
                      type='button'
                      onClick={() => setShowExamples(true)}
                      className='border-text-muted text-text-main hover:bg-surface rounded-full border px-4 py-2 text-sm font-medium transition-colors'
                    >
                      What can I ask Lakbai?
                    </button>
                  </div>

                  {showExamples && (
                    <div className='border-border bg-background mt-6 w-full max-w-lg rounded-2xl border p-4 text-left shadow-sm'>
                      <div className='flex items-start justify-between gap-4'>
                        <div>
                          <button
                            type='button'
                            className='text-text-main hover:text-primary-600 text-sm font-semibold transition-colors'
                          >
                            Examples of things Lakbai can help you with
                          </button>
                          <p className='text-text-muted mt-1 text-xs'>
                            Tap one to add it to the chat box.
                          </p>
                        </div>
                        <button
                          type='button'
                          onClick={() => setShowExamples(false)}
                          className='text-text-muted hover:text-text-main rounded-full p-1'
                          aria-label='Close examples'
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className='mt-3 flex flex-wrap gap-2'>
                        {examplePrompts.map(prompt => (
                          <button
                            key={prompt}
                            type='button'
                            onClick={() => {
                              setMessage(prompt);
                              inputRef.current?.focus();
                            }}
                            className='border-text-muted text-text-main hover:bg-surface rounded-full border px-3 py-2 text-xs font-medium transition-colors'
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-surface text-text-main border-border border'}`}
                    >
                      <TextBody className='text-[15px]'>{m.content}</TextBody>
                    </div>
                  </div>
                ))
              )}
              {isAiTyping && (
                <div className='mt-2 flex w-full justify-start'>
                  <div className='bg-surface text-text-main border-border flex max-w-[80%] items-center gap-2 rounded-2xl border px-4 py-2'>
                    <span className='animate-pulse'>...</span>
                  </div>
                </div>
              )}
            </div>

            {isRateLimited && (
              <div className='absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm'>
                <div className='border-border bg-background max-w-sm rounded-2xl border px-4 py-3 text-center shadow-sm'>
                  <p className='text-text-main text-sm font-semibold'>
                    Daily AI limit reached
                  </p>
                  <p className='text-text-muted mt-1 text-xs'>
                    {rateLimitMessage ||
                      'You have hit the free usage cap. Please try again tomorrow.'}
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Input Area */}
            <div className='px-4 pt-1 pb-4'>
              <div className='border-text-muted bg-background flex items-center gap-3 rounded-[24px] border px-5 py-[14px]'>
                <input
                  type='text'
                  placeholder='Ask anything to update your journey...'
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  ref={inputRef}
                  disabled={isRateLimited}
                  className='text-text-main placeholder:text-text-muted flex-1 bg-transparent text-[15px] outline-none disabled:cursor-not-allowed'
                />
                <button
                  type='button'
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isRateLimited || isTranscribing}
                  aria-pressed={isRecording}
                  className={`rounded-full p-1 transition-colors disabled:opacity-50 ${
                    isRecording
                      ? 'bg-primary-600 text-white'
                      : 'text-text-main hover:text-primary-800 hover:bg-surface'
                  }`}
                >
                  <Mic size={22} strokeWidth={1.5} />
                </button>
                <button
                  type='button'
                  onClick={() => handleSendMessage()}
                  disabled={!message.trim() || isRateLimited}
                  className='text-text-main hover:text-primary-800 hover:bg-surface rounded-full p-1 disabled:opacity-50'
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

      <JourneyPickerModal
        open={journeyPickerOpen}
        journeys={initialJourneys}
        onClose={() => setJourneyPickerOpen(false)}
        onSelectJourney={handleAttachJourney}
        onCreateNewJourney={() => {
          setJourneyPickerOpen(false);
          onOpenNewJourneyModal?.();
        }}
        isSubmitting={isAttachingJourney}
      />

      <Notification
        type='rename-confirmation'
        isOpen={renameOpen}
        onCancel={() => setRenameOpen(false)}
        onConfirm={handleConfirmRename}
        isLoading={isRenaming}
        initialValue={chatTitle}
      />

      <Notification
        type='delete-confirmation'
        isOpen={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />

      <Toast
        isOpen={toast !== null}
        message={toast?.message || ''}
        type={toast?.type || 'success'}
      />
    </div>
  );
}
