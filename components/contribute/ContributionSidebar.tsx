'use client';

import { ChangeEvent, useState, useEffect } from 'react';
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
  ArrowRight,
  ArrowLeft
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
  currentStep: number;
  onStepChange: (step: number) => void;
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
  onOperatingHoursChange: (dayOfWeek: number, field: keyof Omit<ContributionOperatingHourForm, 'dayOfWeek'>, value: string | boolean) => void;
  onGalleryUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveGalleryUpload: (id: string) => void;
  onContactFieldChange: (field: keyof ContributionContactForm, index: number, value: string) => void;
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
  currentStep,
  onStepChange,
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
  onRemoveContactField
}: ContributionSidebarProps) {
  const hasCoordinates = form.latitude.trim().length > 0 && form.longitude.trim().length > 0;
  
  const [phoneErrors, setPhoneErrors] = useState<Record<number, string>>({});
  const hasPhoneErrors = Object.keys(phoneErrors).length > 0;
  
  // Navigate Steps
  const nextStep = () => onStepChange(currentStep + 1);
  const prevStep = () => onStepChange(currentStep - 1);

  // Validate basics step
  const isBasicsValid = form.name.trim().length > 0 && form.primaryTagName.trim().length > 0;

  return (
    <aside className='bg-surface border-border flex h-full w-[450px] shrink-0 flex-col border-r shadow-xl relative z-10'>
      <div className='border-border border-b px-6 py-5 bg-surface'>
        <div className='flex items-center gap-2 mb-2'>
          <span className='text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full'>
            Step {currentStep + 1} of 3
          </span>
          <span className='text-xs font-medium text-text-muted'>
            {currentStep === 0 ? 'Location' : currentStep === 1 ? 'Basics' : 'Details'}
          </span>
        </div>
        <TextHeading className='text-text-main text-xl font-bold'>
          {mode === 'edit' ? 'Edit Location' : 'Add New Location'}
        </TextHeading>
        <TextBody className='text-text-muted mt-1 text-sm leading-snug'>
          {currentStep === 0 && 'First, drop a pin on the map.'}
          {currentStep === 1 && 'What is this place?'}
          {currentStep === 2 && 'Add photos, hours, and contacts (Optional).'}
        </TextBody>
      </div>

      <div className='flex flex-1 flex-col overflow-hidden'>
        <div className='flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5'>
          
          {/* STEP 0: LOCATION */}
          {currentStep === 0 && (
            <div className='flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300'>
              <div className='bg-surface-light border border-border p-4 rounded-xl flex flex-col items-center justify-center text-center gap-3'>
                <div className='bg-primary-100 text-primary-600 p-3 rounded-full'>
                  <MapPin className='w-6 h-6' />
                </div>
                <div>
                  <h4 className='text-sm font-semibold mb-1'>{hasCoordinates ? 'Location Selected!' : 'Where is it?'}</h4>
                  <p className='text-xs text-text-muted max-w-[250px]'>
                    {hasCoordinates 
                      ? 'Great! Click the button below to continue, or move the map to pick a different spot.' 
                      : 'Click the button below and then click anywhere on the map to set the exact coordinates.'}
                  </p>
                </div>
                
                <button
                  type='button'
                  onClick={onTogglePinMode}
                  aria-pressed={isPinModeEnabled}
                  className={cn(
                    'inline-flex w-full mt-2 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all',
                    isPinModeEnabled
                      ? 'bg-primary-500 text-white shadow-md scale-105'
                      : 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 border'
                  )}
                >
                  <MapPinPlusInside className='h-4 w-4' />
                  {isPinModeEnabled ? 'Click map to place pin...' : (hasCoordinates ? 'Reposition Pin' : 'Enable Pin Mode')}
                </button>
              </div>

              {hasCoordinates && (
                <div className='flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-lg'>
                  <p className='text-emerald-700 flex items-center gap-2 text-xs font-medium'>
                    <CheckCircle className='h-4 w-4 shrink-0' />
                    {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
                  </p>
                  <button
                    type='button'
                    onClick={onClearPickedLocation}
                    className='text-emerald-600 hover:text-emerald-800 text-xs font-semibold'
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: BASICS */}
          {currentStep === 1 && (
            <div className='flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300'>
              <div className='flex flex-col gap-1.5'>
                <div className='flex items-center justify-between'>
                  <label className='text-text-main text-sm font-semibold' htmlFor='contrib-name'>
                    Name <span className='text-error-500'>*</span>
                  </label>
                  <span className='text-[10px] text-slate-400'>{form.name.length}/100</span>
                </div>
                <input
                  id='contrib-name'
                  type='text'
                  required
                  maxLength={100}
                  placeholder="e.g., The Secret Garden Cafe"
                  value={form.name}
                  onChange={event => onFormFieldChange('name', event.target.value)}
                  className='border-border text-text-main placeholder:text-text-muted/60 bg-background focus:border-primary-400 rounded-lg border px-4 py-2.5 text-sm transition outline-none'
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <div className='flex items-center justify-between'>
                  <label className='text-text-main text-sm font-semibold' htmlFor='contrib-desc'>
                    Description
                  </label>
                  <span className='text-[10px] text-slate-400'>{form.description.length}/500</span>
                </div>
                <textarea
                  id='contrib-desc'
                  rows={4}
                  maxLength={500}
                  placeholder="What makes this place special?"
                  value={form.description}
                  onChange={event => onFormFieldChange('description', event.target.value)}
                  className='border-border text-text-main placeholder:text-text-muted/60 bg-background focus:border-primary-400 resize-none rounded-lg border px-4 py-2.5 text-sm transition outline-none'
                />
              </div>

              <div className='border-border bg-surface-light/50 space-y-4 rounded-xl border p-4'>
                <p className='text-text-main text-sm font-semibold'>Category & Tags</p>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-text-muted text-[11px] font-semibold' htmlFor='contrib-tag'>
                    Tag <span className='text-error-500'>*</span>
                    </label>
                    <AutocompleteInput
                      id='contrib-tag'
                      placeholder='e.g. Cafe'
                      required
                      value={form.primaryTagName}
                      onValueChange={val => onFormFieldChange('primaryTagName', val)}
                      options={availableTags}
                    />
                </div>
                <div className='pt-2 border-t border-border'>
                  <p className='text-[11px] font-semibold text-text-muted mb-2'>Icon</p>
                  <IconPicker
                    value={form.primaryTagIcon}
                    onChange={val => onFormFieldChange('primaryTagIcon', val)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {currentStep === 2 && (
            <div className='flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300'>
              
              {/* Media */}
              <div className='border-border rounded-xl border bg-background overflow-hidden shadow-sm'>
                <button type='button' onClick={onToggleMedia} className='text-text-main bg-surface flex w-full items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-surface-light transition'>
                  Photos
                  {showMedia ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
                </button>
                {showMedia && (
                  <div className='border-border space-y-3 border-t p-4'>
                    <label className='border-border hover:bg-primary-50 hover:border-primary-200 text-primary-600 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm font-medium transition'>
                      <Upload className='h-5 w-5' />
                      Upload Images
                      <input type='file' accept='image/*' multiple onChange={onGalleryUpload} className='hidden' />
                    </label>

                    {form.galleryUploads.length > 0 && (
                      <div className='space-y-2 mt-3'>
                        {form.galleryUploads.map(upload => (
                          <div key={upload.id} className='bg-surface flex items-center gap-3 rounded-lg border px-2 py-2 text-sm'>
                            <img src={upload.dataUrl} alt={upload.fileName} className='h-10 w-10 shrink-0 rounded object-cover' />
                            <p className='flex-1 truncate text-xs font-medium'>{upload.fileName}</p>
                            <button type='button' onClick={() => onRemoveGalleryUpload(upload.id)} className='text-text-muted hover:text-error-500 p-1'>
                              <Trash2 className='h-4 w-4' />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hours */}
              <div className='border-border rounded-xl border bg-background overflow-hidden shadow-sm'>
                <button type='button' onClick={onToggleHours} className='text-text-main bg-surface flex w-full items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-surface-light transition'>
                  Operating Hours
                  {showHours ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
                </button>
                {showHours && (
                  <div className='border-border space-y-3 border-t p-4'>
                    {form.operatingHours.map(hour => (
                      <div key={hour.dayOfWeek} className='grid grid-cols-[36px_1fr_1fr_auto_auto] items-center gap-2'>
                        <span className='text-text-main text-xs font-medium'>{dayLabels[hour.dayOfWeek]}</span>
                        <input type='time' value={hour.openTime} disabled={hour.isClosed || hour.is24Hours} onChange={event => onOperatingHoursChange(hour.dayOfWeek, 'openTime', event.target.value)} className='border-border text-text-main bg-background disabled:bg-surface disabled:opacity-50 rounded-md border px-2 py-1.5 text-xs' />
                        <input type='time' value={hour.closeTime} disabled={hour.isClosed || hour.is24Hours} onChange={event => onOperatingHoursChange(hour.dayOfWeek, 'closeTime', event.target.value)} className='border-border text-text-main bg-background disabled:bg-surface disabled:opacity-50 rounded-md border px-2 py-1.5 text-xs' />
                        <label className='flex items-center gap-1.5 text-[11px] font-medium'>
                          <input type='checkbox' checked={hour.is24Hours} onChange={event => onOperatingHoursChange(hour.dayOfWeek, 'is24Hours', event.target.checked)} className='rounded border-border' /> 24h
                        </label>
                        <label className='flex items-center gap-1.5 text-[11px] font-medium'>
                          <input type='checkbox' checked={hour.isClosed} onChange={event => onOperatingHoursChange(hour.dayOfWeek, 'isClosed', event.target.checked)} className='rounded border-border' /> Closed
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Address */}
              <div className='border-border rounded-xl border bg-background overflow-hidden shadow-sm'>
                <button type='button' onClick={onToggleAddress} className='text-text-main bg-surface flex w-full items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-surface-light transition'>
                  Address Details
                  {showAddress ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
                </button>
                {showAddress && (
                  <div className='border-border grid grid-cols-2 gap-3 border-t p-4'>
                    {(
                      [
                        ['blockLotNumber', 'Block/Lot'],
                        ['houseNumber', 'House No.'],
                        ['street', 'Street'],
                        ['barangay', 'Barangay'],
                        ['cityMunicipality', 'City/Municipality'],
                        ['province', 'Province'],
                        ['postalCode', 'Postal Code']
                      ] as [keyof ContributionAddressForm, string][]
                    ).map(([field, label]) => (
                      <div key={field} className='flex flex-col gap-1'>
                        <div className='flex items-center justify-between'>
                          <label className='text-text-muted text-[11px] font-semibold' htmlFor={`contrib-address-${field}`}>{label}</label>
                          <span className='text-[9px] text-slate-400'>{(form.address[field] || '').length}/100</span>
                        </div>
                        <input id={`contrib-address-${field}`} type='text' maxLength={100} value={form.address[field]} onChange={event => onAddressFieldChange(field, event.target.value)} className='border-border text-text-main bg-background focus:border-primary-400 rounded-md border px-3 py-1.5 text-xs transition outline-none' />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contacts */}
              <div className='border-border bg-surface-light/50 space-y-4 rounded-xl border p-4'>
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-semibold'>Websites</p>
                    <button type='button' onClick={() => onAddContactField('websites')} className='text-primary-600 text-xs font-bold hover:underline'>+ Add</button>
                  </div>
                  {form.contact.websites.map((website, index) => (
                    <div key={`website-${index}`} className='flex flex-col gap-1'>
                      <div className='flex items-center gap-2'>
                        <input type='url' maxLength={200} placeholder='https://example.com' value={website} onChange={event => onContactFieldChange('websites', index, event.target.value)} className='border-border text-text-main bg-background focus:border-primary-400 flex-1 rounded-lg border px-3 py-2 text-sm transition outline-none' />
                        <button type='button' onClick={() => onRemoveContactField('websites', index)} className='text-text-muted hover:text-error-500 p-1.5 bg-surface rounded-md border border-border'><Trash2 className='h-4 w-4' /></button>
                      </div>
                      <span className='text-[10px] text-slate-400 text-right pr-10'>{(website || '').length}/200</span>
                    </div>
                  ))}
                </div>

                <div className='flex flex-col gap-2 border-t border-border pt-4'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-semibold'>Phone Numbers</p>
                    <button type='button' onClick={() => onAddContactField('phoneNumbers')} className='text-primary-600 text-xs font-bold hover:underline'>+ Add</button>
                  </div>
                  {form.contact.phoneNumbers.map((phone, index) => (
                    <div key={`phone-${index}`} className='flex flex-col gap-1'>
                      <div className='flex items-center gap-2'>
                        <input
                          type='tel'
                          maxLength={20}
                          placeholder='+63 900 000 0000'
                          value={phone}
                          onChange={event => {
                            const val = event.target.value;
                            onContactFieldChange('phoneNumbers', index, val);
                            if (val && !/^\+?[0-9\s\-()]{7,20}$/.test(val)) {
                              setPhoneErrors(prev => ({ ...prev, [index]: 'Invalid phone number format.' }));
                            } else {
                              setPhoneErrors(prev => { const n = {...prev}; delete n[index]; return n; });
                            }
                          }}
                          className={cn('border-border text-text-main bg-background focus:border-primary-400 flex-1 rounded-lg border px-3 py-2 text-sm transition outline-none', phoneErrors[index] && 'border-error-500 focus:border-error-500')}
                        />
                        <button type='button' onClick={() => {
                          onRemoveContactField('phoneNumbers', index);
                          setPhoneErrors(prev => { const n = {...prev}; delete n[index]; return n; });
                        }} className='text-text-muted hover:text-error-500 p-1.5 bg-surface rounded-md border border-border'><Trash2 className='h-4 w-4' /></button>
                      </div>
                      <div className='flex items-center justify-between pr-10'>
                        <span className='text-[10px] text-error-500'>{phoneErrors[index] || ''}</span>
                        <span className='text-[10px] text-slate-400'>{(phone || '').length}/20</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className='border-border bg-surface border-t p-5'>
          {submitStatus === 'error' && (
            <div className='mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-700 font-medium'>
              <AlertCircle className='h-4 w-4 shrink-0' />
              {errorMessage}
            </div>
          )}
          {submitStatus === 'success' && (
            <div className='mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 font-medium'>
              <CheckCircle className='h-4 w-4 shrink-0' />
              Submitted! An admin will review it soon.
            </div>
          )}

          <div className='flex items-center gap-3'>
            {currentStep === 0 ? (
               <button type='button' onClick={onReset} className='text-text-muted hover:bg-surface-light flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition'>
                 Cancel
               </button>
            ) : (
               <button type='button' onClick={prevStep} className='border-border text-text-main hover:bg-surface-light flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition flex items-center justify-center gap-2'>
                 <ArrowLeft className='w-4 h-4' /> Back
               </button>
            )}

            {currentStep < 2 ? (
              <button 
                type='button' 
                onClick={nextStep} 
                disabled={currentStep === 0 ? !hasCoordinates : !isBasicsValid}
                className='bg-primary-600 hover:bg-primary-700 text-white flex flex-[2] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Next <ArrowRight className='w-4 h-4' />
              </button>
            ) : (
              <button
                type='button'
                onClick={onSubmit}
                disabled={submitStatus === 'loading' || submitStatus === 'success' || hasPhoneErrors}
                className='bg-emerald-600 hover:bg-emerald-700 text-white flex flex-[2] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {submitStatus === 'loading' && <Loader2 className='h-4 w-4 animate-spin' />}
                {mode === 'edit' ? 'Submit Edit' : 'Submit Location'}
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
