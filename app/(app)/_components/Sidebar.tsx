'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { TextSubheading } from '@/components/text';
import NotificationsPanel, { type Contribution } from './NotificationsPanel';
import {
  MessageCircle,
  Luggage,
  Search,
  Navigation,
  MapPin,
  Bell,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/components/auth-provider';

type UserProfile = {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarSeed: string | null;
  avatarOptions: any;
};

export function Sidebar({ userProfile }: { userProfile?: UserProfile | null }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [collapsedMenuTop, setCollapsedMenuTop] = useState<number | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const iconTooltipClass =
    'pointer-events-none absolute top-1/2 left-full z-40 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-primary-dark-700 bg-primary-dark-900 px-2.5 py-1.5 text-xs font-medium text-primary-dark-50 opacity-0 shadow-sm transition-opacity';
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const profileMenuContentRef = useRef<HTMLDivElement>(null);

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isContributionsLoading, setIsContributionsLoading] = useState(false);
  const [contributionsError, setContributionsError] = useState<string | null>(null);

  const { openLogin } = useAuth();
  const router = useRouter();

  const fetchContributions = async () => {
    setIsContributionsLoading(true);
    setContributionsError(null);
    try {
      const res = await fetch('/api/contributions');
      if (!res.ok) {
        throw new Error('Failed to load notifications');
      }
      const data = await res.json();
      setContributions(data.contributions ?? []);
    } catch (err) {
      setContributionsError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsContributionsLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, []);

  const unreadCount = contributions.filter(
    c => c.status !== 'PENDING' && !c.isDismissed && !c.isRead && !(c.status === 'APPROVED' && !c.poi)
  ).length;

  const closeChatPopup = () => {
    window.dispatchEvent(new CustomEvent('close-chat-popup'));
  };

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    await fetch('/api/auth/sign-out', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      closeChatPopup();
      setIsNotificationsOpen(false);
      previousPathnameRef.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen || !isCollapsed) {
      setCollapsedMenuTop(null);
      return;
    }

    const updateCollapsedMenuPosition = () => {
      const triggerEl = profileTriggerRef.current;
      const menuEl = profileMenuContentRef.current;
      if (!triggerEl || !menuEl) return;

      const triggerRect = triggerEl.getBoundingClientRect();
      const menuRect = menuEl.getBoundingClientRect();
      const spacing = 8;
      const safeTop = 8;

      setCollapsedMenuTop(
        Math.max(safeTop, triggerRect.top - menuRect.height - spacing)
      );
    };

    updateCollapsedMenuPosition();
    window.addEventListener('resize', updateCollapsedMenuPosition);

    return () =>
      window.removeEventListener('resize', updateCollapsedMenuPosition);
  }, [isCollapsed, isProfileMenuOpen]);

  return (
    <aside
      className={cn(
        'group border-border bg-surface z-50 relative flex h-full flex-col border transition-all duration-300 ease-in-out print:hidden',
        isCollapsed ? 'w-22' : 'w-55'
      )}
    >
      {/* Logo Area */}
      <div
        className={cn(
          'group/logo relative flex h-24 items-center px-6',
          isCollapsed && 'cursor-pointer justify-center px-0'
        )}
        onClick={() => isCollapsed && setIsCollapsed(false)}
      >
        {/* Toggle Button Container */}
        <div
          className={cn(
            'absolute top-9 z-50 flex items-center justify-center transition-all duration-200',
            isCollapsed
              ? 'left-1/2 -translate-x-1/2 opacity-0 group-hover/logo:opacity-100' // Centered
              : 'right-4 opacity-0 group-hover/logo:opacity-100' // Right aligned
          )}
        >
          <button
            onClick={e => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className='group/toggle border-text-muted bg-surface text-text-muted relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border hover:bg-slate-100 focus:outline-none'
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
            <span
              className={cn(iconTooltipClass, 'group-hover/toggle:opacity-100')}
            >
              {isCollapsed ? 'Expand' : 'Collapse'}
            </span>
          </button>
        </div>

        {/* Logo Image */}
        <div
          className={cn(
            'relative h-8 w-8 shrink-0 transition-opacity duration-200',
            isCollapsed && 'group-hover/logo:opacity-0'
          )}
        >
          <Image
            src='/logos/lakbai.svg'
            alt='Lakbai'
            fill
            className='object-contain'
          />
        </div>

        {/* Logo Text */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300',
            isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-auto opacity-100'
          )}
        >
          <TextSubheading className='text-primary-500 font-bold'>
            lakbai
          </TextSubheading>
        </div>
      </div>

      {/* Nav */}
      <nav
        className={cn(
          'flex flex-1 flex-col gap-4 py-4',
          isCollapsed ? 'items-center px-0' : 'px-4'
        )}
      >
        {/* Chat - Global Overlay Toggle */}
        <button
          onClick={e => {
            e.preventDefault();
            setIsCollapsed(true); // Close the global sidebar on click to focus the popup
            window.dispatchEvent(new CustomEvent('toggle-chat-popup'));
          }}
          className={cn(
            'group/link relative flex items-center transition-colors',
            isCollapsed
              ? 'h-12 w-12 justify-center rounded-xl'
              : 'w-full rounded-lg px-3 py-3',
            pathname.startsWith('/chat')
              ? 'bg-primary-50 text-primary-600'
              : 'text-text-muted hover:text-text-main hover:bg-slate-100'
          )}
        >
          <MessageCircle size={24} strokeWidth={2} className='shrink-0' />
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-auto opacity-100'
            )}
          >
            <span className='font-medium whitespace-nowrap'>Chat</span>
          </div>
          <span
            className={cn(
              iconTooltipClass,
              isCollapsed ? 'group-hover/link:opacity-100' : 'hidden'
            )}
          >
            Chat
          </span>
        </button>

        {/* Journey */}
        <Link
          href='/journey'
          className={cn(
            'group/link relative flex items-center transition-colors',
            isCollapsed
              ? 'h-12 w-12 justify-center rounded-xl'
              : 'w-full rounded-lg px-3 py-3',
            pathname.startsWith('/journey')
              ? 'bg-primary-50 text-primary-600'
              : 'text-text-muted hover:text-text-main hover:bg-slate-100'
          )}
        >
          <Luggage size={24} strokeWidth={2} className='shrink-0' />
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-auto opacity-100'
            )}
          >
            <span className='font-medium whitespace-nowrap'>Journey</span>
          </div>
          <span
            className={cn(
              iconTooltipClass,
              isCollapsed ? 'group-hover/link:opacity-100' : 'hidden'
            )}
          >
            Journey
          </span>
        </Link>

        {/* Explore */}
        <Link
          href='/explore'
          className={cn(
            'group/link relative flex items-center transition-colors',
            isCollapsed
              ? 'h-12 w-12 justify-center rounded-xl'
              : 'w-full rounded-lg px-3 py-3',
            pathname.startsWith('/explore')
              ? 'bg-primary-50 text-primary-600'
              : 'text-text-muted hover:text-text-main hover:bg-slate-100'
          )}
        >
          <Search size={24} strokeWidth={2} className='shrink-0' />
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-auto opacity-100'
            )}
          >
            <span className='font-medium whitespace-nowrap'>Explore</span>
          </div>
          <span
            className={cn(
              iconTooltipClass,
              isCollapsed ? 'group-hover/link:opacity-100' : 'hidden'
            )}
          >
            Explore
          </span>
        </Link>

        {/* Navigate */}
        <Link
          href='/navigate'
          className={cn(
            'group/link relative flex items-center transition-colors',
            isCollapsed
              ? 'h-12 w-12 justify-center rounded-xl'
              : 'w-full rounded-lg px-3 py-3',
            pathname.startsWith('/navigate')
              ? 'bg-primary-50 text-primary-600'
              : 'text-text-muted hover:text-text-main hover:bg-slate-100'
          )}
        >
          <Navigation size={24} strokeWidth={2} className='shrink-0' />
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-auto opacity-100'
            )}
          >
            <span className='font-medium whitespace-nowrap'>Navigate</span>
          </div>
          <span
            className={cn(
              iconTooltipClass,
              isCollapsed ? 'group-hover/link:opacity-100' : 'hidden'
            )}
          >
            Navigate
          </span>
        </Link>

        {/* Contribute */}
        <Link
          href='/contribute'
          className={cn(
            'group/link relative flex items-center transition-colors',
            isCollapsed
              ? 'h-12 w-12 justify-center rounded-xl'
              : 'w-full rounded-lg px-3 py-3',
            pathname.startsWith('/contribute')
              ? 'bg-primary-50 text-primary-600'
              : 'text-text-muted hover:text-text-main hover:bg-slate-100'
          )}
        >
          <MapPin size={24} strokeWidth={2} className='shrink-0' />
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-auto opacity-100'
            )}
          >
            <span className='font-medium whitespace-nowrap'>Contribute</span>
          </div>
          <span
            className={cn(
              iconTooltipClass,
              isCollapsed ? 'group-hover/link:opacity-100' : 'hidden'
            )}
          >
            Contribute
          </span>
        </Link>
      </nav>

      {/* Footer */}
      <div
        className={cn(
          'flex flex-col gap-2 pb-8',
          isCollapsed ? 'items-center px-0' : 'px-4'
        )}
      >
        {/* Notifications */}
        <button
          type='button'
          onClick={() => {
            closeChatPopup();
            setIsProfileMenuOpen(false);
            setIsNotificationsOpen(prev => !prev);
          }}
          className={cn(
            'group/notify text-text-muted relative flex items-center transition-colors hover:bg-slate-100',
            isCollapsed
              ? 'h-12 w-12 justify-center rounded-xl'
              : 'w-full rounded-lg p-2'
          )}
        >
          <div className="relative shrink-0">
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className={cn(
                "absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white",
                isCollapsed && "scale-90"
              )}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-auto opacity-100'
            )}
          >
            <span className='font-medium whitespace-nowrap'>Notifications</span>
          </div>
          <span
            className={cn(
              iconTooltipClass,
              isCollapsed ? 'group-hover/notify:opacity-100' : 'hidden'
            )}
          >
            Notifications
          </span>
        </button>
        {isNotificationsOpen && (
          <div
            className='fixed inset-0 z-30'
            onClick={() => setIsNotificationsOpen(false)}
          />
        )}
        <NotificationsPanel
          open={isNotificationsOpen}
          onClose={() => {
            setIsNotificationsOpen(false);
            fetchContributions();
          }}
          className='absolute top-0 bottom-0 left-full z-[100]'
          contributions={contributions}
          isLoading={isContributionsLoading}
          error={contributionsError}
          onContributionsChange={setContributions}
        />
        {/* Profile */}
        <div ref={profileMenuRef} className='relative'>
          {isProfileMenuOpen && (
            <div
              ref={profileMenuContentRef}
              className={cn(
                'border-border bg-surface z-50 overflow-hidden rounded-lg border shadow-lg',
                isCollapsed
                  ? 'fixed left-4 w-64'
                  : 'absolute bottom-full left-0 mb-2 w-62.5'
              )}
              style={
                isCollapsed && collapsedMenuTop !== null
                  ? { top: collapsedMenuTop }
                  : undefined
              }
            >
              <div className='divide-border divide-y'>
                <Link
                  href='/profile'
                  onClick={() => setIsProfileMenuOpen(false)}
                  className='hover:bg-surface-light flex items-center justify-between px-4 py-3 transition-colors'
                >
                  <div className='flex flex-col items-start'>
                    <span className='text-text-main text-sm font-semibold'>
                      {userProfile?.firstName
                        ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim()
                        : 'User Profile'}
                    </span>
                    <span className='text-text-muted text-xs'>
                      View profile
                    </span>
                  </div>
                  <ChevronRight
                    size={16}
                    className='text-text-muted shrink-0'
                  />
                </Link>

                <button
                  type='button'
                  className='hover:bg-surface-light text-text-main w-full px-4 py-3 text-left text-sm font-medium transition-colors'
                >
                  Account Settings
                </button>

                <div className='px-4 py-2'>
                  <Link
                    href='/contact'
                    target='_blank'
                    rel='noreferrer'
                    onClick={() => setIsProfileMenuOpen(false)}
                    className='hover:bg-surface-light text-text-main block w-full rounded-md px-2 py-2 text-left text-sm transition-colors'
                  >
                    Give Feedback
                  </Link>
                  <Link
                    href='/privacy'
                    target='_blank'
                    rel='noreferrer'
                    onClick={() => setIsProfileMenuOpen(false)}
                    className='hover:bg-surface-light text-text-main block w-full rounded-md px-2 py-2 text-left text-sm transition-colors'
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href='/terms'
                    target='_blank'
                    rel='noreferrer'
                    onClick={() => setIsProfileMenuOpen(false)}
                    className='hover:bg-surface-light text-text-main block w-full rounded-md px-2 py-2 text-left text-sm transition-colors'
                  >
                    Terms of Service
                  </Link>
                </div>

                {/* Logout — separated by a top border */}
                <div className='border-border border-t'>
                  <button
                    type='button'
                    onClick={handleLogout}
                    className='hover:bg-surface-light flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-500 transition-colors hover:text-red-600'
                  >
                    <LogOut size={15} className='shrink-0' />
                    Log out
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            ref={profileTriggerRef}
            type='button'
            onClick={() => {
              if (!userProfile) {
                openLogin();
                return;
              }
              closeChatPopup();
              setIsProfileMenuOpen(prev => !prev);
            }}
            className={cn(
              'group/profile text-text-muted relative flex items-center transition-colors hover:bg-slate-100',
              isCollapsed
                ? 'h-12 w-12 justify-center rounded-xl'
                : 'w-full rounded-lg p-2'
            )}
          >
            {userProfile ? (
              <UserAvatar
                seed={userProfile.avatarSeed}
                options={userProfile.avatarOptions}
                className={cn('h-6 w-6 shrink-0', !isCollapsed && 'h-8 w-8')}
              />
            ) : (
              <UserCircle size={24} className='shrink-0' />
            )}
            <div
              className={cn(
                'flex flex-col items-start overflow-hidden transition-all duration-300',
                isCollapsed ? 'ml-0 w-0 opacity-0' : 'ml-3 w-auto opacity-100'
              )}
            >
              <span className='text-text-main text-sm font-medium whitespace-nowrap'>
                {userProfile
                  ? userProfile.firstName
                    ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim()
                    : 'User Profile'
                  : 'Sign In / Sign Up'}
              </span>
              <span className='text-text-muted text-xs whitespace-nowrap'>
                {userProfile?.username ? `@${userProfile.username}` : ''}
              </span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
