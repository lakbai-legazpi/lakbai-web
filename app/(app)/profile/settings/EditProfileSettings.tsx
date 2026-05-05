'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Toast } from '@/app/(app)/_components/Notificaiton';
import { UserAvatar } from '@/components/UserAvatar';
import { getRandomSeed } from '@/lib/avatars';

type SettingsTab = 'edit-profile' | 'avatar' | 'account-settings';

interface EditProfileSettingsProps {
  profile: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    avatarSeed: string | null;
    avatarOptions: any;
    location: string | null;
    bio: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
    tiktokUrl: string | null;
    youtubeUrl: string | null;
  };
}

const bigSmileAttributes = {
  accessories: ['none', 'catEars', 'glasses', 'sunglasses', 'faceMask', 'mustache'],
  eyes: ['normal', 'cheery', 'starstruck', 'winking', 'sleepy', 'sad', 'angry'],
  mouth: ['openedSmile', 'teethSmile', 'gapSmile', 'kawaii', 'awkwardSmile', 'unimpressed', 'openSad'],
  hair: ['shortHair', 'straightHair', 'wavyBob', 'curlyBob', 'braids', 'bunHair', 'mohawk', 'shavedHead'],
  skinColor: ['ffe4c0', 'f5d7b1', 'efcc9f', 'e2ba87', 'c99c62', 'a47539', '8c5a2b', '643d19'],
  hairColor: ['220f00', '3a1a00', '71472d', 'e2ba87', '605de4', '238d80', 'd56c0c', 'e9b729'],
};

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxAvatarSizeInBytes = 2 * 1024 * 1024;

function extractSocialHandle(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const cleanedPath = parsedUrl.pathname.split('/').filter(Boolean)[0];
    if (!cleanedPath) return null;

    return `@${cleanedPath}`;
  } catch {
    return null;
  }
}

