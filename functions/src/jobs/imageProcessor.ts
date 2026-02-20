import { onObjectFinalized } from 'firebase-functions/v2/storage';
import * as admin from 'firebase-admin';
import sharp from 'sharp';
import { REGION } from '../config';

/**
 * Cloud Function that automatically processes property photos on upload.
 *
 * Triggers on: properties/* path
 * Actions:
 * - Generates thumbnail (200x200, quality 80)
 * - Compresses original (quality 85)
 *
 * Per KVKK compliance: All processing in europe-west1 region
 */
export const processPropertyPhoto = onObjectFinalized(
  {
    region: REGION,
    memory: '1GiB',
    timeoutSeconds: 120,
  },
  async (event) => {
    const filePath = event.data.name;
    const contentType = event.data.contentType;
    const bucket = admin.storage().bucket(event.bucket);

    // Skip if not an image
    if (!contentType || !contentType.startsWith('image/')) {
      console.log(`Skipping non-image file: ${filePath}`);
      return;
    }

    // Skip if already processed
    if (filePath.includes('-thumb') || filePath.includes('-compressed')) {
      console.log(`Skipping already processed file: ${filePath}`);
      return;
    }

    // Only process files in properties/ directory
    if (!filePath.startsWith('properties/')) {
      console.log(`Skipping file outside properties/: ${filePath}`);
      return;
    }

    try {
      console.log(`Processing image: ${filePath}`);

      // Download original image
      const tempFilePath = `/tmp/${Date.now()}-original`;
      await bucket.file(filePath).download({ destination: tempFilePath });

      // Get original file size
      const [metadata] = await bucket.file(filePath).getMetadata();
      const originalSize = metadata.size;
      console.log(`Original size: ${(originalSize / 1024).toFixed(2)} KB`);

      // Extract file parts
      const pathParts = filePath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
      const fileExt = fileName.substring(fileName.lastIndexOf('.') + 1);
      const directory = pathParts.slice(0, -1).join('/');

      // Generate thumbnail
      const thumbnailPath = `${directory}/${fileNameWithoutExt}-thumb.jpg`;
      const tempThumbnailPath = `/tmp/${Date.now()}-thumb.jpg`;

      await sharp(tempFilePath)
        .resize(200, 200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(tempThumbnailPath);

      // Upload thumbnail
      await bucket.upload(tempThumbnailPath, {
        destination: thumbnailPath,
        metadata: {
          contentType: 'image/jpeg',
        },
      });

      const [thumbMetadata] = await bucket.file(thumbnailPath).getMetadata();
      const thumbSize = thumbMetadata.size;
      console.log(`Thumbnail created: ${thumbnailPath} (${(thumbSize / 1024).toFixed(2)} KB)`);

      // Compress original
      const tempCompressedPath = `/tmp/${Date.now()}-compressed.jpg`;

      await sharp(tempFilePath)
        .jpeg({ quality: 85 })
        .toFile(tempCompressedPath);

      // Overwrite original with compressed version
      await bucket.upload(tempCompressedPath, {
        destination: filePath,
        metadata: {
          contentType: 'image/jpeg',
        },
      });

      const [compressedMetadata] = await bucket.file(filePath).getMetadata();
      const compressedSize = compressedMetadata.size;
      console.log(`Original compressed: ${filePath} (${(compressedSize / 1024).toFixed(2)} KB, ${((1 - compressedSize / originalSize) * 100).toFixed(1)}% reduction)`);

      console.log(`Successfully processed: ${filePath}`);
    } catch (error) {
      // Log error but don't rethrow to prevent infinite retries
      console.error(`Error processing image ${filePath}:`, error);
    }
  }
);
