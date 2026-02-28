import * as functions from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { REGION } from '../config';
import { initCloudinary, replaceSky, correctPerspective, isCloudinaryConfigured } from '../services/cloudinaryService';

interface EnhanceRequest {
  photoUrl: string;
  propertyId: string;
  photoIndex: number;
  userId: string;
  options?: {
    brightness?: number;  // 0.9-1.2, default 1.1
    saturation?: number;  // 0.9-1.2, default 1.1
    sharpen?: boolean;    // default true
    clahe?: boolean;      // adaptive histogram equalization for dark photos
    // New advanced options
    skyReplace?: boolean;    // Requires Cloudinary
    perspectiveCorrect?: boolean;  // Requires Cloudinary
  };
}

interface EnhanceResponse {
  success: boolean;
  enhancedUrl?: string;
  error?: string;
  processingTime?: number;
  cloudinaryUsed?: boolean;
}

/**
 * Cloud Function to enhance property photos using Sharp.
 *
 * Features:
 * - Auto-contrast with normalise()
 * - Brightness and saturation boost
 * - Mild sharpening
 * - Optional CLAHE for dark photos
 * - EXIF auto-rotation
 *
 * Per KVKK compliance: All processing in europe-west1 region
 */
export const enhancePropertyPhoto = functions.onCall<EnhanceRequest, Promise<EnhanceResponse>>(
  {
    region: REGION,
    memory: '1GiB',
    timeoutSeconds: 120,
    cpu: 2,
  },
  async (request) => {
    const { photoUrl, propertyId, photoIndex, options } = request.data;

    // Validate authentication
    if (!request.auth) {
      throw new functions.HttpsError('unauthenticated', 'Kullanıcı girişi gerekli');
    }

    const userId = request.auth.uid;

    // Validate required fields
    if (!photoUrl || !propertyId) {
      throw new functions.HttpsError('invalid-argument', 'photoUrl ve propertyId gerekli');
    }

    // Check if photo is already enhanced
    if (photoUrl.includes('_enhanced')) {
      return {
        success: false,
        error: 'Fotoğraf zaten iyileştirilmiş',
      };
    }

    // Default options
    const brightness = options?.brightness ?? 1.1;
    const saturation = options?.saturation ?? 1.1;
    const sharpen = options?.sharpen ?? true;
    const clahe = options?.clahe ?? false;

    // Validate option ranges
    if (brightness < 0.9 || brightness > 1.2) {
      throw new functions.HttpsError('invalid-argument', 'brightness 0.9-1.2 arasında olmalı');
    }
    if (saturation < 0.9 || saturation > 1.2) {
      throw new functions.HttpsError('invalid-argument', 'saturation 0.9-1.2 arasında olmalı');
    }

    const bucket = admin.storage().bucket();
    let tempFilePath: string | null = null;
    let tempEnhancedPath: string | null = null;

    try {
      const startTime = Date.now();
      let cloudinaryUsed = false;
      console.log(`Enhancing photo: ${photoUrl}`);

      // Extract Storage path from URL
      const urlParts = photoUrl.split('/o/')[1];
      if (!urlParts) {
        throw new functions.HttpsError('invalid-argument', 'Geçersiz fotoğraf URL formatı');
      }
      const storagePath = decodeURIComponent(urlParts.split('?')[0]);

      // Handle Cloudinary advanced features if requested
      let imageUrl = photoUrl;
      if (options?.skyReplace || options?.perspectiveCorrect) {
        if (!isCloudinaryConfigured()) {
          throw new functions.HttpsError(
            'failed-precondition',
            'Cloudinary yapılandırılmamış. Gelişmiş özellikleri etkinleştirmek için yöneticiye başvurun.'
          );
        }

        initCloudinary();
        cloudinaryUsed = true;

        if (options.skyReplace) {
          console.log('Applying sky replacement...');
          const skyResult = await replaceSky(imageUrl);
          if (!skyResult.success) {
            throw new functions.HttpsError('internal', skyResult.error || 'Gökyüzü değiştirme başarısız oldu');
          }
          imageUrl = skyResult.url!;
        }

        if (options.perspectiveCorrect) {
          console.log('Applying perspective correction...');
          const perspectiveResult = await correctPerspective(imageUrl);
          if (!perspectiveResult.success) {
            throw new functions.HttpsError('internal', perspectiveResult.error || 'Perspektif düzeltme başarısız oldu');
          }
          imageUrl = perspectiveResult.url!;
        }
      }

      // Download image to temp file (either original or Cloudinary-processed)
      tempFilePath = path.join(os.tmpdir(), `original-${Date.now()}.jpg`);

      if (cloudinaryUsed) {
        // Download from Cloudinary URL
        const https = await import('https');
        const file = fs.createWriteStream(tempFilePath);
        await new Promise<void>((resolve, reject) => {
          https.get(imageUrl, (response) => {
            response.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          }).on('error', (err) => {
            fs.unlink(tempFilePath!, () => reject(err));
          });
        });
      } else {
        // Download from Firebase Storage
        await bucket.file(storagePath).download({ destination: tempFilePath });
      }

      console.log(`Downloaded to: ${tempFilePath}`);

      // Build Sharp pipeline
      let pipeline = sharp(tempFilePath)
        .rotate() // Auto-rotate based on EXIF (MUST be first)
        .normalise(); // Stretch luminance (auto-contrast)

      // Apply brightness and saturation modulation
      if (brightness !== 1.0 || saturation !== 1.0) {
        pipeline = pipeline.modulate({
          brightness,
          saturation,
        });
      }

      // Apply CLAHE for dark photos (adaptive histogram equalization)
      if (clahe) {
        pipeline = pipeline.clahe({
          width: 8,
          height: 8,
          maxSlope: 3,
        });
      }

      // Apply sharpening
      if (sharpen) {
        pipeline = pipeline.sharpen({
          sigma: 1.0,
        });
      }

      // Output as high-quality JPEG
      tempEnhancedPath = path.join(os.tmpdir(), `enhanced-${Date.now()}.jpg`);
      await pipeline
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toFile(tempEnhancedPath);

      console.log(`Enhanced photo saved to: ${tempEnhancedPath}`);

      // Generate enhanced file path
      const storageDir = path.dirname(storagePath);
      const fileName = path.basename(storagePath, path.extname(storagePath));
      const enhancedStoragePath = `${storageDir}/${fileName}_enhanced.jpg`;

      // Upload enhanced photo to Storage
      await bucket.upload(tempEnhancedPath, {
        destination: enhancedStoragePath,
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            userId,
            propertyId,
            photoIndex: photoIndex.toString(),
            enhancedAt: new Date().toISOString(),
            enhancementOptions: JSON.stringify(options || {}),
          },
        },
      });

      console.log(`Uploaded enhanced photo to: ${enhancedStoragePath}`);

      // Make file public and construct download URL
      await bucket.file(enhancedStoragePath).makePublic();
      const bucketName = bucket.name;
      const enhancedUrl = `https://storage.googleapis.com/${bucketName}/${enhancedStoragePath}`;

      console.log(`Enhancement complete: ${enhancedUrl}`);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        enhancedUrl,
        processingTime,
        cloudinaryUsed,
      };
    } catch (error) {
      console.error('Error enhancing photo:', error);

      // Return user-friendly error message
      if (error instanceof functions.HttpsError) {
        throw error;
      }

      throw new functions.HttpsError(
        'internal',
        'Fotoğraf iyileştirme sırasında hata oluştu'
      );
    } finally {
      // Clean up temp files
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      if (tempEnhancedPath && fs.existsSync(tempEnhancedPath)) {
        fs.unlinkSync(tempEnhancedPath);
      }
    }
  }
);
