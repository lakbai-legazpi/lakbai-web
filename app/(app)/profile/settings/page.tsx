import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { EditProfileSettings } from './EditProfileSettings';

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      username: true,
      avatarUrl: true,
      location: true,
      bio: true,
      facebookUrl: true,
      instagramUrl: true,
      tiktokUrl: true,
      youtubeUrl: true,
    },
  });

  if (!profile) {
    redirect('/chat');
  }

  return <EditProfileSettings profile={{ ...profile, username: profile.username || '' }} />;
}
