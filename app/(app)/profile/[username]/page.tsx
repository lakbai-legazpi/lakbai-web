import Link from 'next/link';
import {
  Bookmark,
  Gift,
  Luggage,
  MapPin,
  MapPinHouse,
  Star,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { ProfileActionsMenu } from '../_components/ProfileActionsMenu';

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

function getSocialHandle(value: string): string {
  try {
    const url = new URL(value);
    const handle = url.pathname.split('/').filter(Boolean)[0];
    if (!handle) return value;
    return `@${handle}`;
  } catch {
    return value;
  }
}

function getInitials(firstName: string | null, lastName: string | null, username: string | null): string {
  const firstInitial = firstName?.trim().charAt(0) ?? '';
  const lastInitial = lastName?.trim().charAt(0) ?? '';
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();
  if (initials.length > 0) return initials;

  return (username || '').slice(0, 2).toUpperCase();
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const normalizedUsername = username.replace(/^@+/, '').toLowerCase();

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const profile = await prisma.user.findFirst({
    where: { username: normalizedUsername },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      location: true,
      bio: true,
      facebookUrl: true,
      instagramUrl: true,
      tiktokUrl: true,
      youtubeUrl: true,
      _count: {
        select: {
          journeys: true,
          favorites: true,
          reviews: true,
          contributions: true,
        },
      },
    },
  });

  if (!profile) {
    notFound();
  }

  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
    `@${profile.username}`;

  const tabs = [
    { label: 'Journeys', count: profile._count.journeys, icon: Luggage, active: true },
    { label: 'Favorites', count: profile._count.favorites, icon: Bookmark, active: false },
    { label: 'Reviews', count: profile._count.reviews, icon: Star, active: false },
    { label: 'Contributions', count: profile._count.contributions, icon: MapPinHouse, active: false },
  ];

  const isOwnProfile = Boolean(currentUser?.id && currentUser.id === profile.id);

  return (
    <div className='bg-surface text-text-main h-full w-full overflow-y-auto'>
      <div className='mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-8 sm:px-8'>
        <section className='flex flex-col gap-6 sm:gap-8'>
          <div className='flex w-full flex-col gap-5 sm:flex-row sm:items-start sm:justify-between'>
            <div className='flex items-start gap-4 sm:gap-6'>
              <div className='from-primary-400 via-secondary-400 to-primary-300 relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br p-0.5 sm:h-24 sm:w-24'>
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={`${fullName} profile image`}
                    className='bg-surface h-full w-full rounded-full object-cover'
                  />
                ) : (
                  <div className='bg-surface text-text-main flex h-full w-full items-center justify-center rounded-full text-xl font-bold'>
                    {getInitials(profile.firstName, profile.lastName, profile.username)}
                  </div>
                )}
              </div>

              <div className='space-y-2'>
                <div>
                  <h1 className='text-text-main text-xl leading-tight font-semibold sm:text-3xl'>
                    {fullName}
                  </h1>
                  <p className='text-text-muted text-sm sm:text-base'>
                    @{profile.username}
                  </p>
                </div>

                {profile.location && (
                  <div className='text-text-muted flex items-center gap-2 text-sm sm:text-xl'>
                    <MapPin className='h-4 w-4 sm:h-5 sm:w-5' />
                    <span>{profile.location}</span>
                  </div>
                )}

                {profile.bio && (
                  <p className='text-text-main max-w-2xl text-sm sm:text-base'>
                    {profile.bio}
                  </p>
                )}

                <div className='flex flex-wrap gap-3 text-sm'>
                  {profile.facebookUrl && (
                    <a href={profile.facebookUrl} target='_blank' rel='noreferrer' className='text-primary-600 hover:underline'>
                      {getSocialHandle(profile.facebookUrl)}
                    </a>
                  )}
                  {profile.instagramUrl && (
                    <a href={profile.instagramUrl} target='_blank' rel='noreferrer' className='text-primary-600 hover:underline'>
                      {getSocialHandle(profile.instagramUrl)}
                    </a>
                  )}
                  {profile.tiktokUrl && (
                    <a href={profile.tiktokUrl} target='_blank' rel='noreferrer' className='text-primary-600 hover:underline'>
                      {getSocialHandle(profile.tiktokUrl)}
                    </a>
                  )}
                  {profile.youtubeUrl && (
                    <a href={profile.youtubeUrl} target='_blank' rel='noreferrer' className='text-primary-600 hover:underline'>
                      {getSocialHandle(profile.youtubeUrl)}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {isOwnProfile ? (
              <ProfileActionsMenu username={profile.username || ''} />
            ) : (
              <Link
                href={`/profile/${profile.username || ''}`}
                className='text-text-muted hover:text-text-main self-end text-sm underline sm:self-start'
              >
                Profile link
              </Link>
            )}
          </div>

          <div className='border-border border-b'>
            <nav className='flex flex-wrap items-center gap-6 pb-3 sm:justify-center sm:gap-8'>
              {tabs.map(tab => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.label}
                    type='button'
                    className={`group relative inline-flex items-center gap-2 text-sm transition sm:text-lg ${
                      tab.active
                        ? 'text-text-main'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    <Icon className='h-4 w-4 sm:h-5 sm:w-5' />
                    <span>{tab.label}</span>
                    <span>{tab.count}</span>

                    {tab.active && (
                      <span className='bg-primary-500 absolute -bottom-3.25 left-0 h-0.5 w-full rounded-full' />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </section>

        <section className='flex flex-1 items-center justify-center py-14'>
          <div className='flex max-w-xl flex-col items-center text-center'>
            <div className='from-primary-100 via-secondary-100 to-primary-200 mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br shadow-[0_20px_40px_rgba(2,128,144,0.22)]'>
              <Gift className='text-primary-700 h-8 w-8' />
            </div>

            <h2 className='text-text-main text-2xl font-semibold sm:text-3xl'>
              No public journeys yet? Let&apos;s fix that.
            </h2>
            <p className='text-text-muted mt-3 text-base sm:text-xl'>
              Start your first journey and share it with the community.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
