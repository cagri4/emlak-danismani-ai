export interface PhotoUpload {
  id: string;
  file: File;
  propertyId: string;
  order: number;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  url?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface PropertyPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  order: number;
  isCover: boolean;
  uploadedAt: Date;
}
