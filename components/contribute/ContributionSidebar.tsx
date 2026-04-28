'use client';

import { ChangeEvent } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  MapPinPlusInside,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { TextBody, TextHeading } from '@/components/text';
import type { POI } from '@/components/map-area/types';
import { IconPicker } from '@/components/ui/IconPicker';
import { AutocompleteInput } from '@/components/ui/AutocompleteInput';

export type ContributionMode = 'add' | 'edit';
export type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ContributionAddressForm {
  blockLotNumber: string;
  houseNumber: string;
  purok: string;
  street: string;
  subdivisionName: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  postalCode: string;
}

export interface ContributionOperatingHourForm {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  is24Hours: boolean;
}

export interface ContributionGalleryUpload {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  dataUrl: string;
}

export interface ContributionContactForm {
  websites: string[];
  phoneNumbers: string[];
}

export interface ContributionFormState {
  name: string;
  description: string;
  primaryTagCluster: string;
  primaryTagName: string;
  primaryTagIcon: string;
  latitude: string;
  longitude: string;
  address: ContributionAddressForm;
  operatingHours: ContributionOperatingHourForm[];
  galleryUploads: ContributionGalleryUpload[];
  contact: ContributionContactForm;
}

export interface ContributionSidebarProps {
  mode: ContributionMode;
  selectedPoi: POI | null;
  form: ContributionFormState;
  showAddress: boolean;
  showMedia: boolean;
  showHours: boolean;
  submitStatus: SubmitStatus;
  errorMessage: string;
  isPinModeEnabled: boolean;
  availableClusters?: string[];
  availableTags?: string[];
  onReset: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onTogglePinMode: () => void;
  onClearPickedLocation: () => void;
  onFormFieldChange: (field: keyof ContributionFormState, value: string) => void;
  onAddressFieldChange: (field: keyof ContributionAddressForm, value: string) => void;
  onCoordinateChange: (field: 'latitude' | 'longitude', value: string) => void;
  onToggleAddress: () => void;
  onToggleMedia: () => void;
  onToggleHours: () => void;
  onOperatingHoursChange: (
    dayOfWeek: number,
    field: keyof Omit<ContributionOperatingHourForm, 'dayOfWeek'>,
    value: string | boolean
  ) => void;
  onGalleryUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveGalleryUpload: (id: string) => void;
  onContactFieldChange: (
    field: keyof ContributionContactForm,
    index: number,
    value: string
  ) => void;
  onAddContactField: (field: keyof ContributionContactForm) => void;
  onRemoveContactField: (field: keyof ContributionContactForm, index: number) => void;
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ContributionSidebar({
  mode,
  selectedPoi,
  form,
  showAddress,
  showMedia,
  showHours,
  submitStatus,
  errorMessage,
  isPinModeEnabled,
  availableClusters = [],
  availableTags = [],
  onReset,
  onSubmit,
  onTogglePinMode,
  onClearPickedLocation,
  onFormFieldChange,
  onAddressFieldChange,
  onCoordinateChange,
  onToggleAddress,
  onToggleMedia,
  onToggleHours,
  onOperatingHoursChange,
  onGalleryUpload,
  onRemoveGalleryUpload,
  onContactFieldChange,
  onAddContactField,
  onRemoveContactField,
}: ContributionSidebarProps) {
  const hasCoordinates = form.latitude.trim().length > 0 && form.longitude.trim().length > 0;

  return (
    <aside className='bg-surface border-border flex h-full w-110 shrink-0 flex-col border-r'>
      <div className='border-border border-b px-5 py-4'>
        <TextHeading className='text-text-main text-lg font-bold'>
          {mode === 'edit' ? 'Edit Existing Location' : 'Add a New Location'}
        </TextHeading>
        <TextBody className='text-text-muted mt-1 text-xs leading-snug'>
          {mode === 'edit'
            ? `Editing "${selectedPoi?.name ?? 'selected POI'}". Update any field and move the marker if needed.`
            : 'Enable pin mode, click the map to place a marker, then complete all POI details.'}
        </TextBody>
      </div>

      <div className='border-border border-b px-5 py-3'>
        <button
          type='button'
          onClick={onTogglePinMode}
          aria-pressed={isPinModeEnabled}
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition',
            isPinModeEnabled
              ? 'bg-primary-500 text-white shadow-sm'
              : 'border-border bg-background text-text-main border hover:bg-surface-light'
          )}
        >
          <MapPinPlusInside className='h-4 w-4' />
          {isPinModeEnabled ? 'Click map to set marker…' : 'Enable Pin Mode'}
        </button>
        {hasCoordinates && (
          <p className='text-text-muted mt-2 flex items-center gap-1.5 text-xs'>
            <MapPin className='text-primary-500 h-3.5 w-3.5 shrink-0' />
            {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
            <button
              type='button'
              onClick={onClearPickedLocation}
              className='text-text-muted hover:text-error-500 ml-auto transition'
              aria-label='Remove selected marker'
            >
              <X className='h-3.5 w-3.5' />
            </button>
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className='flex flex-1 flex-col overflow-hidden'>
        <div className='flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-text-main text-xs font-semibold' htmlFor='contrib-name'>
              Location Name <span className='text-error-500'>*</span>
            </label>
            <input
              id='contrib-name'
              type='text'
              required
              value={form.name}
              onChange={event => onFormFieldChange('name', event.target.value)}
              className='border-border text-text-main placeholder:text-text-muted bg-background focus:border-primary-400 rounded-lg border px-3 py-2 text-sm outline-none transition'
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-text-main text-xs font-semibold' htmlFor='contrib-desc'>
              Description
            </label>
            <textarea
              id='contrib-desc'
              rows={4}
              value={form.description}
              onChange={event => onFormFieldChange('description', event.target.value)}
              className='border-border text-text-main placeholder:text-text-muted bg-background focus:border-primary-400 resize-none rounded-lg border px-3 py-2 text-sm outline-none transition'
            />
          </div>

          <div className='border-border rounded-lg border p-3 space-y-3 bg-surface-light'>
            <p className='text-text-main text-xs font-semibold pb-1 border-b border-border'>
              Primary Tag & Cluster
            </p>
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-text-main text-[11px] font-semibold' htmlFor='contrib-cluster'>
                  Cluster Name <span className='text-error-500'>*</span>
                </label>
                <AutocompleteInput
                  id='contrib-cluster'
                  placeholder='e.g. Food, Nature'
                  required
                  value={form.primaryTagCluster}
                  onValueChange={val => onFormFieldChange('primaryTagCluster', val)}
                  options={availableClusters}
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <label className='text-text-main text-[11px] font-semibold' htmlFor='contrib-tag'>
                  Tag Name <span className='text-error-500'>*</span>
                </label>
                <AutocompleteInput
                  id='contrib-tag'
                  placeholder='e.g. Cafe, Park'
                  required
                  value={form.primaryTagName}
                  onValueChange={val => onFormFieldChange('primaryTagName', val)}
                  options={availableTags}
                />
              </div>
            </div>
            <IconPicker 
              value={form.primaryTagIcon}
              onChange={(val) => onFormFieldChange('primaryTagIcon', val)}
            />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1.5'>
              <label className='text-text-main text-xs font-semibold' htmlFor='contrib-lat'>
                Latitude <span className='text-error-500'>*</span>
              </label>
              <input
                id='contrib-lat'
                type='number'
                step='any'
                required
                value={form.latitude}
                onChange={event => onCoordinateChange('latitude', event.target.value)}
                className='border-border text-text-main bg-background focus:border-primary-400 rounded-lg border px-3 py-2 text-sm outline-none transition'
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <label className='text-text-main text-xs font-semibold' htmlFor='contrib-lng'>
                Longitude <span className='text-error-500'>*</span>
              </label>
              <input
                id='contrib-lng'
                type='number'
                step='any'
                required
                value={form.longitude}
                onChange={event => onCoordinateChange('longitude', event.target.value)}
                className='border-border text-text-main bg-background focus:border-primary-400 rounded-lg border px-3 py-2 text-sm outline-none transition'
              />
            </div>
          </div>

          <div className='space-y-2 rounded-lg border p-3'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-semibold'>Contact (optional)</p>
            </div>
            {form.contact.websites.map((website, index) => (
              <div key={`website-${index}`} className='flex items-center gap-2'>
                <input
                  type='url'
                  placeholder='https://example.com'
                  value={website}
                  onChange={event =>
                    onContactFieldChange('websites', index, event.target.value)
                  }
                  className='border-border text-text-main bg-background focus:border-primary-400 flex-1 rounded-lg border px-3 py-2 text-xs outline-none transition'
                />
                <button
                  type='button'
                  onClick={() => onRemoveContactField('websites', index)}
                  aria-label='Remove website'
                  className='text-text-muted hover:text-error-500'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            ))}
            <button
              type='button'
              onClick={() => onAddContactField('websites')}
              className='text-primary-600 text-xs font-semibold'
            >
              + Add Website
            </button>

            {form.contact.phoneNumbers.map((phone, index) => (
              <div key={`phone-${index}`} className='flex items-center gap-2'>
                <input
                  type='text'
                  placeholder='+63 900 000 0000'
                  value={phone}
                  onChange={event =>
                    onContactFieldChange('phoneNumbers', index, event.target.value)
                  }
                  className='border-border text-text-main bg-background focus:border-primary-400 flex-1 rounded-lg border px-3 py-2 text-xs outline-none transition'
                />
                <button
                  type='button'
                  onClick={() => onRemoveContactField('phoneNumbers', index)}
                  aria-label='Remove phone number'
                  className='text-text-muted hover:text-error-500'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            ))}
            <button
              type='button'
              onClick={() => onAddContactField('phoneNumbers')}
              className='text-primary-600 text-xs font-semibold'
            >
              + Add Phone
            </button>
          </div>

          <div className='border-border rounded-lg border'>
            <button
              type='button'
              onClick={onToggleAddress}
              className='text-text-main flex w-full items-center justify-between px-3 py-2.5 text-xs font-semibold'
            >
              Address Details
              {showAddress ? <ChevronUp className='h-3.5 w-3.5' /> : <ChevronDown className='h-3.5 w-3.5' />}
            </button>
            {showAddress && (
              <div className='border-border grid grid-cols-2 gap-2 border-t p-3'>
                {(
                  [
                    ['blockLotNumber', 'Block/Lot'],
                    ['houseNumber', 'House No.'],
                    ['purok', 'Purok'],
                    ['street', 'Street'],
                    ['subdivisionName', 'Subdivision'],
                    ['barangay', 'Barangay'],
                    ['cityMunicipality', 'City/Municipality'],
                    ['province', 'Province'],
                    ['postalCode', 'Postal Code'],
                  ] as [keyof ContributionAddressForm, string][]
                ).map(([field, label]) => (
                  <div key={field} className='flex flex-col gap-1'>
                    <label className='text-text-muted text-xs' htmlFor={`contrib-address-${field}`}>
                      {label}
                    </label>
                    <input
                      id={`contrib-address-${field}`}
                      type='text'
                      value={form.address[field]}
                      onChange={event => onAddressFieldChange(field, event.target.value)}
                      className='border-border text-text-main bg-background focus:border-primary-400 rounded-md border px-2.5 py-1.5 text-xs outline-none transition'
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='border-border rounded-lg border'>
            <button
              type='button'
              onClick={onToggleMedia}
              className='text-text-main flex w-full items-center justify-between px-3 py-2.5 text-xs font-semibold'
            >
              Gallery Images
              {showMedia ? <ChevronUp className='h-3.5 w-3.5' /> : <ChevronDown className='h-3.5 w-3.5' />}
            </button>
            {showMedia && (
              <div className='border-border space-y-3 border-t p-3'>
                <label className='border-border hover:bg-surface-light flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs font-medium transition'>
                  <Upload className='h-4 w-4' />
                  Upload Image Files
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={onGalleryUpload}
                    className='hidden'
                  />
                </label>

                {form.galleryUploads.length > 0 && (
                  <div className='space-y-2'>
                    <p className='text-text-muted text-[11px]'>
                      Uploaded images (preview + filename)
                    </p>
                    {form.galleryUploads.map(upload => (
                      <div key={upload.id} className='bg-background flex items-center gap-2 rounded-lg border px-2 py-2 text-xs'>
                        <img
                          src={upload.dataUrl}
                          alt={upload.fileName}
                          className='h-12 w-12 shrink-0 rounded-md object-cover'
                        />
                        <p className='flex-1 truncate pr-2'>{upload.fileName}</p>
                        <button
                          type='button'
                          onClick={() => onRemoveGalleryUpload(upload.id)}
                          className='text-text-muted hover:text-error-500'
                          aria-label='Remove upload'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className='border-border rounded-lg border'>
            <button
              type='button'
              onClick={onToggleHours}
              className='text-text-main flex w-full items-center justify-between px-3 py-2.5 text-xs font-semibold'
            >
              Operating Hours
              {showHours ? <ChevronUp className='h-3.5 w-3.5' /> : <ChevronDown className='h-3.5 w-3.5' />}
            </button>
            {showHours && (
              <div className='border-border space-y-2 border-t p-3'>
                {form.operatingHours.map(hour => (
                  <div key={hour.dayOfWeek} className='grid grid-cols-[36px_1fr_1fr_auto_auto] items-center gap-2'>
                    <span className='text-text-muted text-xs'>{dayLabels[hour.dayOfWeek]}</span>
                    <input
                      type='time'
                      value={hour.openTime}
                      disabled={hour.isClosed || hour.is24Hours}
                      onChange={event =>
                        onOperatingHoursChange(hour.dayOfWeek, 'openTime', event.target.value)
                      }
                      className='border-border text-text-main bg-background disabled:bg-muted rounded border px-2 py-1 text-xs'
                    />
                    <input
                      type='time'
                      value={hour.closeTime}
                      disabled={hour.isClosed || hour.is24Hours}
                      onChange={event =>
                        onOperatingHoursChange(hour.dayOfWeek, 'closeTime', event.target.value)
                      }
                      className='border-border text-text-main bg-background disabled:bg-muted rounded border px-2 py-1 text-xs'
                    />
                    <label className='flex items-center gap-1 text-[11px]'>
                      <input
                        type='checkbox'
                        checked={hour.is24Hours}
                        onChange={event =>
                          onOperatingHoursChange(hour.dayOfWeek, 'is24Hours', event.target.checked)
                        }
                      />
                      24h
                    </label>
                    <label className='flex items-center gap-1 text-[11px]'>
                      <input
                        type='checkbox'
                        checked={hour.isClosed}
                        onChange={event =>
                          onOperatingHoursChange(hour.dayOfWeek, 'isClosed', event.target.checked)
                        }
                      />
                      Closed
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {submitStatus === 'error' && (
          <div className='mx-5 mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700'>
            <AlertCircle className='h-4 w-4 shrink-0' />
            {errorMessage}
          </div>
        )}
        {submitStatus === 'success' && (
          <div className='mx-5 mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700'>
            <CheckCircle className='h-4 w-4 shrink-0' />
            Submitted! An admin will review your contribution soon.
          </div>
        )}

        <div className='border-border flex gap-2 border-t px-5 py-3'>
          <button
            type='button'
            onClick={onReset}
            className='border-border text-text-muted hover:bg-surface-light flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition'
          >
            Reset
          </button>
          <button
            type='submit'
            disabled={submitStatus === 'loading' || submitStatus === 'success'}
            className='bg-primary-500 hover:bg-primary-600 flex flex-[2] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60'
          >
            {submitStatus === 'loading' && <Loader2 className='h-4 w-4 animate-spin' />}
            {mode === 'edit' ? 'Submit Edit' : 'Submit New POI'}
          </button>
        </div>
      </form>
    </aside>
  );
}
