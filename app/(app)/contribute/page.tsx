'use client';

import { ChangeEvent, useMemo, useRef, useState } from 'react';
import ContributeMapArea, {
  type PickedLocation
} from '@/components/map-area/ContributeMapArea';
import { usePois } from '@/components/map-area/use-pois';
import type { MapRef } from '@/components/ui/map';
import type { POI } from '@/components/map-area/types';
import {
  ContributionSidebar,
  type ContributionAddressForm,
  type ContributionContactForm,
  type ContributionFormState,
  type ContributionGalleryUpload,
  type ContributionOperatingHourForm,
  type SubmitStatus
} from '@/components/contribute/ContributionSidebar';
import PoiDetailsOverlay, { type POIWithRelations } from '@/components/map-area/PoiDetailsOverlay';

const dayIndexes = [0, 1, 2, 3, 4, 5, 6] as const;

function createInitialOperatingHours(): ContributionOperatingHourForm[] {
  return dayIndexes.map(dayOfWeek => ({
    dayOfWeek,
    openTime: '',
    closeTime: '',
    isClosed: false,
    is24Hours: false
  }));
}

function createInitialAddress(): ContributionAddressForm {
  return {
    blockLotNumber: '',
    houseNumber: '',
    purok: '',
    street: '',
    subdivisionName: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    postalCode: ''
  };
}

function createInitialContact(): ContributionContactForm {
  return {
    websites: [''],
    phoneNumbers: ['']
  };
}

function createInitialForm(): ContributionFormState {
  return {
    name: '',
    description: '',
    primaryTagName: '',
    primaryTagIcon: '',
    latitude: '',
    longitude: '',
    address: createInitialAddress(),
    operatingHours: createInitialOperatingHours(),
    galleryUploads: [],
    contact: createInitialContact()
  };
}

function getFileNameFromImageUrl(imageUrl: string): string {
  const sanitizedUrl = imageUrl.split('?')[0] ?? imageUrl;
  const segments = sanitizedUrl.split('/').filter(Boolean);
  const fileName = segments.at(-1);

  if (!fileName) return 'uploaded-image';

  return decodeURIComponent(fileName);
}

function mapPoiToForm(poi: POI): ContributionFormState {
  const mappedHours = createInitialOperatingHours().map(baseHour => {
    const existingHour = poi.operatingHours.find(
      hour => hour.dayOfWeek === baseHour.dayOfWeek
    );
    if (!existingHour) return baseHour;

    return {
      ...baseHour,
      openTime: existingHour.openTime ?? '',
      closeTime: existingHour.closeTime ?? '',
      isClosed: existingHour.isClosed,
      is24Hours: existingHour.is24Hours
    };
  });

  const primaryTag =
    poi.tags?.find(t => t.id === poi.primaryTagId) || poi.tags?.[0];
  const primaryIcon =
    primaryTag?.iconName ?? primaryTag?.cluster?.iconName ?? '';
  const primaryTagName = primaryTag?.name ?? '';

  return {
    name: poi.name,
    description: poi.description ?? '',
    primaryTagName,
    primaryTagIcon: primaryIcon,
    latitude: poi.latitude.toString(),
    longitude: poi.longitude.toString(),
    address: {
      blockLotNumber: '',
      houseNumber: '',
      purok: '',
      street: poi.address?.street ?? '',
      subdivisionName: '',
      barangay: poi.address?.barangay ?? '',
      cityMunicipality: poi.address?.cityMunicipality ?? '',
      province: poi.address?.province ?? '',
      postalCode: poi.address?.postalCode ?? ''
    },
    operatingHours: mappedHours,
    galleryUploads: poi.galleries.map(gallery => ({
      id: gallery.id,
      fileName: getFileNameFromImageUrl(gallery.imageUrl),
      mimeType: '',
      size: 0,
      dataUrl: gallery.imageUrl
    })),
    contact: createInitialContact()
  };
}

function parseCoordinate(value: string): number | null {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) return null;

  return parsedValue;
}

