import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextPath = url.searchParams.get('next') ?? '/chat';

  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/?error=auth_callback_failed', url.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const firstName = user.user_metadata?.first_name as string | undefined;
    const lastName = user.user_metadata?.last_name as string | undefined;
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      [firstName, lastName].filter(Boolean).join(' ').trim();

    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, username: true },
    });

    const usernameSeed =
      (user.user_metadata?.username as string | undefined) ??
      [fullName, firstName, lastName, user.email?.split('@')[0], 'user'].find(Boolean) ??
      'user';
    const resolvedUsername =
      existingUser?.username ?? (await generateUniqueUsername(usernameSeed));

    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email!,
        name: fullName || null,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        username: resolvedUsername,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
      update: {
        email: user.email!,
        name: fullName || null,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        username: resolvedUsername,
        ...(user.user_metadata?.avatar_url && { avatarUrl: user.user_metadata.avatar_url }),
      },
    });
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
