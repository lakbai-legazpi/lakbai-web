'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Star,
  Share,
  Bookmark,
  PlusCircle,
  ExternalLink,
  Phone,
  Mail,
  MapPinned,
  MapPin
} from 'lucide-react';

import PoiMapCanvas from '@/components/map-area/PoiMapCanvas';
import PoiFullscreenGallery from './PoiFullscreenGallery';
import { getTagLabel, getTagVisual } from './get-tag-icon';
import { TextHeading, TextBody } from '@/components/text';
import { cn } from '@/lib/cn';

export type POIWithRelations = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  phoneNumber: string | null;
  email: string | null;
  address: {
    street: string | null;
    barangay: string | null;
    city: string;
    province: string;
  } | null;
  operatingHours: {
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
    is24Hours: boolean;
  }[];
  links: {
    label: string;
    url: string;
    iconType: string; // e.g., 'facebook', 'instagram', 'globe'
  }[];
  galleries: {
    id: string;
    imageUrl: string;
  }[];
  reviews: {
    id: string;
    rating: number;
    content: string;
    createdAt: string | Date;
    user: {
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
  }[];

  // Retained for existing tag logic compatibility
  vouchCount?: number;
  tags?: any[];
  primaryTagId?: string | null;
};

type DetailTab = 'description' | 'reviews' | 'location';

