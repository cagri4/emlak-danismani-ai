export type PortalType = 'sahibinden' | 'hepsiemlak' | 'emlakjet';

export interface PortalPhotoSpecs {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  maxSizeBytes: number;
  format: 'jpeg' | 'png';
}

export interface PublishingResult {
  success: boolean;
  portalListingId?: string;
  portalListingUrl?: string;
  error?: string;
}

export interface ListingData {
  propertyId: string;
  title: string;
  description: string;
  price: number;
  currency: 'TRY' | 'USD' | 'EUR';
  propertyType: string;
  listingType?: 'satilik' | 'kiralik';  // Sale or rent
  rooms?: string;
  area?: number;
  floor?: number;
  buildingAge?: number;
  location: {
    city: string;
    district?: string;
    neighborhood?: string;
  };
  features: string[];
  photoUrls: string[];  // Firebase Storage URLs
}
