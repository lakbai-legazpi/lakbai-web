import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function toUsernameSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length >= 3) return slug.slice(0, 30);

  return `user-${Math.random().toString(36).slice(2, 8)}`;
}

async function generateUniqueUsername(baseValue: string): Promise<string> {
  const baseUsername = toUsernameSlug(baseValue);
  let candidateUsername = baseUsername;
  let suffix = 1;

  while (true) {
    const existingUser = await prisma.user.findFirst({
      where: { username: candidateUsername },
      select: { id: true },
    });

    if (!existingUser) return candidateUsername;

    candidateUsername = `${baseUsername}-${suffix}`;
    suffix += 1;
  }
}

/**
 * POST /api/auth/sync-user
 * Upserts the authenticated Supabase user into our Prisma User table.
 * Called after sign-up to ensure User row exists for relations (journeys, reviews, etc.)
 */
export async function POST(request: Request) {
  let body: {
    firstName?: string;
    lastName?: string;
    username?: string;
  } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const metadataFirstName = (body.firstName ?? user.user_metadata?.first_name) as string | undefined;
  const metadataLastName = (body.lastName ?? user.user_metadata?.last_name) as string | undefined;
  const metadataFullName =
    (user.user_metadata?.full_name as string | undefined) ??
    [metadataFirstName, metadataLastName].filter(Boolean).join(' ').trim();

  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, username: true },
  });

  const fallbackName = user.email?.split('@')[0] ?? 'user';
  const usernameSeed = body.username || metadataFullName || metadataFirstName || metadataLastName || fallbackName;
  const resolvedUsername =
    existingUser?.username ?? (await generateUniqueUsername(usernameSeed));

  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email!,
      name: metadataFullName || null,
      firstName: metadataFirstName ?? null,
      lastName: metadataLastName ?? null,
      username: resolvedUsername,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    update: {
      email: user.email!,
      name: metadataFullName || null,
      firstName: metadataFirstName ?? null,
      lastName: metadataLastName ?? null,
      username: resolvedUsername,
      ...(user.user_metadata?.avatar_url && { avatarUrl: user.user_metadata.avatar_url }),
    },
  });

  return NextResponse.json({ ok: true });
}
