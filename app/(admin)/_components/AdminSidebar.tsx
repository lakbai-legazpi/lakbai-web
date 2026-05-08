'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { TextSubheading } from '@/components/text';
import {
  LayoutDashboard,
  ListChecks,
  MapPin,
  ArrowLeft,
  LogOut
} from 'lucide-react';

export function AdminSidebar({ userProfile }: { userProfile?: any }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <aside className='border-border bg-surface flex h-full w-64 flex-col border-r transition-all duration-300'>
      {/* Logo Area */}
      <div className='flex h-24 items-center px-6'>
        <div className='relative h-8 w-8 shrink-0'>
          <Image src='/logos/lakbai.svg' alt='Lakbai' fill className='object-contain' />
        </div>
        <div className='ml-3'>
          <TextSubheading className='text-primary-500 font-bold'>lakbai admin</TextSubheading>
        </div>
      </div>

      {/* Nav */}
      <nav className='flex flex-1 flex-col gap-2 px-4 py-4'>
        <Link
          href='/admin'
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-3 transition-colors',
            pathname === '/admin'
              ? 'bg-primary-50 text-primary-600 font-medium'
              : 'text-text-muted hover:bg-slate-100 hover:text-text-main'
          )}
        >
          <LayoutDashboard size={20} className='shrink-0' />
          <span>Dashboard</span>
        </Link>

        <Link
          href='/admin/contributions'
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-3 transition-colors',
            pathname.startsWith('/admin/contributions')
              ? 'bg-primary-50 text-primary-600 font-medium'
              : 'text-text-muted hover:bg-slate-100 hover:text-text-main'
          )}
        >
          <ListChecks size={20} className='shrink-0' />
          <span>Contributions</span>
        </Link>

        <Link
          href='/admin/pois'
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-3 transition-colors',
            pathname.startsWith('/admin/pois')
              ? 'bg-primary-50 text-primary-600 font-medium'
              : 'text-text-muted hover:bg-slate-100 hover:text-text-main'
          )}
        >
          <MapPin size={20} className='shrink-0' />
          <span>POI Management</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className='flex flex-col gap-2 px-4 pb-8'>
        <div className='border-border mb-2 border-t' />
        
        <Link
          href='/'
          className='text-text-muted hover:bg-slate-100 hover:text-text-main flex items-center gap-3 rounded-lg px-3 py-3 transition-colors'
        >
          <ArrowLeft size={20} className='shrink-0' />
          <span>Back to App</span>
        </Link>

        <button
          onClick={handleLogout}
          className='flex items-center gap-3 rounded-lg px-3 py-3 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 text-left'
        >
          <LogOut size={20} className='shrink-0' />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
