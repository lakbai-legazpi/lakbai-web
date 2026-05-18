import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Edit,
  BadgePlus,
  Ellipsis,
  Trash2,
  PencilIcon
} from 'lucide-react';
import { TextBody } from '@/components/text';
import Notification from '@/app/(app)/_components/Notificaiton';
import { Toast } from '@/app/(app)/_components/Notificaiton';

type ChatbarProps = {
  chats: any[];
  journeys: any[];
  onNewChat: () => void;
  onNewJourney: () => void;
};

export default function Chatbar({
  chats,
  journeys,
  onNewChat,
  onNewJourney
}: ChatbarProps) {
  const router = useRouter();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'journey' | 'chat';
    id: string;
  } | null>(null);
  const [renameConfirmation, setRenameConfirmation] = useState<{
    type: 'journey' | 'chat';
    id: string;
    currentName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDelete = async (type: 'journey' | 'chat', id: string) => {
    setDeleteConfirmation({ type, id });
    setOpenDropdownId(null);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deleteConfirmation) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/chat?type=${deleteConfirmation.type}&id=${deleteConfirmation.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        const itemTitle =
          deleteConfirmation.type === 'chat'
            ? chats.find(c => c.id === deleteConfirmation.id)?.title || 'Chat'
            : journeys.find(j => j.id === deleteConfirmation.id)?.title ||
              'Journey';

        setToast({ message: `${itemTitle} has been removed`, type: 'success' });
        setDeleteConfirmation(null);
        router.refresh();
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

  const handleRename = (
    type: 'journey' | 'chat',
    id: string,
    currentName: string
  ) => {
    setRenameConfirmation({ type, id, currentName });
    setOpenDropdownId(null);
  };

  const handleConfirmRename = async (newName?: string): Promise<void> => {
    if (!renameConfirmation || !newName?.trim()) return;

    setIsRenaming(true);
    try {
      const response = await fetch(
        `/api/chat?type=${renameConfirmation.type}&id=${renameConfirmation.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newName })
        }
      );

      if (response.ok) {
        setToast({
          message: `Chat name has been updated to "${newName}"`,
          type: 'success'
        });
        setRenameConfirmation(null);
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

  return (
    <div className='bg-surface-light text-text-main flex h-full w-full flex-col overflow-hidden'>
      {/* Search Bar area */}
      <div className='p-4 pr-10'>
        <div className='bg-surface border-border focus-within:border-primary-500 flex items-center gap-2 rounded-2xl border px-4 py-2.5 transition-colors'>
          <Search size={18} className='text-text-muted shrink-0' />
          <input
            type='text'
            placeholder='Search...'
            className='text-text-main placeholder:text-text-muted w-full bg-transparent text-[15px] outline-none'
          />
        </div>
      </div>

      <div className='scrollbar-none flex-1 overflow-y-auto px-2 pb-4'>
        {/* Top Actions */}
        <div className='mb-6 flex flex-col gap-1 px-2'>
          <button
            onClick={onNewChat}
            className='hover:bg-surface flex items-center gap-3 rounded-lg px-2 py-2 text-[15px] font-medium transition-colors'
          >
            <Edit size={18} className='text-text-main' />
            <span>New chat</span>
          </button>

          <button
            onClick={onNewJourney}
            className='hover:bg-surface flex items-center gap-3 rounded-lg px-2 py-2 text-[15px] font-medium transition-colors'
          >
            <BadgePlus size={18} className='text-text-main' />
            <span className='ml-2'>New journey</span>
          </button>
        </div>

        {/* Journey List */}
        <div className='mb-6'>
          <TextBody className='text-text-muted mb-2 px-4 text-[13px] font-medium'>
            My Journeys
          </TextBody>
          <div className='flex flex-col gap-1'>
            {journeys?.map(journey => (
              <div
                key={journey.id}
                className='hover:bg-surface group relative flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2 transition-colors'
              >
                <div className='border-border h-8 w-8 shrink-0 overflow-hidden rounded-md border bg-slate-100'>
                  {/* Dummy image representation - a placeholder div */}
                </div>
                <span className='text-text-main flex-1 truncate text-[15px] font-medium'>
                  {journey.title ||
                    `Journey to ${journey.destination || 'Unknown'}`}
                </span>

              </div>
            ))}
            {!journeys?.length && (
              <div className='text-text-muted px-4 py-2 text-sm'>
                No journeys yet.
              </div>
            )}
          </div>
        </div>

        {/* Chats List */}
        <div>
          <TextBody className='text-text-muted mb-2 px-4 text-[13px] font-medium'>
            Chat History
          </TextBody>
          <div className='flex flex-col gap-1'>
            {chats?.map(chat => {
              // Find matching journey for subtitle
              const journey = journeys?.find(j => j.id === chat.journeyId);

              return (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className='group hover:bg-surface relative flex items-center justify-between gap-2 rounded-lg px-4 py-2 transition-colors'
                >
                  <div className='flex flex-1 flex-col gap-0.5 overflow-hidden'>
                    <span className='text-text-main truncate text-[15px] font-medium'>
                      {chat.title || 'Untitled'}
                    </span>
                    <span className='text-text-muted truncate text-[13px]'>
                      {journey
                        ? `Journey to ${journey.destination || 'Unknown'}`
                        : 'Journey'}
                    </span>
                  </div>

                  <div className='relative flex shrink-0 items-center'>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        setOpenDropdownId(
                          openDropdownId === chat.id ? null : chat.id
                        );
                      }}
                      className={`rounded-md p-1 transition-all ${openDropdownId === chat.id ? 'bg-slate-200 opacity-100' : 'opacity-0 group-hover:opacity-100 hover:bg-slate-200'}`}
                    >
                      <Ellipsis size={18} className='text-text-main' />
                    </button>

                    {openDropdownId === chat.id && (
                      <div className='border-border absolute top-full right-0 z-50 mt-1 w-32 overflow-hidden rounded-lg border bg-white shadow-lg'>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleRename(
                              'chat',
                              chat.id,
                              chat.title || 'Untitled'
                            );
                          }}
                          className='text-text-main hover:bg-surface flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors'
                        >
                          <PencilIcon size={14} /> Rename
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDelete('chat', chat.id);
                          }}
                          className='flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50'
                        >
                          <Trash2 size={14} /> Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
            {!chats?.length && (
              <div className='text-text-muted px-4 py-2 text-sm'>
                No chats yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <Notification
        type='delete-confirmation'
        isOpen={deleteConfirmation !== null}
        onCancel={() => setDeleteConfirmation(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />

      <Notification
        type='rename-confirmation'
        isOpen={renameConfirmation !== null}
        onCancel={() => setRenameConfirmation(null)}
        onConfirm={handleConfirmRename}
        isLoading={isRenaming}
        initialValue={renameConfirmation?.currentName || ''}
      />

      <Toast
        isOpen={toast !== null}
        message={toast?.message || ''}
        type={toast?.type || 'success'}
      />
    </div>
  );
}
