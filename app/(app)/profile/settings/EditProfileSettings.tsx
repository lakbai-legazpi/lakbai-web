'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, UserCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Toast } from '@/app/(app)/_components/Notificaiton';

type SettingsTab = 'edit-profile' | 'account-settings';

interface EditProfileSettingsProps {
  profile: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    avatarUrl: string | null;
    location: string | null;
    bio: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
    tiktokUrl: string | null;
    youtubeUrl: string | null;
  };
}

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
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? '');
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

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!allowedImageTypes.includes(selectedFile.type)) {
      openToast('Invalid file type. Only JPG, PNG, and WEBP are allowed.', 'error');
      event.target.value = '';
      return;
    }

    if (selectedFile.size > maxAvatarSizeInBytes) {
      openToast('Image is too large. Max file size is 2MB.', 'error');
      event.target.value = '';
      return;
    }

    const extension = selectedFile.name.split('.').pop() ?? 'jpg';
    const filePath = `${profile.id}/avatar-${Date.now()}.${extension}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from('avatar')
      .upload(filePath, selectedFile, {
        upsert: true,
        contentType: selectedFile.type,
      });

    if (uploadError) {
      openToast(uploadError.message, 'error');
      event.target.value = '';
      return;
    }

    const { data } = supabase.storage.from('avatar').getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    openToast('Profile picture updated.', 'success');
    event.target.value = '';
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
          avatarUrl,
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
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt='Current profile picture'
                    className='h-18 w-18 rounded-full object-cover'
                  />
                ) : (
                  <div className='bg-surface-light flex h-18 w-18 items-center justify-center rounded-full'>
                    <UserCircle2 className='text-text-muted h-10 w-10' />
                  </div>
                )}
                <div>
                  <p className='text-lg font-semibold'>{displayName}</p>
                  <p className='text-text-muted text-sm'>@{username.replace(/^@+/, '')}</p>
                </div>
                <label className='bg-primary-500 hover:bg-primary-600 ml-auto cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-white'>
                  Change photo
                  <input
                    type='file'
                    accept='image/jpeg,image/png,image/webp'
                    className='hidden'
                    onChange={handleAvatarUpload}
                  />
                </label>
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
