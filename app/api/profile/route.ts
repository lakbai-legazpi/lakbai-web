import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

type UpdateProfileBody = {
  firstName?: string;
  lastName?: string;
  username?: string;
  location?: string | null;
  bio?: string | null;
  avatarSeed?: string;
  avatarOptions?: any;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
};

const socialHostMap: Record<
  'facebookUrl' | 'instagramUrl' | 'tiktokUrl' | 'youtubeUrl',
  string[]
> = {
  facebookUrl: ['facebook.com', 'www.facebook.com'],
  instagramUrl: ['instagram.com', 'www.instagram.com'],
  tiktokUrl: ['tiktok.com', 'www.tiktok.com'],
  youtubeUrl: ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'],
};

function normalizeUrlOrNull(value?: string | null): string | null {
  if (!value) return null;
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  return trimmedValue;
}

function normalizeTextOrNull(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  return trimmedValue;
}

function normalizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9._-]/g, '');
}

function isValidUsername(value: string): boolean {
  return /^[a-z0-9._-]{3,30}$/.test(value);
}

function validateSocialUrl(
  value: string | null,
  hosts: string[]
): { valid: boolean; normalizedValue: string | null } {
  if (!value) return { valid: true, normalizedValue: null };

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (!hosts.includes(host)) {
      return { valid: false, normalizedValue: null };
    }

    return { valid: true, normalizedValue: url.toString() };
  } catch {
    return { valid: false, normalizedValue: null };
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      username: true,
      avatarSeed: true,
      avatarOptions: true,
      location: true,
      bio: true,
      facebookUrl: true,
      instagramUrl: true,
      tiktokUrl: true,
      youtubeUrl: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as UpdateProfileBody;
  const username = body.username ? normalizeUsername(body.username) : undefined;

  if (username && !isValidUsername(username)) {
    return NextResponse.json(
      { error: 'Username must be 3-30 chars using letters, numbers, ., _, -.' },
      { status: 400 }
    );
  }

  const socialUpdates = {
    facebookUrl: normalizeUrlOrNull(body.facebookUrl),
    instagramUrl: normalizeUrlOrNull(body.instagramUrl),
    tiktokUrl: normalizeUrlOrNull(body.tiktokUrl),
    youtubeUrl: normalizeUrlOrNull(body.youtubeUrl),
  };

  for (const [key, value] of Object.entries(socialUpdates)) {
    const { valid, normalizedValue } = validateSocialUrl(
      value,
      socialHostMap[key as keyof typeof socialHostMap]
    );

    if (!valid) {
      return NextResponse.json(
        { error: `Invalid ${key}. Please use the proper social profile URL.` },
        { status: 400 }
      );
    }

    socialUpdates[key as keyof typeof socialUpdates] = normalizedValue;
  }

  try {
    const firstName = body.firstName?.trim() || null;
    const lastName = body.lastName?.trim() || null;
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null;

    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(fullName !== null && { name: fullName }),
        ...(username !== undefined && { username }),
        ...(body.location !== undefined && { location: normalizeTextOrNull(body.location) }),
        ...(body.bio !== undefined && { bio: normalizeTextOrNull(body.bio) }),
        ...(body.avatarSeed !== undefined && { avatarSeed: body.avatarSeed }),
        ...(body.avatarOptions !== undefined && { avatarOptions: body.avatarOptions }),
        facebookUrl: socialUpdates.facebookUrl,
        instagramUrl: socialUpdates.instagramUrl,
        tiktokUrl: socialUpdates.tiktokUrl,
        youtubeUrl: socialUpdates.youtubeUrl,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        avatarSeed: true,
        avatarOptions: true,
        location: true,
        bio: true,
        facebookUrl: true,
        instagramUrl: true,
        tiktokUrl: true,
        youtubeUrl: true,
      },
    });

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes('Unique constraint')
        ? 'Username is already taken.'
        : 'Failed to update profile.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
