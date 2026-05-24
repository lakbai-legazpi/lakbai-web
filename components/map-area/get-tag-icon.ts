import {
  MapPin, Utensils, Landmark, TreePine, Bed, ShoppingBag,
  Beer, Coffee, Croissant, CookingPot, Church,
  Shrub, Footprints, Mountain, Tractor, Binoculars, Hotel, Route as Road,
  ShoppingBasket
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { POITag } from './types';
import { findTagSeedByName } from '@/lib/poi-tag-taxonomy';

import { Chapel } from '@/components/icons/Chapel';
import { Mosque } from '@/components/icons/Mosque';
import { Monument } from '@/components/icons/Monument';
import { Beach } from '@/components/icons/Beach';

const customIcons: Record<string, React.ElementType> = {
  Chapel,
  Mosque,
  Monument,
  Beach,
};

const lucideIconsMap: Record<string, React.ElementType> = {
  Utensils, Landmark, TreePine, Bed, ShoppingBag,
  Beer, Coffee, Croissant, CookingPot, Church,
  Shrub, Footprints, Mountain, Tractor, Binoculars, Hotel,
  Road, ShoppingBasket, MapPin
};

type TagIconComponent = ComponentType<{ className?: string }>;

export type TagVisual = {
  icon: TagIconComponent;
  color: string;
  clusterLabel: string;
};

function toClusterKey(clusterName?: string | null): string {
  return (clusterName ?? '').trim().toLowerCase();
}

function toClusterLabel(clusterName?: string | null): string {
  const key = toClusterKey(clusterName);

  if (!key) return '';
  if (key === 'food' || key === 'eats') return 'Food';
  if (key === 'attractions') return 'Attractions';
  if (key === 'nature') return 'Nature';
  if (key === 'accommodations' || key === 'accomodations') return 'Accommodations';
  if (key === 'malls') return 'Malls';

  return clusterName ?? '';
}

function getClusterColor(clusterName?: string | null): string {
  const clusterKey = toClusterKey(clusterName);

  switch (clusterKey) {
    case 'food':
    case 'eats':
      return 'bg-orange-500';
    case 'attractions':
      return 'bg-purple-500';
    case 'nature':
      return 'bg-emerald-600';
    case 'accommodations':
    case 'accomodations':
      return 'bg-indigo-500';
    case 'malls':
      return 'bg-amber-500';
    default:
      return 'bg-blue-500';
  }
}

function resolveTagIcon(iconName?: string | null): TagIconComponent {
  if (!iconName) return MapPin;

  if (iconName.startsWith('custom:')) {
    const customName = iconName.replace('custom:', '');
    if (customIcons[customName]) {
      return customIcons[customName] as TagIconComponent;
    }

    return MapPin;
  }

  if (lucideIconsMap[iconName]) {
    return lucideIconsMap[iconName] as TagIconComponent;
  }

  return MapPin;
}

export function getPrimaryTag(
  tags: POITag[],
  primaryTagId?: string | null
): POITag | undefined {
  if (!tags || tags.length === 0) return undefined;

  if (primaryTagId) {
    const matchedTag = tags.find((tag) => tag.id === primaryTagId);
    if (matchedTag) return matchedTag;
  }

  return tags[0];
}

export function getTagVisual(tag?: POITag | null): TagVisual {
  if (!tag) {
    return {
      icon: MapPin,
      color: 'bg-blue-500',
      clusterLabel: '',
    };
  }

  const seed = findTagSeedByName(tag.name);
  const clusterName = seed?.clusterId || null;
  const iconNameStr = tag.iconName || seed?.iconName;

  return {
    icon: resolveTagIcon(iconNameStr),
    color: getClusterColor(clusterName),
    clusterLabel: toClusterLabel(clusterName),
  };
}

export const getTagIcon = (
  tags: POITag[],
  primaryTagId?: string | null
): { icon: TagIconComponent; color: string } => {
  const primaryTag = getPrimaryTag(tags, primaryTagId);
  const { icon, color } = getTagVisual(primaryTag);
  return { icon, color };
};

export function getTagLabel(tag: POITag): string {
  const visual = getTagVisual(tag);
  return visual.clusterLabel ? `${visual.clusterLabel} • ${tag.name}` : tag.name;
}
