import { createAvatar } from '@dicebear/core';
import { bigSmile } from '@dicebear/collection';

export function getAvatarDataUri(seed: string, options: any = {}) {
  const avatar = createAvatar(bigSmile, {
    seed,
    ...options,
  });

  return avatar.toDataUri();
}

export function getRandomSeed() {
  return Math.random().toString(36).substring(7);
}
