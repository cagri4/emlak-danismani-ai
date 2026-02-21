import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase';

const functions = getFunctions(app, 'europe-west1');

interface EnhancePhotoParams {
  photoUrl: string;
  propertyId: string;
  photoIndex: number;
  options?: {
    brightness?: number;
    saturation?: number;
    sharpen?: boolean;
    clahe?: boolean;
    skyReplace?: boolean;
    perspectiveCorrect?: boolean;
  };
}

interface EnhancePhotoResult {
  success: boolean;
  enhancedUrl?: string;
  error?: string;
  processingTime?: number;
  cloudinaryUsed?: boolean;
}

/**
 * Enhance a property photo using the Cloud Function.
 *
 * @param params - Photo URL, property ID, and optional enhancement options
 * @returns Result with enhanced photo URL or error message
 */
export async function enhancePhoto(params: EnhancePhotoParams): Promise<EnhancePhotoResult> {
  const enhancePropertyPhoto = httpsCallable<EnhancePhotoParams, EnhancePhotoResult>(
    functions,
    'enhancePropertyPhoto'
  );

  const result = await enhancePropertyPhoto(params);
  return result.data;
}

/**
 * Check if a photo URL indicates it has already been enhanced.
 *
 * @param photoUrl - The photo URL to check
 * @returns True if the URL contains '_enhanced', false otherwise
 */
export function isEnhanced(photoUrl: string): boolean {
  return photoUrl.includes('_enhanced');
}

/**
 * Predefined enhancement presets for different photo conditions.
 */
export const ENHANCEMENT_PRESETS = {
  auto: { brightness: 1.1, saturation: 1.1, sharpen: true },
  bright: { brightness: 1.2, saturation: 1.0, sharpen: true },
  vibrant: { brightness: 1.05, saturation: 1.2, sharpen: true },
  dark_room: { brightness: 1.15, saturation: 1.1, sharpen: true, clahe: true },
  sky_replace: { skyReplace: true },
  perspective: { perspectiveCorrect: true },
  full_ai: { brightness: 1.1, saturation: 1.1, sharpen: true, skyReplace: true, perspectiveCorrect: true },
} as const;