export function EditProfileSettings({ profile }: EditProfileSettingsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('edit-profile');

  const [firstName, setFirstName] = useState(profile.firstName ?? '');
  const [lastName, setLastName] = useState(profile.lastName ?? '');
  const [username, setUsername] = useState(profile.username);
  const [location, setLocation] = useState(profile.location ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarSeed, setAvatarSeed] = useState(profile.avatarSeed || getRandomSeed());
  const [avatarOptions, setAvatarOptions] = useState(profile.avatarOptions || {});

  const [facebookUrl, setFacebookUrl] = useState(profile.facebookUrl ?? '');
  const [instagramUrl, setInstagramUrl] = useState(profile.instagramUrl ?? '');
  const [tiktokUrl, setTiktokUrl] = useState(profile.tiktokUrl ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(profile.youtubeUrl ?? '');

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isToastOpen, setIsToastOpen] = useState(false);

  const displayName = useMemo(() => {
    const name = `${firstName} ${lastName}`.trim();
    return name || `@${username}`;
  }, [firstName, lastName, username]);

  const openToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
    setTimeout(() => setIsToastOpen(false), 3000);
  };

  const handleOptionChange = (key: string, value: string) => {
    setAvatarOptions((prev: any) => {
      const newOptions = { ...prev };
      
      if (key === 'accessories' && value === 'none') {
        newOptions.accessoriesProbability = 0;
        delete newOptions.accessories;
      } else {
        if (key === 'accessories') {
          newOptions.accessoriesProbability = 100;
        }
        newOptions[key] = [value];
      }
      
      return newOptions;
    });
  };

  const handleRandomize = () => {
    setAvatarSeed(getRandomSeed());
    setAvatarOptions({});
    openToast('Avatar randomized!', 'success');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          location,
          bio,
          avatarSeed,
          avatarOptions,
          facebookUrl,
          instagramUrl,
          tiktokUrl,
          youtubeUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to update profile.');
      }

      openToast('Profile updated successfully.', 'success');
      router.push(`/profile/${data.profile.username}`);
      router.refresh();
    } catch (error) {
      openToast(error instanceof Error ? error.message : 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='bg-surface text-text-main h-full w-full overflow-y-auto'>
      <div className='mx-auto flex min-h-full w-full max-w-6xl gap-6 px-4 py-8 sm:px-8'>
        <aside className='border-border bg-background h-fit w-64 rounded-2xl border p-3'>
          <p className='text-text-muted px-3 pb-2 text-xs font-semibold uppercase'>Account</p>
          <button
            type='button'
            onClick={() => setActiveTab('edit-profile')}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              activeTab === 'edit-profile'
                ? 'bg-surface-light text-text-main'
                : 'text-text-muted hover:bg-surface-light hover:text-text-main'
            }`}
          >
            Edit profile
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('avatar')}
            className={`mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              activeTab === 'avatar'
                ? 'bg-surface-light text-text-main'
                : 'text-text-muted hover:bg-surface-light hover:text-text-main'
            }`}
          >
            Avatar customization
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('account-settings')}
            className={`mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
              activeTab === 'account-settings'
                ? 'bg-surface-light text-text-main'
                : 'text-text-muted hover:bg-surface-light hover:text-text-main'
            }`}
          >
            Your account settings
          </button>
        </aside>

        <section className='border-border bg-background flex-1 rounded-2xl border p-6'>
          {activeTab === 'edit-profile' ? (
            <div className='space-y-6'>
              <h1 className='text-2xl font-semibold'>Edit profile</h1>

              <div className='flex items-center gap-4'>
                <UserAvatar seed={avatarSeed} options={avatarOptions} className='h-20 w-20' size={200} />
                <div>
                  <p className='text-lg font-semibold'>{displayName}</p>
                  <p className='text-text-muted text-sm'>@{username.replace(/^@+/, '')}</p>
                </div>
                <button
                  type='button'
                  onClick={() => setActiveTab('avatar')}
                  className='bg-surface-light hover:bg-surface-hover text-text-main ml-auto rounded-full px-4 py-2 text-sm font-semibold'
                >
                  Customize avatar
                </button>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <label className='text-text-muted mb-1 block text-xs font-semibold uppercase'>First name</label>
                  <input
                    type='text'
                    value={firstName}
                    onChange={event => setFirstName(event.target.value)}
                    className='border-border bg-surface-light w-full rounded-xl border px-3 py-2 text-sm'
                  />
                </div>
                <div>
                  <label className='text-text-muted mb-1 block text-xs font-semibold uppercase'>Last name</label>
                  <input
                    type='text'
                    value={lastName}
                    onChange={event => setLastName(event.target.value)}
                    className='border-border bg-surface-light w-full rounded-xl border px-3 py-2 text-sm'
                  />
                </div>
              </div>

              <div>
                <label className='text-text-muted mb-1 block text-xs font-semibold uppercase'>Username</label>
                <div className='border-border bg-surface-light flex items-center rounded-xl border px-3'>
                  <span className='text-text-muted text-sm'>@</span>
                  <input
                    type='text'
                    value={username.replace(/^@+/, '')}
                    onChange={event => setUsername(event.target.value.replace(/^@+/, ''))}
                    className='w-full bg-transparent px-1 py-2 text-sm outline-none'
                  />
                </div>
              </div>

              <div>
                <label className='text-text-muted mb-1 block text-xs font-semibold uppercase'>Location</label>
                <input
                  type='text'
                  value={location}
                  onChange={event => setLocation(event.target.value)}
                  className='border-border bg-surface-light w-full rounded-xl border px-3 py-2 text-sm'
                />
              </div>

              <div>
                <label className='text-text-muted mb-1 block text-xs font-semibold uppercase'>Bio</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={event => setBio(event.target.value)}
                  className='border-border bg-surface-light w-full rounded-xl border px-3 py-2 text-sm'
                />
              </div>

              <div className='space-y-3'>
                <p className='text-text-muted text-xs font-semibold uppercase'>Socials</p>
                {(
                  [
                    ['Facebook', facebookUrl, setFacebookUrl],
                    ['Instagram', instagramUrl, setInstagramUrl],
                    ['TikTok', tiktokUrl, setTiktokUrl],
                    ['YouTube', youtubeUrl, setYoutubeUrl],
                  ] as const
                ).map(([label, value, setValue]) => (
                  <div key={label}>
                    <label className='mb-1 block text-sm font-medium'>{label}</label>
                    <input
                      type='url'
                      value={value}
                      onChange={event => setValue(event.target.value)}
                      placeholder={`https://${label.toLowerCase()}.com/username`}
                      className='border-border bg-surface-light w-full rounded-xl border px-3 py-2 text-sm'
                    />
                    {extractSocialHandle(value) && (
                      <a
                        href={value}
                        target='_blank'
                        rel='noreferrer'
                        className='text-primary-600 mt-1 inline-block text-xs hover:underline'
                      >
                        {extractSocialHandle(value)}
                      </a>
                    )}
                  </div>
                ))}
              </div>

                <div className='flex justify-end gap-3'>
                  <Link
                    href={`/profile/${username.replace(/^@+/, '')}`}
                    className='border-border hover:bg-surface-light rounded-full border px-5 py-2 text-sm'
                  >
                    Cancel
                  </Link>
                  <button
                    type='button'
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className='bg-primary-500 hover:bg-primary-600 rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-60'
                  >
                    {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Save changes'}
                  </button>
                </div>
              </div>
            ) : activeTab === 'avatar' ? (
              <div className='space-y-6'>
                <div className='flex items-center justify-between'>
                  <h1 className='text-2xl font-semibold'>Customize your avatar</h1>
                  <button
                    type='button'
                    onClick={handleRandomize}
                    className='text-primary-600 text-sm font-medium hover:underline'
                  >
                    Randomize
                  </button>
                </div>

                <div className='flex justify-center py-6'>
                  <UserAvatar seed={avatarSeed} options={avatarOptions} className='h-40 w-40' size={400} />
                </div>

                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                  {Object.entries(bigSmileAttributes).map(([key, options]) => (
                    <div key={key}>
                      <label className='text-text-muted mb-1 block text-xs font-semibold uppercase'>{key}</label>
                      <div className='flex flex-wrap gap-2'>
                        {options.map(option => {
                          const isColor = key.toLowerCase().includes('color');
                          const isSelected = avatarOptions[key]?.[0] === option || (option === 'none' && avatarOptions.accessoriesProbability === 0);
                          
                          if (isColor) {
                            return (
                              <button
                                key={option}
                                type='button'
                                onClick={() => handleOptionChange(key, option)}
                                className={`h-8 w-8 rounded-full border-2 transition ${
                                  isSelected ? 'border-primary-500 scale-110 shadow-sm' : 'border-border/50 hover:scale-105'
                                }`}
                                style={{ backgroundColor: `#${option}` }}
                                title={`#${option}`}
                              />
                            );
                          }

                          return (
                            <button
                              key={option}
                              type='button'
                              onClick={() => handleOptionChange(key, option)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                isSelected
                                  ? 'bg-primary-500 border-primary-500 text-white'
                                  : 'border-border bg-surface-light text-text-main hover:border-text-muted'
                              }`}
                            >
                              {option.replace(/([A-Z])/g, ' $1').trim()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className='flex justify-end gap-3 pt-4'>
                  <button
                    type='button'
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className='bg-primary-500 hover:bg-primary-600 rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-60'
                  >
                    {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Save changes'}
                  </button>
                </div>
              </div>
            ) : (
            <div className='space-y-3'>
              <h1 className='text-2xl font-semibold'>Your account settings</h1>
              <p className='text-text-muted text-sm'>
                Manage core account information.
              </p>
              <div className='border-border rounded-xl border p-4'>
                <p className='text-text-muted text-xs font-semibold uppercase'>Email</p>
                <p className='mt-1 text-sm'>{profile.email}</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <Toast
        isOpen={isToastOpen}
        message={toastMessage}
        type={toastType}
        onClose={() => setIsToastOpen(false)}
      />
    </div>
  );
}
