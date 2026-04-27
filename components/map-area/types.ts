export type POITagCluster = {
  id: string;
  name: string;
  iconName: string;
};

export type POITag = {
  id: string;
  name: string;
  iconName?: string | null;
  cluster?: POITagCluster | null;
};

export type POIGallery = {
  id: string;
  imageUrl: string;
};

export type POILink = {
  id: string;
  label: string;
  url: string;
};

export type POIReview = {
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
};

export type POIAddress = {
  street?: string | null;
  barangay?: string | null;
  cityMunicipality?: string | null;
  province?: string | null;
  postalCode?: string | null;
};

export type OperatingHours = {
  id: string;
  dayOfWeek: number; // 0 (Sun) – 6 (Sat)
  openTime: string | null;  // "HH:mm"
  closeTime: string | null; // "HH:mm"
  isClosed: boolean;
  is24Hours: boolean;
};

export type POI = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  phoneNumber?: string | null;
  email?: string | null;
  vouchCount: number;
  primaryTagId?: string | null;
  tags: POITag[];
  galleries: POIGallery[];
  address?: POIAddress | null;
  operatingHours: OperatingHours[];
  links: POILink[];
  reviews: POIReview[];
};

