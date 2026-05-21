import Link from 'next/link';
import {
  Bookmark,
  Gift,
  Luggage,
  MapPin,
  MapPinHouse,
  Star,
  Navigation,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { ProfileActionsMenu } from '../_components/ProfileActionsMenu';
import { UserAvatar } from '@/components/UserAvatar';

type ProfilePageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
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

export default async function PublicProfilePage({ params, searchParams }: ProfilePageProps) {
  const { username } = await params;
  const { tab: queryTab } = await searchParams;
  const activeTabName = queryTab?.toLowerCase() || 'journeys';
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
      avatarSeed: true,
      avatarOptions: true,
      location: true,
      bio: true,
      facebookUrl: true,
      instagramUrl: true,
      tiktokUrl: true,
      youtubeUrl: true,
      journeys: activeTabName === 'journeys',
      favorites: activeTabName === 'favorites' ? { include: { poi: true } } : false,
      reviews: activeTabName === 'reviews' ? { include: { poi: true }, orderBy: { createdAt: 'desc' as const } } : false,
      contributions: activeTabName === 'contributions' ? { include: { poi: true }, orderBy: { createdAt: 'desc' as const } } : false,
      _count: {
        select: {
          journeys: true,
          favorites: true,
          reviews: true,
          contributions: {
            where: {
              status: 'APPROVED',
              poiId: { not: null }
            }
          },
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
    { id: 'journeys', label: 'Journeys', count: profile._count.journeys, icon: Luggage, active: activeTabName === 'journeys' },
    { id: 'favorites', label: 'Favorites', count: profile._count.favorites, icon: Bookmark, active: activeTabName === 'favorites' },
    { id: 'reviews', label: 'Reviews', count: profile._count.reviews, icon: Star, active: activeTabName === 'reviews' },
    { id: 'contributions', label: 'Contributions', count: profile._count.contributions, icon: MapPinHouse, active: activeTabName === 'contributions' },
  ];

  const isOwnProfile = Boolean(currentUser?.id && currentUser.id === profile.id);

  return (
    <div className='bg-surface text-text-main h-full w-full overflow-y-auto'>
      <div className='mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-8 sm:px-8'>
        <section className='flex flex-col gap-6 items-center'>
          <div className='flex w-full flex-col items-center text-center gap-4'>
            <div className='flex flex-col items-center gap-4'>
              <div className='from-primary-400 via-secondary-400 to-primary-300 relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br p-0.5'>
                <UserAvatar seed={profile.avatarSeed} options={profile.avatarOptions} className='h-full w-full' size={200} />
              </div>

              <div className='space-y-1.5 flex flex-col items-center'>
                <div>
                  <h1 className='text-text-main text-xl leading-tight font-semibold'>
                    {fullName}
                  </h1>
                  <p className='text-text-muted text-sm'>
                    @{profile.username}
                  </p>
                </div>

                {profile.location && (
                  <div className='text-text-muted flex items-center justify-center gap-1 text-sm'>
                    <MapPin className='h-3.5 w-3.5' />
                    <span>{profile.location}</span>
                  </div>
                )}

                {profile.bio && (
                  <p className='text-text-main max-w-lg text-sm mt-2'>
                    {profile.bio}
                  </p>
                )}

                <div className='flex flex-wrap justify-center gap-3 text-xs mt-2'>
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
              <div className='mt-2'>
                <ProfileActionsMenu username={profile.username || ''} />
              </div>
            ) : (
              <Link
                href={`/profile/${profile.username || ''}`}
                className='text-text-muted hover:text-text-main text-xs underline mt-2'
              >
                Profile link
              </Link>
            )}
          </div>

          <div className='border-border border-b w-full mt-2'>
            <nav className='flex flex-wrap items-center justify-center gap-6 pb-3 sm:gap-8'>
              {tabs.map(tab => {
                const Icon = tab.icon;

                return (
                  <Link
                    key={tab.id}
                    href={`?tab=${tab.id}`}
                    scroll={false}
                    className={`group relative inline-flex items-center gap-1.5 text-sm transition ${
                      tab.active
                        ? 'text-text-main'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    <Icon className='h-4 w-4' />
                    <span>{tab.label}</span>
                    <span>{tab.count}</span>

                    {tab.active && (
                      <span className='bg-primary-500 absolute -bottom-3.25 left-0 h-0.5 w-full rounded-full' />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </section>

        <section className='flex flex-1 flex-col py-8'>
          {activeTabName === 'journeys' && (
            <div className='w-full'>
              {profile.journeys && profile.journeys.length > 0 ? (
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                  {profile.journeys.map(journey => (
                    <Link
                      key={journey.id}
                      href={`/chat/${journey.id}`}
                      className='group border-border bg-surface-light flex flex-col rounded-2xl border p-5 transition hover:shadow-lg'
                    >
                      <div className='mb-3 flex items-center justify-between'>
                        <div className='bg-primary-100 text-primary-700 flex h-10 w-10 items-center justify-center rounded-full'>
                          <Navigation className='h-5 w-5' />
                        </div>
                        <span className='text-text-muted text-xs font-medium'>
                          {formatDistanceToNow(new Date(journey.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className='text-text-main group-hover:text-primary-600 line-clamp-1 text-lg font-semibold transition'>
                        {journey.title}
                      </h3>
                      <p className='text-text-muted mt-2 line-clamp-2 text-sm'>
                        {journey.description || journey.destination || 'No description available.'}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-14 text-center'>
                  <div className='from-primary-100 via-secondary-100 to-primary-200 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br shadow-[0_20px_40px_rgba(2,128,144,0.22)]'>
                    <Luggage className='text-primary-700 h-8 w-8' />
                  </div>
                  <h2 className='text-text-main text-2xl font-semibold sm:text-3xl'>No journeys yet</h2>
                  <p className='text-text-muted mt-2 text-base sm:text-xl'>This user hasn't created any journeys.</p>
                </div>
              )}
            </div>
          )}

          {activeTabName === 'favorites' && (
            <div className='w-full'>
              {profile.favorites && profile.favorites.length > 0 ? (
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                  {profile.favorites.map((favorite: any) => (
                    <Link
                      key={favorite.id}
                      href={`/explore?poi=${favorite.poi.id}`}
                      className='group border-border bg-surface-light flex flex-col rounded-2xl border p-5 transition hover:shadow-lg'
                    >
                      <div className='mb-3 flex items-center justify-between'>
                        <div className='bg-rose-100 text-rose-600 flex h-10 w-10 items-center justify-center rounded-full'>
                          <Bookmark className='h-5 w-5 fill-current' />
                        </div>
                        <span className='text-text-muted text-xs font-medium'>
                          {formatDistanceToNow(new Date(favorite.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className='text-text-main group-hover:text-primary-600 line-clamp-1 text-lg font-semibold transition'>
                        {favorite.poi.name}
                      </h3>
                      <p className='text-text-muted mt-2 flex items-center gap-1.5 text-sm'>
                        <MapPin className='h-4 w-4 shrink-0' />
                        <span className='line-clamp-1'>Location Details</span>
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-14 text-center'>
                  <div className='from-rose-100 to-rose-200 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br shadow-[0_20px_40px_rgba(225,29,72,0.22)]'>
                    <Bookmark className='text-rose-600 h-8 w-8' />
                  </div>
                  <h2 className='text-text-main text-2xl font-semibold sm:text-3xl'>No favorites yet</h2>
                  <p className='text-text-muted mt-2 text-base sm:text-xl'>This user hasn't saved any locations.</p>
                </div>
              )}
            </div>
          )}

          {activeTabName === 'reviews' && (
            <div className='w-full'>
              {profile.reviews && profile.reviews.length > 0 ? (
                <div className='flex flex-col gap-4'>
                  {profile.reviews.map((review: any) => (
                    <Link
                      key={review.id}
                      href={`/explore?poi=${review.poi.id}`}
                      className='border-border bg-surface-light group block rounded-2xl border p-5 transition hover:shadow-md'
                    >
                      <div className='flex items-start justify-between gap-4'>
                        <div>
                          <h3 className='text-text-main group-hover:text-primary-600 text-lg font-semibold transition'>
                            {review.poi.name}
                          </h3>
                          <div className='mt-1 flex items-center gap-1'>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-border fill-transparent'}`}
                              />
                            ))}
                            <span className='text-text-muted ml-2 text-xs font-medium'>
                              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className='text-text-main mt-3 text-sm italic'>"{review.content}"</p>
                        </div>
                        <MessageSquare className='text-text-muted h-6 w-6 shrink-0' />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-14 text-center'>
                  <div className='from-amber-100 to-amber-200 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br shadow-[0_20px_40px_rgba(251,191,36,0.22)]'>
                    <Star className='text-amber-600 h-8 w-8' />
                  </div>
                  <h2 className='text-text-main text-2xl font-semibold sm:text-3xl'>No reviews yet</h2>
                  <p className='text-text-muted mt-2 text-base sm:text-xl'>This user hasn't reviewed any locations.</p>
                </div>
              )}
            </div>
          )}

          {activeTabName === 'contributions' && (
            <div className='w-full'>
              {(() => {
                const validContributions = profile.contributions?.filter(
                  (c: any) => c.status === 'APPROVED' && c.poi
                ) || [];

                if (validContributions.length > 0) {
                  return (
                    <div className='flex flex-col gap-4'>
                      {validContributions.map((contribution: any) => (
                        <Link
                          key={contribution.id}
                          href={`/explore?poi=${contribution.poi.id}`}
                          className='border-border bg-surface-light group block rounded-2xl border p-5 transition hover:shadow-md'
                        >
                          <div className='flex items-start justify-between gap-4'>
                            <div>
                              <div className='mb-2 flex items-center gap-2'>
                                <span className='bg-emerald-100 text-emerald-700 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold'>
                                  <CheckCircle className='h-3.5 w-3.5' /> Approved
                                </span>
                                <span className='text-text-muted text-xs font-medium'>
                                  {formatDistanceToNow(new Date(contribution.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              
                              <h3 className='text-text-main group-hover:text-primary-600 text-lg font-semibold transition'>
                                {contribution.poi.name}
                              </h3>
                              <p className='text-text-muted mt-1 text-sm'>
                                {contribution.type === 'CREATE' ? 'Proposed a new location to the map.' : 'Suggested edits to an existing location.'}
                              </p>
                            </div>
                            <MapPinHouse className='text-text-muted h-6 w-6 shrink-0' />
                          </div>
                        </Link>
                      ))}
                    </div>
                  );
                }

                return (
                  <div className='flex flex-col items-center justify-center py-14 text-center'>
                    <div className='from-emerald-100 to-emerald-200 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br shadow-[0_20px_40px_rgba(52,211,153,0.22)]'>
                      <MapPinHouse className='text-emerald-600 h-8 w-8' />
                    </div>
                    <h2 className='text-text-main text-2xl font-semibold sm:text-3xl'>No contributions yet</h2>
                    <p className='text-text-muted mt-2 text-base sm:text-xl'>This user hasn't successfully contributed any map data.</p>
                  </div>
                );
              })()}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