function cleanString(value: string): string | undefined {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) return undefined;

  return trimmedValue;
}

export default function ContributePage() {
  const mapRef = useRef<MapRef | null>(null);
  const { pois } = usePois();

  const [isPinModeEnabled, setIsPinModeEnabled] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(
    null
  );
  const [editingPoi, setEditingPoi] = useState<POI | null>(null);
  const [form, setForm] = useState<ContributionFormState>(createInitialForm);
  const [showAddress, setShowAddress] = useState(false);
  const [showMedia, setShowMedia] = useState(true);
  const [showHours, setShowHours] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const mode = editingPoi ? 'edit' : 'add';

  const hiddenPoiIds = useMemo(() => {
    if (!editingPoi) return [];
    return [editingPoi.id];
  }, [editingPoi]);

  const syncCoordinates = (latitude: number, longitude: number) => {
    setForm(previousForm => ({
      ...previousForm,
      latitude: latitude.toString(),
      longitude: longitude.toString()
    }));
    setPickedLocation({ latitude, longitude });
  };

  const handleLocationPick = (location: PickedLocation) => {
    syncCoordinates(location.latitude, location.longitude);
  };

  const handleSuggestEdit = (poi: POI) => {
    setEditingPoi(poi);
    setForm(mapPoiToForm(poi));
    setPickedLocation({ latitude: poi.latitude, longitude: poi.longitude });
    setIsPinModeEnabled(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    setCurrentStep(1); // Jump to Basics step since location is already set
  };

  const handleFormFieldChange = (
    field: keyof ContributionFormState,
    value: string
  ) => {
    setForm(previousForm => ({ ...previousForm, [field]: value }));
  };

  const handleAddressFieldChange = (
    field: keyof ContributionAddressForm,
    value: string
  ) => {
    setForm(previousForm => ({
      ...previousForm,
      address: { ...previousForm.address, [field]: value }
    }));
  };

  const handleCoordinateChange = (
    field: 'latitude' | 'longitude',
    value: string
  ) => {
    setForm(previousForm => {
      const updatedForm = { ...previousForm, [field]: value };
      const parsedLatitude = parseCoordinate(updatedForm.latitude);
      const parsedLongitude = parseCoordinate(updatedForm.longitude);

      if (parsedLatitude !== null && parsedLongitude !== null) {
        setPickedLocation({
          latitude: parsedLatitude,
          longitude: parsedLongitude
        });
      }

      return updatedForm;
    });
  };

  const handleOperatingHoursChange = (
    dayOfWeek: number,
    field: keyof Omit<ContributionOperatingHourForm, 'dayOfWeek'>,
    value: string | boolean
  ) => {
    setForm(previousForm => ({
      ...previousForm,
      operatingHours: previousForm.operatingHours.map(hour => {
        if (hour.dayOfWeek !== dayOfWeek) return hour;
        if (field === 'isClosed' && value === true) {
          return {
            ...hour,
            isClosed: true,
            is24Hours: false,
            openTime: '',
            closeTime: ''
          };
        }
        if (field === 'is24Hours' && value === true) {
          return {
            ...hour,
            is24Hours: true,
            isClosed: false,
            openTime: '',
            closeTime: ''
          };
        }

        return { ...hour, [field]: value };
      })
    }));
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const uploadPromises = Array.from(files).map(file => {
      return new Promise<ContributionGalleryUpload>((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const result = fileReader.result;
          if (typeof result !== 'string') {
            reject(new Error('Failed to parse uploaded file.'));
            return;
          }

          resolve({
            id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
            dataUrl: result
          });
        };
        fileReader.onerror = () =>
          reject(new Error('Failed to read uploaded file.'));
        fileReader.readAsDataURL(file);
      });
    });

    try {
      const uploads = await Promise.all(uploadPromises);
      setForm(previousForm => ({
        ...previousForm,
        galleryUploads: [...previousForm.galleryUploads, ...uploads]
      }));
    } catch {
      setSubmitStatus('error');
      setErrorMessage('Could not upload one or more selected images.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveGalleryUpload = (id: string) => {
    setForm(previousForm => ({
      ...previousForm,
      galleryUploads: previousForm.galleryUploads.filter(
        upload => upload.id !== id
      )
    }));
  };

  const handleContactFieldChange = (
    field: keyof ContributionContactForm,
    index: number,
    value: string
  ) => {
    setForm(previousForm => ({
      ...previousForm,
      contact: {
        ...previousForm.contact,
        [field]: previousForm.contact[field].map((entry, entryIndex) =>
          entryIndex === index ? value : entry
        )
      }
    }));
  };

  const handleAddContactField = (field: keyof ContributionContactForm) => {
    setForm(previousForm => ({
      ...previousForm,
      contact: {
        ...previousForm.contact,
        [field]: [...previousForm.contact[field], '']
      }
    }));
  };

  const handleRemoveContactField = (
    field: keyof ContributionContactForm,
    index: number
  ) => {
    setForm(previousForm => ({
      ...previousForm,
      contact: {
        ...previousForm.contact,
        [field]:
          previousForm.contact[field].length <= 1
            ? ['']
            : previousForm.contact[field].filter(
                (_, entryIndex) => entryIndex !== index
              )
      }
    }));
  };

  const handleReset = () => {
    setPickedLocation(null);
    setEditingPoi(null);
    setForm(createInitialForm());
    setShowAddress(false);
    setShowMedia(true);
    setShowHours(false);
    setSubmitStatus('idle');
    setErrorMessage('');
    setIsPinModeEnabled(false);
    setCurrentStep(0);
  };

  const handleClearPickedLocation = () => {
    setPickedLocation(null);
    setForm(previousForm => ({
      ...previousForm,
      latitude: '',
      longitude: ''
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const latitude = parseCoordinate(form.latitude);
    const longitude = parseCoordinate(form.longitude);

    if (!form.name.trim()) {
      setErrorMessage('Location name is required.');
      setSubmitStatus('error');
      return;
    }

    if (latitude === null || longitude === null) {
      setErrorMessage('Valid latitude and longitude are required.');
      setSubmitStatus('error');
      return;
    }

    setSubmitStatus('loading');
    setErrorMessage('');

    const cleanAddress = Object.fromEntries(
      Object.entries(form.address)
        .map(([key, value]) => [key, cleanString(value)])
        .filter(([, value]) => value !== undefined)
    );

    const proposedData = {
      name: form.name.trim(),
      description: form.description.trim(),
      latitude,
      longitude,
      address: cleanAddress,
      contact: {
        websites: form.contact.websites.map(cleanString).filter(Boolean),
        phoneNumbers: form.contact.phoneNumbers.map(cleanString).filter(Boolean)
      },
      galleries: {
        uploads: form.galleryUploads.map(upload => ({
          fileName: upload.fileName,
          mimeType: upload.mimeType,
          size: upload.size,
          dataUrl: upload.dataUrl
        }))
      },
      operatingHours: form.operatingHours.map(hour => ({
        dayOfWeek: hour.dayOfWeek,
        openTime:
          hour.isClosed || hour.is24Hours
            ? undefined
            : cleanString(hour.openTime),
        closeTime:
          hour.isClosed || hour.is24Hours
            ? undefined
            : cleanString(hour.closeTime),
        isClosed: hour.isClosed,
        is24Hours: hour.is24Hours
      }))
    };

    try {
      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: mode === 'edit' ? 'UPDATE' : 'CREATE',
          poiId: editingPoi?.id ?? undefined,
          proposedData
        })
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error ?? 'Submission failed');
      }

      setSubmitStatus('success');
      setTimeout(handleReset, 2500);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong.'
      );
      setSubmitStatus('error');
    }
  };

  const availableClusters = Array.from(
    new Set(
      pois.flatMap(poi => poi.tags.map(t => t.cluster?.name).filter(Boolean))
    )
  ) as string[];
  const availableTags = Array.from(
    new Set(pois.flatMap(poi => poi.tags.map(t => t.name).filter(Boolean)))
  ) as string[];

  const previewPoi: POIWithRelations = useMemo(() => {
    const lat = parseCoordinate(form.latitude) || 0;
    const lng = parseCoordinate(form.longitude) || 0;
    
    return {
      id: editingPoi?.id || 'preview-poi',
      name: form.name || 'Your Location Name',
      description: form.description,
      latitude: lat,
      longitude: lng,
      phoneNumber: form.contact.phoneNumbers.find(Boolean) || null,
      email: null,
      address: {
        street: form.address.street || null,
        barangay: form.address.barangay || null,
        city: form.address.cityMunicipality || '',
        province: form.address.province || ''
      },
      operatingHours: form.operatingHours,
      links: form.contact.websites.filter(Boolean).map(url => ({ label: 'Website', url, iconType: 'globe' })),
      galleries: form.galleryUploads.map(upload => ({ id: upload.id, imageUrl: upload.dataUrl })),
      reviews: editingPoi ? (editingPoi as any).reviews : [],
      tags: [{ 
        id: `mock-tag-${Date.now()}`, 
        name: form.primaryTagName || 'Category', 
        iconName: form.primaryTagIcon,
        clusterId: null
      }],
      priceLevel: (editingPoi as any)?.priceLevel
    };
  }, [form, editingPoi]);

  return (
    <div className='relative flex h-full w-full overflow-hidden'>
      <ContributionSidebar
        mode={mode}
        selectedPoi={editingPoi}
        form={form}
        showAddress={showAddress}
        showMedia={showMedia}
        showHours={showHours}
        submitStatus={submitStatus}
        errorMessage={errorMessage}
        isPinModeEnabled={isPinModeEnabled}
        availableClusters={availableClusters}
        availableTags={availableTags}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onReset={handleReset}
        onSubmit={handleSubmit}
        onTogglePinMode={() =>
          setIsPinModeEnabled(previousValue => !previousValue)
        }
        onClearPickedLocation={handleClearPickedLocation}
        onFormFieldChange={handleFormFieldChange}
        onAddressFieldChange={handleAddressFieldChange}
        onCoordinateChange={handleCoordinateChange}
        onToggleAddress={() => setShowAddress(previousValue => !previousValue)}
        onToggleMedia={() => setShowMedia(previousValue => !previousValue)}
        onToggleHours={() => setShowHours(previousValue => !previousValue)}
        onOperatingHoursChange={handleOperatingHoursChange}
        onGalleryUpload={handleGalleryUpload}
        onRemoveGalleryUpload={handleRemoveGalleryUpload}
        onContactFieldChange={handleContactFieldChange}
        onAddContactField={handleAddContactField}
        onRemoveContactField={handleRemoveContactField}
      />

      <div className='relative h-full flex-1'>
        {isPinModeEnabled && !pickedLocation && (
          <div className='pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2'>
            <div className='bg-background/95 text-text-main rounded-full border px-4 py-2 text-sm font-medium shadow backdrop-blur-sm'>
              Click anywhere on the map to place your pin
            </div>
          </div>
        )}

        <ContributeMapArea
          pois={pois}
          pickedLocation={pickedLocation}
          onLocationPick={location => {
            handleLocationPick(location);
            setIsPinModeEnabled(false);
          }}
          onSuggestEdit={handleSuggestEdit}
          mapRef={mapRef}
          isAddMode={isPinModeEnabled}
          hiddenPoiIds={hiddenPoiIds}
        />

        {currentStep > 0 && (
          <div className="absolute inset-y-0 right-0 left-0 md:left-1/2 z-40 bg-surface shadow-2xl animate-in slide-in-from-right duration-300">
            <PoiDetailsOverlay 
              poi={previewPoi} 
              copied={false} 
              onClose={() => {}} 
              onCopyShareUrl={() => {}} 
              panelMode={false} 
              previewMode={true} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
