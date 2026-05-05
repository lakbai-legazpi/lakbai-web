import Link from 'next/link';

import { cn } from '@/lib/cn';

const tabs = [
  { id: 'about', label: 'About', href: '/about' },
  { id: 'team', label: 'Team', href: '/team' },
  { id: 'contact', label: 'Contact', href: '/contact' }
] as const;

type TabId = (typeof tabs)[number]['id'];

export function InfoTabs({ active }: { active: TabId }) {
  return (
    <div className='flex items-center gap-6 text-sm text-slate-600'>
      {tabs.map(tab => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={active === tab.id ? 'page' : undefined}
          className={cn(
            'border-b-2 pb-1 transition-colors',
            active === tab.id
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent hover:text-slate-900'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
