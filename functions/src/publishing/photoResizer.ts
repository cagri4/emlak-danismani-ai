import sharp from 'sharp';
import { getStorage } from 'firebase-admin/storage';
import { getPortalSpecs, PortalType } from './common';

interface ResizedPhoto {
  buffer: Buffer;
  size: number;
  width: number;
  height: number;
}

/**
 * Download photo from Firebase Storage or external URL
 */
async function downloadPhoto(url: string): Promise<Buffer | null> {
  try {
    // Check if it's a Firebase Storage URL
    if (url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com')) {
      // Extract path from URL
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const storage = getStorage();
        const file = storage.bucket().file(filePath);
        const [buffer] = await file.download();
        return buffer;
      }
    }

    // Fall back to HTTP fetch for external URLs
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`HTTP error fetching ${url}: ${response.status}`);
      return null;
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error(`Error downloading photo ${url}:`, error);
    return null;
  }
}

/**
 * Process photos in parallel with concurrency limit
 */
async function processWithConcurrency<T, R>(
  items: T[],
  processor: (item: T) => Promise<R | null>,
  concurrency: number = 3
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );
    // Filter out null results and add to results array
    for (const result of batchResults) {
      if (result !== null) {
        results.push(result as R);
      }
    }
  }

  return results;
}

/**
 * Resize a single photo for a specific portal
 * Handles quality reduction if size exceeds limit
 */
export async function resizeForPortal(
  sourceBuffer: Buffer,
  portal: PortalType
): Promise<ResizedPhoto> {
  const specs = getPortalSpecs(portal);
  let quality = specs.quality;

  // Initial resize
  let buffer = await sharp(sourceBuffer)
    .resize(specs.maxWidth, specs.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({
      quality,
      progressive: true,
      mozjpeg: true
    })
    .toBuffer();

  // Reduce quality if still too large
  while (buffer.length > specs.maxSizeBytes && quality > 60) {
    quality -= 5;
    buffer = await sharp(sourceBuffer)
      .resize(specs.maxWidth, specs.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();
  }

  // Get final dimensions
  const metadata = await sharp(buffer).metadata();

  return {
    buffer,
    size: buffer.length,
    width: metadata.width || specs.maxWidth,
    height: metadata.height || specs.maxHeight
  };
}

/**
 * Resize all photos for a specific portal
 * Downloads from Firebase Storage, resizes, returns buffers
 */
export async function generatePortalPhotos(
  photoUrls: string[],
  portal: PortalType
): Promise<ResizedPhoto[]> {
  console.log(`Processing ${photoUrls.length} photos for ${portal}`);

  // Process photos with concurrency limit
  const processor = async (url: string): Promise<ResizedPhoto | null> => {
    try {
      // Download photo
      const sourceBuffer = await downloadPhoto(url);
      if (!sourceBuffer) {
        return null;
      }

      // Resize for portal
      const resized = await resizeForPortal(sourceBuffer, portal);
      console.log(`Resized photo: ${resized.width}x${resized.height}, ${(resized.size / 1024).toFixed(1)}KB`);
      return resized;
    } catch (error) {
      console.error(`Error processing photo ${url}:`, error);
      return null;
    }
  };

  return processWithConcurrency(photoUrls, processor, 3);
}

/**
 * Validate photo meets portal requirements
 */
export function validateForPortal(
  buffer: Buffer,
  portal: PortalType
): { valid: boolean; errors: string[] } {
  const specs = getPortalSpecs(portal);
  const errors: string[] = [];

  if (buffer.length > specs.maxSizeBytes) {
    errors.push(`Dosya boyutu cok buyuk: ${(buffer.length / 1024 / 1024).toFixed(2)}MB (max: ${specs.maxSizeBytes / 1024 / 1024}MB)`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
