import { PortalType, PortalPhotoSpecs } from './types';

export function getPortalSpecs(portal: PortalType): PortalPhotoSpecs {
  const specs: Record<PortalType, PortalPhotoSpecs> = {
    sahibinden: {
      maxWidth: 800,
      maxHeight: 600,
      quality: 85,
      maxSizeBytes: 5 * 1024 * 1024, // 5MB
      format: 'jpeg'
    },
    hepsiemlak: {
      maxWidth: 1024,
      maxHeight: 768,
      quality: 85,
      maxSizeBytes: 5 * 1024 * 1024,
      format: 'jpeg'
    },
    emlakjet: {
      maxWidth: 1024,
      maxHeight: 768,
      quality: 85,
      maxSizeBytes: 5 * 1024 * 1024,
      format: 'jpeg'
    }
  };
  return specs[portal];
}

export { PortalType };