// Helper to format 24h 'HH:mm' to 12h format
function formatTime12Hour(timeStr: string | null) {
  if (!timeStr) return '';
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minuteStr} ${ampm}`;
}

// Helper to get today's operating status
function getCurrentStatus(hours: POIWithRelations['operatingHours']) {
  if (!hours || hours.length === 0) return null;
  
  const today = new Date().getDay();
  const todayHours = hours.find(h => h.dayOfWeek === today);
  
  if (!todayHours) return null;
  
  if (todayHours.isClosed) {
    return { label: 'Closed', badgeClass: 'bg-red-100 text-red-700', isClosed: true };
  }
  
  if (todayHours.is24Hours) {
    return { label: 'Open 24/7', badgeClass: 'bg-green-100 text-green-700', isClosed: false };
  }
  
  if (todayHours.openTime && todayHours.closeTime) {
    const open = formatTime12Hour(todayHours.openTime);
    const close = formatTime12Hour(todayHours.closeTime);
    return { label: `Open ${open} - ${close}`, badgeClass: 'bg-emerald-100 text-emerald-700', isClosed: false };
  }
  
  return null;
}



type PoiDetailsOverlayProps = {
  poi: POIWithRelations;
  copied: boolean;
  onClose: () => void;
  onCopyShareUrl: () => void;
  portalContainer?: HTMLElement | null;
  panelMode?: boolean;
};

export default function PoiDetailsOverlay({
  poi,
  copied,
  onClose,
  onCopyShareUrl,
  portalContainer,
  panelMode = false
}: PoiDetailsOverlayProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('description');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  useEffect(() => {
    setActiveTab('description');
    setIsGalleryOpen(false);
    setIsDetailsExpanded(false);
  }, [poi.id]);

  const galleryImages = useMemo(
    () =>
      (poi.galleries ?? []).filter(
        image => Boolean(image.imageUrl) && image.imageUrl.trim().length > 0
      ),
    [poi.galleries]
  );

  const previewImages = galleryImages.slice(0, 3);
  const hasMoreThanThreeImages = galleryImages.length > 3;

  const openFromPreview = () => {
    if (galleryImages.length === 0) {
      return;
    }
    setIsGalleryOpen(true);
  };

  // Format the address beautifully, dropping null values gracefully
  const detailAddress = useMemo(() => {
    const parts = [
      poi.address?.street,
      poi.address?.barangay,
      poi.address?.city,
      poi.address?.province,
      'Philippines'
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(', ');
    }

    return `Lat ${poi.latitude.toFixed(5)}, Lng ${poi.longitude.toFixed(5)}`;
  }, [poi]);

  const focusedCenter: [number, number] = [poi.longitude, poi.latitude];

  const meaningfulOperatingHours = useMemo(
    () =>
      (poi.operatingHours ?? []).filter(record => {
        const hasOpenTime = Boolean(record.openTime && record.openTime.trim().length > 0);
        const hasCloseTime = Boolean(record.closeTime && record.closeTime.trim().length > 0);
        return record.isClosed || record.is24Hours || hasOpenTime || hasCloseTime;
      }),
    [poi.operatingHours]
  );

  const currentStatus = useMemo(() => getCurrentStatus(poi.operatingHours), [poi.operatingHours]);

  const overlayContent = (
    <div
      className={cn(
        'bg-background/95 absolute z-40 overflow-y-auto backdrop-blur-sm transition-all duration-300',
        panelMode && !isDetailsExpanded
          ? 'inset-y-0 right-0 w-1/2 shadow-2xl'
          : 'inset-0'
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full flex-col pt-4 pb-12 sm:pt-6',
          isDetailsExpanded
            ? 'max-w-none px-3 sm:px-5 lg:px-8'
            : 'max-w-5xl px-4 sm:px-6'
        )}
      >
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='text-foreground hover:bg-muted inline-flex h-8 w-8 items-center justify-center rounded-full transition'
              aria-label='Close location details'
            >
              <X className='h-5 w-5' />
            </button>
            <button
              type='button'
              onClick={() => setIsDetailsExpanded(prev => !prev)}
              className='text-foreground hover:bg-muted inline-flex h-8 w-8 items-center justify-center rounded-full transition'
              aria-label={
                isDetailsExpanded
                  ? 'Collapse details view'
                  : 'Expand details view'
              }
            >
              {isDetailsExpanded ? (
                <ArrowRightFromLine className='h-5 w-5' />
              ) : (
                <ArrowLeftFromLine className='h-5 w-5' />
              )}
            </button>
          </div>

          <div className='flex items-center gap-2'>
            <button
              type='button'
              className='border-foreground/40 text-foreground inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm'
            >
              <Bookmark className='h-3.5 w-3.5' /> Favorite
            </button>
            <button
              type='button'
              className='border-foreground/40 text-foreground inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm'
            >
              <PlusCircle className='h-3.5 w-3.5' /> Add to Journey
            </button>
            <button
              type='button'
              onClick={onCopyShareUrl}
              className='border-foreground/40 text-foreground inline-flex h-8 w-8 items-center justify-center rounded-full border'
              aria-label='Copy share link'
              title={copied ? 'Copied!' : 'Copy share link'}
            >
              <Share className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='mt-4'>
          <TextHeading className='text-4xl leading-tight font-extrabold'>
            {poi.name || 'Location Title'}
          </TextHeading>

          <div className='mt-3 flex flex-wrap items-center gap-2 text-sm'>
            <span className='border-foreground/40 inline-flex items-center gap-1 rounded-full border px-2.5 py-1'>
              <Star className='h-3.5 w-3.5 fill-current' /> 4.6 •{' '}
              {poi.vouchCount ?? 0} reviews
            </span>
            <span className='text-muted-foreground'>{detailAddress}</span>
            {copied && <span className='text-emerald-600'>Link copied</span>}
          </div>

          {poi.tags && poi.tags.length > 0 && (
            <div className='mt-3 flex flex-wrap gap-2'>
              {poi.tags.map(tag => {
                const { icon: TagIcon, color } = getTagVisual(tag);
                return (
                  <span
                    key={tag.id}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white ${color}`}
                  >
                    <TagIcon className='h-3.5 w-3.5' />
                    {getTagLabel(tag)}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className='mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1.3fr_0.85fr]'>
          <button
            type='button'
            onClick={openFromPreview}
            disabled={!previewImages[0]}
            className='group bg-muted relative h-64 overflow-hidden rounded-xl text-left md:h-95'
          >
            {previewImages[0] ? (
              <img
                src={previewImages[0].imageUrl}
                alt={`${poi.name} image 1`}
                className='h-full w-full object-cover transition group-hover:scale-[1.02]'
              />
            ) : (
              <div className='text-muted-foreground flex h-full w-full items-center justify-center text-sm'>
                No image yet
              </div>
            )}
          </button>
          <div className='grid grid-rows-[1fr_1fr] gap-2'>
            <button
              type='button'
              onClick={openFromPreview}
              disabled={!previewImages[1]}
              className='group bg-muted h-46.5 overflow-hidden rounded-xl text-left'
            >
              {previewImages[1] ? (
                <img
                  src={previewImages[1].imageUrl}
                  alt={`${poi.name} image 2`}
                  className='h-full w-full object-cover transition group-hover:scale-[1.02]'
                />
              ) : (
                <div className='text-muted-foreground flex h-full w-full items-center justify-center text-sm'>
                  No image yet
                </div>
              )}
            </button>
            <div
              role='button'
              tabIndex={previewImages[2] ? 0 : -1}
              aria-disabled={!previewImages[2]}
              onClick={() => {
                if (!previewImages[2]) {
                  return;
                }
                openFromPreview();
              }}
              onKeyDown={event => {
                if (!previewImages[2]) {
                  return;
                }

                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openFromPreview();
                }
              }}
              className='group bg-muted relative h-46.5 overflow-hidden rounded-xl text-left'
            >
              {previewImages[2] ? (
                <img
                  src={previewImages[2].imageUrl}
                  alt={`${poi.name} image 3`}
                  className='h-full w-full object-cover transition group-hover:scale-[1.02]'
                />
              ) : (
                <div className='text-muted-foreground flex h-full w-full items-center justify-center text-sm'>
                  No image yet
                </div>
              )}

              <button
                type='button'
                onClick={event => {
                  event.stopPropagation();
                  setIsGalleryOpen(true);
                }}
                disabled={galleryImages.length === 0}
                className='bg-background/95 text-foreground absolute right-3 bottom-3 rounded-full px-3 py-1 text-sm font-medium'
              >
                {hasMoreThanThreeImages
                  ? `See all ${galleryImages.length}`
                  : 'See gallery'}
              </button>
            </div>
          </div>
        </div>

        <div className='mt-6 border-b'>
          <div className='flex items-end gap-5 text-lg'>
            <button
              type='button'
              onClick={() => setActiveTab('description')}
              className={`pb-2 ${activeTab === 'description' ? 'text-foreground border-b-2 font-semibold' : 'text-muted-foreground'}`}
            >
              Description
            </button>
            <button
              type='button'
              onClick={() => setActiveTab('reviews')}
              className={`pb-2 ${activeTab === 'reviews' ? 'text-foreground border-b-2 font-semibold' : 'text-muted-foreground'}`}
            >
              Reviews
            </button>
            <button
              type='button'
              onClick={() => setActiveTab('location')}
              className={`pb-2 ${activeTab === 'location' ? 'text-foreground border-b-2 font-semibold' : 'text-muted-foreground'}`}
            >
              Location
            </button>
          </div>
        </div>

        {activeTab === 'description' && (
          <div className='mt-4 space-y-5'>
            <TextBody className='text-foreground/90 leading-relaxed whitespace-pre-line'>
              {poi.description || 'No description available for this location.'}
            </TextBody>

            <div className='grid gap-4 border-y py-5 md:grid-cols-2 lg:grid-cols-3'>
              {/* Address Block */}
              <div>
                <TextBody className='text-foreground flex items-center gap-2 font-semibold'>
                  <MapPin className='h-4 w-4' /> Address
                </TextBody>
                <TextBody className='text-foreground/80 mt-1 whitespace-pre-line'>
                  {[
                    poi.address?.street,
                    poi.address?.barangay,
                    poi.address?.city,
                    poi.address?.province,
                    'Philippines'
                  ].filter(Boolean).join('\n')}
                </TextBody>
              </div>

              {/* Contact / Links Block */}
              <div className='space-y-3'>
                {poi.phoneNumber && (
                  <div>
                    <TextBody className='text-foreground flex items-center gap-2 font-semibold'>
                      <Phone className='h-4 w-4' /> Phone
                    </TextBody>
                    <TextBody className='text-foreground/80 mt-1'>
                      {poi.phoneNumber}
                    </TextBody>
                  </div>
                )}
                
                {poi.email && (
                  <div>
                    <TextBody className='text-foreground flex items-center gap-2 font-semibold'>
                      <Mail className='h-4 w-4' /> Email
                    </TextBody>
                    <TextBody className='text-foreground/80 mt-1'>
                      <a href={`mailto:${poi.email}`} className="hover:underline">
                        {poi.email}
                      </a>
                    </TextBody>
                  </div>
                )}

                {poi.links && poi.links.length > 0 && (
                  <div className='space-y-2'>
                    {poi.links.map((link, idx) => (
                      <div key={idx}>
                        <TextBody className='text-foreground font-semibold'>
                          {link.label}
                        </TextBody>
                        <TextBody className='text-foreground/80 mt-1'>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1 text-primary-600">
                            {link.url.replace(/^https?:\/\//, '')} <ExternalLink className='h-3 w-3' />
                          </a>
                        </TextBody>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Operating Hours Block */}
              {meaningfulOperatingHours.length > 0 && (
                <div>
                  <TextBody className='text-foreground flex items-center gap-2 font-semibold mb-2'>
                    Operating Hours
                  </TextBody>
                  
                  {currentStatus ? (
                    <div className='mb-3'>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', currentStatus.badgeClass)}>
                        {currentStatus.label}
                      </span>
                    </div>
                  ) : (
                    <TextBody className='text-foreground/70 text-sm italic mb-2'>
                      Hours not available
                    </TextBody>
                  )}

                  <div className='mt-2 space-y-1'>
                    {[...meaningfulOperatingHours]
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((record, idx) => {
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const dayName = dayNames[record.dayOfWeek];
                        
                        let displayHours = '';
                        if (record.isClosed) displayHours = 'Closed';
                        else if (record.is24Hours) displayHours = 'Open 24 hours';
                        else if (record.openTime && record.closeTime) {
                          displayHours = `${formatTime12Hour(record.openTime)} - ${formatTime12Hour(record.closeTime)}`;
                        } else {
                          displayHours = 'Hours not set';
                        }
                        
                        return (
                          <div
                            key={idx}
                            className={cn(
                              'flex items-center justify-between gap-2 text-xs',
                              record.dayOfWeek === new Date().getDay() ? 'font-bold text-foreground' : 'text-foreground/80'
                            )}
                          >
                            <span className='w-8 shrink-0'>
                              {dayName}
                            </span>
                            <span>
                              {displayHours}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <TextBody className='text-foreground flex items-center gap-2 font-semibold'>
                <MapPinned className='h-4 w-4' /> Location
              </TextBody>
              <TextBody className='text-foreground/80'>
                {detailAddress}
              </TextBody>
              <div className='h-64 overflow-hidden rounded-xl'>
                <PoiMapCanvas
                  pois={[poi as any]}
                  center={focusedCenter}
                  zoom={14}
                  selectedPoiId={poi.id}
                  markerCircleClassName='bg-primary-500 border-primary-500'
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className='mt-4'>
            <div className='mb-4 flex justify-end'>
              <button
                type='button'
                className='border-foreground/40 text-foreground inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium'
              >
                <PlusCircle className='h-4 w-4' /> Add a review
              </button>
            </div>

            <div className='space-y-4'>
              {poi.reviews && poi.reviews.length > 0 ? (
                poi.reviews.map(review => {
                  const fullName = [review.user?.firstName, review.user?.lastName].filter(Boolean).join(' ') || review.user?.name || 'Anonymous User';
                  const dateStr = new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                  
                  return (
                    <article key={review.id} className='border-b pb-4'>
                      <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-3'>
                          {review.user?.avatarUrl ? (
                            <img src={review.user.avatarUrl} alt={fullName} className='bg-muted h-12 w-12 rounded-full object-cover' />
                          ) : (
                            <div className='bg-muted h-12 w-12 rounded-full flex items-center justify-center font-bold text-muted-foreground'>
                              {fullName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className='font-semibold'>{fullName}</p>
                            <p className='text-muted-foreground text-sm'>
                              Reviewed on {dateStr}
                            </p>
                          </div>
                        </div>
                        <p className='font-medium flex items-center gap-1'>
                          {review.rating}/5 <Star className='h-3 w-3 fill-current text-primary-500' />
                        </p>
                      </div>

                      <p className='mt-3 text-sm whitespace-pre-line'>{review.content}</p>
                    </article>
                  );
                })
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No reviews yet. Be the first to share your experience!</p>
                </div>
              )}
            </div>

            {poi.reviews && poi.reviews.length > 0 && (
              <button
                type='button'
                className='border-foreground/40 text-foreground mt-5 rounded-full border px-4 py-1.5 text-sm'
              >
                Show all {poi.reviews.length} reviews
              </button>
            )}
          </div>
        )}

        {activeTab === 'location' && (
          <div className='mt-4 space-y-2'>
            <TextBody className='text-foreground flex items-center gap-2 font-semibold'>
              <MapPinned className='h-4 w-4' /> Location
            </TextBody>
            <TextBody className='text-foreground/80'>{detailAddress}</TextBody>
            <div className='h-72 overflow-hidden rounded-xl'>
              <PoiMapCanvas
                pois={[poi as any]}
                center={focusedCenter}
                zoom={15}
                selectedPoiId={poi.id}
                markerCircleClassName='bg-primary-500 border-primary-500'
              />
            </div>
          </div>
        )}
      </div>

      <PoiFullscreenGallery
        isOpen={isGalleryOpen}
        title={`${poi.name}`}
        images={galleryImages.map(g => ({ id: g.id, imageUrl: g.imageUrl }))}
        onClose={() => setIsGalleryOpen(false)}
        onShare={onCopyShareUrl}
      />
    </div>
  );

  if (isDetailsExpanded && portalContainer) {
    return createPortal(overlayContent, portalContainer);
  }

  return overlayContent;
}
