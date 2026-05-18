'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  Star
} from 'lucide-react';
import { PoiActionButtons } from '@/components/map-area/PoiActionButtons';
import { TextBody, TextHeading } from '@/components/text';
import { cn } from '@/lib/cn';
import {
  getPrimaryTag,
  getTagIcon,
  getTagLabel,
  getTagVisual
} from '@/components/map-area/get-tag-icon';
import type { POI } from '@/components/map-area/types';

const categories = ['For You', 'Spots', 'Eats', 'Lodgings'] as const;
type ExploreCategory = (typeof categories)[number];

const SPOTS_CLUSTERS = new Set(['attractions', 'nature', 'malls']);
const EATS_CLUSTERS = new Set(['food', 'eats']);
const LODGING_CLUSTERS = new Set(['accomodations', 'accommodations']);
const MAX_FOR_YOU_ITEMS = 8;
const budgetFilterOptions = [
  { value: 'all', label: 'All budgets' },
  { value: 1, label: 'Budget' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Expensive' },
  { value: 4, label: 'Luxury' }
] as const;

type BudgetFilter = (typeof budgetFilterOptions)[number]['value'];

function shuffle<T>(items: T[]): T[] {
  const cloned = [...items];

  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }

  return cloned;
}

function normalizePriceLevel(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 0 ? value : null;
  }

  if (typeof value === 'bigint') {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  if (
    value &&
    typeof (value as { toString?: () => string }).toString === 'function'
  ) {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

function normalizePoi(poi: Partial<POI>): POI {
  const rawPriceLevel =
    (poi as any).priceLevel ??
    (poi as any).price_level ??
    (poi as any).budget ??
    null;

  return {
    id: poi.id ?? '',
    name: poi.name ?? '',
    description: poi.description ?? '',
    latitude: Number(poi.latitude ?? 0),
    longitude: Number(poi.longitude ?? 0),
    vouchCount: Number(poi.vouchCount ?? 0),
    priceLevel: normalizePriceLevel(rawPriceLevel),
    primaryTagId: poi.primaryTagId ?? null,
    tags: poi.tags ?? [],
    galleries: poi.galleries ?? [],
    address: poi.address ?? null,
    operatingHours: poi.operatingHours ?? [],
    phoneNumber: (poi as any).phoneNumber ?? null,
    email: (poi as any).email ?? null,
    links: (poi as any).links ?? [],
    reviews: (poi as any).reviews ?? []
  };
}

function getClusterKey(poi: POI): string {
  const primaryTag = getPrimaryTag(poi.tags ?? [], poi.primaryTagId);
  const rawCluster = primaryTag?.cluster?.id ?? primaryTag?.cluster?.name ?? '';
  return rawCluster.trim().toLowerCase();
}

function buildForYou(pois: POI[]): POI[] {
  if (pois.length <= 1) return pois;

  const groupedByCluster = new Map<string, POI[]>();
  for (const poi of pois) {
    const key = getClusterKey(poi) || 'uncategorized';
    if (!groupedByCluster.has(key)) {
      groupedByCluster.set(key, []);
    }
    groupedByCluster.get(key)?.push(poi);
  }

  const picks: POI[] = [];
  for (const clusterKey of shuffle(Array.from(groupedByCluster.keys()))) {
    const clusterPois = groupedByCluster.get(clusterKey) ?? [];
    if (clusterPois.length > 0) {
      picks.push(shuffle(clusterPois)[0]);
    }
  }

  const pickedIds = new Set(picks.map(poi => poi.id));
  const remaining = shuffle(pois.filter(poi => !pickedIds.has(poi.id)));

  return [...picks, ...remaining].slice(0, MAX_FOR_YOU_ITEMS);
}

function formatBudgetLabel(level?: number | null): string {
  if (!level || level < 1) return '';
  return '₱'.repeat(Math.min(level, 4));
}

export default function ExploreArea() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const budgetMenuRef = useRef<HTMLDivElement | null>(null);

  const [activeCategory, setActiveCategory] =
    useState<ExploreCategory>('For You');
  const [searchText, setSearchText] = useState('');
  const [pois, setPois] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageIndices, setImageIndices] = useState<Record<string, number>>({});
  const [forYouNonce, setForYouNonce] = useState(0);
  const [selectedBudget, setSelectedBudget] = useState<BudgetFilter>('all');
  const [isBudgetMenuOpen, setIsBudgetMenuOpen] = useState(false);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        budgetMenuRef.current &&
        !budgetMenuRef.current.contains(event.target as Node)
      ) {
        setIsBudgetMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    const loadPois = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/pois');
        if (!response.ok) {
          throw new Error('Failed to fetch POIs');
        }

        const data = (await response.json()) as { pois?: Partial<POI>[] };
        const normalized = (data.pois ?? []).map(normalizePoi);
        setPois(normalized);
        setForYouNonce(prev => prev + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch POIs');
      } finally {
        setIsLoading(false);
      }
    };

    void loadPois();
  }, []);

  const searchedPois = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    if (!needle) return pois;

    return pois.filter(poi => {
      const tags = (poi.tags ?? []).map(tag => tag.name).join(' ');
      const clusters = (poi.tags ?? [])
        .map(tag => tag.cluster?.name ?? tag.cluster?.id ?? '')
        .join(' ');
      const address = [
        poi.address?.street,
        poi.address?.barangay,
        poi.address?.cityMunicipality,
        poi.address?.province
      ]
        .filter(Boolean)
        .join(' ');

      const haystack =
        `${poi.name} ${poi.description} ${tags} ${clusters} ${address}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [pois, searchText]);

  const budgetFilteredPois = useMemo(() => {
    if (selectedBudget === 'all') {
      return searchedPois;
    }

    const targetLevel = Number(selectedBudget);

    return searchedPois.filter(
      poi => poi.priceLevel !== null && poi.priceLevel === targetLevel
    );
  }, [searchedPois, selectedBudget]);

  const visiblePois = useMemo(() => {
    switch (activeCategory) {
      case 'For You':
        return buildForYou(budgetFilteredPois);
      case 'Spots':
        return budgetFilteredPois.filter(poi =>
          SPOTS_CLUSTERS.has(getClusterKey(poi))
        );
      case 'Eats':
        return budgetFilteredPois.filter(poi =>
          EATS_CLUSTERS.has(getClusterKey(poi))
        );
      case 'Lodgings':
        return budgetFilteredPois.filter(poi =>
          LODGING_CLUSTERS.has(getClusterKey(poi))
        );
      default:
        return budgetFilteredPois;
    }
  }, [activeCategory, budgetFilteredPois, forYouNonce]);

  const updateImageIndex = (poiId: string, nextIndex: number) => {
    setImageIndices(prev => ({
      ...prev,
      [poiId]: nextIndex
    }));
  };

  const openPoiDetails = (poiId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('poi', poiId);

    const nextQuery = params.toString();
    const nextPath = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextPath, { scroll: false });
  };

  return (
    <div className='scrollbar-invisible bg-surface text-text-main h-full w-full overflow-y-auto'>
      <div className='w-full px-4 py-6 sm:px-6 sm:py-8'>
        <div className='mb-5 flex flex-col gap-3 sm:flex-row'>
          <div className='relative flex-1'>
            <Search
              className='text-text-muted absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2'
              strokeWidth={2.2}
            />
            <input
              type='text'
              placeholder='Search'
              value={searchText}
              onChange={event => setSearchText(event.target.value)}
              className='border-border text-text-main placeholder:text-text-muted focus:border-primary-300 bg-background h-12 w-full rounded-xl border py-3 pr-4 pl-11 text-[15px] outline-none'
            />
          </div>

          <div ref={budgetMenuRef} className='relative'>
            <button
              type='button'
              onClick={() => setIsBudgetMenuOpen(prev => !prev)}
              aria-expanded={isBudgetMenuOpen}
              className='border-border text-text-main hover:bg-surface-light bg-background inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-medium transition'
            >
              <SlidersHorizontal className='h-4 w-4' />
              {selectedBudget === 'all'
                ? 'Filters'
                : `Budget: ${formatBudgetLabel(selectedBudget)}`}
            </button>

            {isBudgetMenuOpen && (
              <div className='bg-background border-border absolute top-full right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border shadow-lg'>
                <div className='py-1'>
                  {budgetFilterOptions.map(option => (
                    <button
                      key={option.label}
                      type='button'
                      onClick={() => {
                        setSelectedBudget(option.value);
                        setIsBudgetMenuOpen(false);
                      }}
                      className={cn(
                        'text-text-main hover:bg-surface-light flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition',
                        selectedBudget === option.value &&
                          'bg-primary-50 text-primary-600'
                      )}
                    >
                      <span>{option.label}</span>
                      {option.value !== 'all' && (
                        <span className='text-xs font-medium'>
                          {formatBudgetLabel(option.value)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='mb-7 flex flex-wrap items-center gap-2.5'>
          {categories.map(category => {
            const isActive = activeCategory === category;

            return (
              <button
                key={category}
                type='button'
                onClick={() => {
                  setActiveCategory(category);
                  if (category === 'For You') {
                    setForYouNonce(prev => prev + 1);
                  }
                }}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : 'border-border bg-background text-text-muted hover:bg-primary-50'
                )}
              >
                {category}
              </button>
            );
          })}
        </div>

        <section>
          <TextHeading className='text-text-main mb-5'>
            {activeCategory}
          </TextHeading>

          {isLoading && (
            <div className='text-text-muted rounded-xl border border-dashed p-6 text-sm'>
              Loading points of interest...
            </div>
          )}

          {!isLoading && error && (
            <div className='rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700'>
              Failed to load POIs: {error}
            </div>
          )}

          {!isLoading && !error && visiblePois.length === 0 && (
            <div className='text-text-muted rounded-xl border border-dashed p-6 text-sm'>
              No locations matched your filters.
            </div>
          )}

          {!isLoading && !error && visiblePois.length > 0 && (
            <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
              {visiblePois.map(poi => {
                const images = poi.galleries ?? [];
                const currentImageIndex = imageIndices[poi.id] ?? 0;
                const primaryTag = getPrimaryTag(
                  poi.tags ?? [],
                  poi.primaryTagId
                );
                const { icon: TagIcon } = getTagIcon(
                  poi.tags ?? [],
                  poi.primaryTagId
                );
                const { color } = getTagVisual(primaryTag);
                const reviews = poi.reviews ?? [];
                const averageRating =
                  reviews.length > 0
                    ? (
                        reviews.reduce(
                          (total, review) => total + review.rating,
                          0
                        ) / reviews.length
                      ).toFixed(1)
                    : 'New';
                const reviewCount = reviews.length;
                const detailAddress = poi.address
                  ? [poi.address.cityMunicipality, poi.address.province]
                      .filter(Boolean)
                      .join(', ') || 'Unknown Location'
                  : 'Unknown Location';

                return (
                  <article
                    key={poi.id}
                    role='button'
                    tabIndex={0}
                    onClick={() => openPoiDetails(poi.id)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openPoiDetails(poi.id);
                      }
                    }}
                    className='bg-background focus-visible:ring-primary-500 min-w-0 cursor-pointer overflow-hidden rounded-2xl border transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                  >
                    <div className='group relative h-60 w-full shrink-0 overflow-hidden'>
                      {images.length > 0 ? (
                        <img
                          src={images[currentImageIndex].imageUrl}
                          alt={poi.name}
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <div className='bg-muted flex h-full w-full items-center justify-center'>
                          <span className='text-muted-foreground text-xs'>
                            No image
                          </span>
                        </div>
                      )}

                      <div className='pointer-events-none absolute inset-0 bg-linear-to-b from-black/45 via-transparent to-transparent' />
                      <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent' />

                      <div className='absolute top-3 right-3 z-10 flex items-center gap-2'>
                        <PoiActionButtons
                          poiId={poi.id}
                          initialVouchCount={poi.vouchCount ?? 0}
                          layout='compact'
                          buttonClassName='border-0 bg-black/30 text-white hover:text-white hover:bg-black/50 backdrop-blur-md px-2'
                        />
                      </div>

                      {images.length > 1 && (
                        <>
                          <button
                            type='button'
                            onClick={event => {
                              event.preventDefault();
                              event.stopPropagation();
                              const nextIndex =
                                currentImageIndex === 0
                                  ? Math.max(0, images.length - 1)
                                  : currentImageIndex - 1;
                              updateImageIndex(poi.id, nextIndex);
                            }}
                            className='absolute top-1/2 left-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100 hover:bg-black/50'
                          >
                            <ChevronLeft className='h-4 w-4' />
                          </button>
                          <button
                            type='button'
                            onClick={event => {
                              event.preventDefault();
                              event.stopPropagation();
                              const nextIndex =
                                currentImageIndex === images.length - 1
                                  ? 0
                                  : currentImageIndex + 1;
                              updateImageIndex(poi.id, nextIndex);
                            }}
                            className='absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100 hover:bg-black/50'
                          >
                            <ChevronRight className='h-4 w-4' />
                          </button>

                          <div className='absolute right-0 bottom-3 left-0 flex justify-center gap-1'>
                            {images.map((_, dotIndex) => (
                              <span
                                key={`${poi.id}-dot-${dotIndex}`}
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full transition-all',
                                  currentImageIndex === dotIndex
                                    ? 'bg-white'
                                    : 'bg-white/50'
                                )}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className='space-y-2 p-4'>
                      <div className='flex items-start justify-between gap-3 border-b pb-2'>
                        <h3 className='text-text-main line-clamp-2 flex-1 text-[20px] leading-snug font-semibold'>
                          {poi.name}
                        </h3>

                        <p className='text-text-main mt-1 inline-flex shrink-0 items-center gap-1 text-sm font-semibold'>
                          <Star className='h-3.5 w-3.5 fill-current' />
                          {averageRating}{' '}
                          <span className='text-text-muted'>
                            ({reviewCount} reviews)
                          </span>
                        </p>
                      </div>

                      <p className='text-text-muted flex items-center gap-1.5 text-sm font-medium'>
                        <span
                          className={cn(
                            'inline-flex h-5 w-5 items-center justify-center rounded-full text-white',
                            color
                          )}
                        >
                          <TagIcon className='h-3 w-3' />
                        </span>
                        {primaryTag ? getTagLabel(primaryTag) : 'Location'}
                      </p>

                      <button
                        type='button'
                        onClick={event => {
                          event.stopPropagation();
                          openPoiDetails(poi.id);
                        }}
                        className='text-text-muted hover:text-text-main inline-flex items-center gap-1.5 text-left text-sm leading-5 transition'
                      >
                        <MapPin className='h-4 w-4 shrink-0' />
                        <span>{detailAddress}</span>
                      </button>

                      {poi.description && (
                        <TextBody className='text-text-muted line-clamp-2 text-sm leading-5'>
                          {poi.description}
                        </TextBody>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
