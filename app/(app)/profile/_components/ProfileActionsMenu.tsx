'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';

interface ProfileActionsMenuProps {
  username: string;
}

export function ProfileActionsMenu({ username }: ProfileActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = async () => {
    const profileUrl = `${window.location.origin}/profile/${username}`;
    await navigator.clipboard.writeText(profileUrl);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className='relative self-end sm:self-start'>
      <button
        type='button'
        aria-label='Profile options'
        onClick={() => setIsOpen(previousValue => !previousValue)}
        className='border-border bg-background text-text-main hover:bg-surface-light rounded-full border p-2.5 transition'
      >
        <MoreHorizontal className='h-4 w-4' />
      </button>

      {isOpen && (
        <div className='bg-background border-border absolute left-1/2 -translate-x-1/2 z-30 mt-2 w-44 overflow-hidden rounded-xl border py-1 shadow-lg'>
          <Link
            href='/profile/settings'
            onClick={() => setIsOpen(false)}
            className='text-text-main hover:bg-surface-light block px-4 py-2 text-sm'
          >
            Edit profile
          </Link>
          <button
            type='button'
            onClick={handleCopyLink}
            className='text-text-main hover:bg-surface-light block w-full px-4 py-2 text-sm'
          >
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}
