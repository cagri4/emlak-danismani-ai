import sharp from 'sharp';
import { getPortalSpecs, PortalType } from './common';

interface ResizedPhoto {
  buffer: Buffer;
  size: number;
  width: number;
  height: number;
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
  const results: ResizedPhoto[] = [];

  for (const url of photoUrls) {
    try {
      // Download photo
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch photo: ${url}`);
        continue;
      }
      const sourceBuffer = Buffer.from(await response.arrayBuffer());

      // Resize for portal
      const resized = await resizeForPortal(sourceBuffer, portal);
      results.push(resized);
    } catch (error) {
      console.error(`Error processing photo ${url}:`, error);
    }
  }

  return results;
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
