'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

/** Footer Component */
export function FooterActions() {
  return (
    <div className='flex flex-col gap-3 md:text-right'>
      <Link
        href='/about'
        className='text-text-muted text-left font-medium transition-colors hover:text-slate-900 md:text-right'
      >
        About
      </Link>
      <Link
        href='/team'
        className='text-text-muted text-left font-medium transition-colors hover:text-slate-900 md:text-right'
      >
        Team
      </Link>
      <Link
        href='/contact'
        className='text-text-muted text-left font-medium transition-colors hover:text-slate-900 md:text-right'
      >
        Contact
      </Link>
    </div>
  );
}

/** Legal Component */
export function LegalActions() {
  return (
    <div className='flex items-center gap-4 md:gap-6'>
      <Link
        href='/privacy'
        className='text-text-muted hover:text-text-main text-sm font-medium transition-colors'
      >
        Privacy Policy
      </Link>
      <Link
        href='/terms'
        className='text-text-muted hover:text-text-main text-sm font-medium transition-colors'
      >
        Terms of Service
      </Link>
    </div>
  );
}

export function HeroCTA() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    router.push('/chat');
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className='group bg-primary-500 text-background flex items-center justify-center gap-3 rounded-full px-10 py-5 text-lg font-semibold hover:cursor-pointer hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed min-w-[240px]'
    >
      {loading ? <Loader2 className="animate-spin text-white" /> : 'Start your journey'}
    </button>
  );
}
