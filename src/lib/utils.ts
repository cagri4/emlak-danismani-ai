import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate public thumbnail URL from original Firebase Storage URL.
 * Thumbnails are made public by Cloud Function, so we use the public GCS URL.
 *
 * @param originalUrl - The original photo URL from Firebase Storage
 * @returns Public thumbnail URL or null if URL is invalid
 */
export function getThumbnailUrl(originalUrl: string): string | null {
  if (!originalUrl) return null;

  try {
    // Extract bucket and path from Firebase Storage URL
    // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token=xxx
    const urlMatch = originalUrl.match(/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\/([^?]+)/);

    if (!urlMatch) return null;

    const bucket = urlMatch[1];
    const encodedPath = urlMatch[2];
    const path = decodeURIComponent(encodedPath);

    // Generate thumbnail path: replace extension with -thumb.jpg
    const lastDotIndex = path.lastIndexOf('.');
    if (lastDotIndex === -1) return null;

    const thumbnailPath = path.substring(0, lastDotIndex) + '-thumb.jpg';

    // Return public GCS URL (no token needed since thumbnail is public)
    return `https://storage.googleapis.com/${bucket}/${thumbnailPath}`;
  } catch {
    return null;
  }
}
