'use client';

import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { bigSmile } from '@dicebear/collection';

interface UserAvatarProps {
  seed?: string | null;
  options?: any;
  className?: string;
  size?: number;
}

export function UserAvatar({ seed, options, className = 'h-10 w-10', size = 100 }: UserAvatarProps) {
  const avatarSvg = useMemo(() => {
    const avatar = createAvatar(bigSmile, {
      seed: seed || 'default',
      size,
      ...options,
    });
    return avatar.toString();
  }, [seed, options, size]);

  return (
    <div 
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-light [&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: avatarSvg }}
    />
  );
}
