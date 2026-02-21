import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export function initCloudinary(): void {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

interface CloudinaryResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Replace gray/cloudy sky with blue sky using Cloudinary's generative AI.
 *
 * @param imageUrl - URL of the image to process
 * @returns Result with transformed image URL or error message
 */
export async function replaceSky(imageUrl: string): Promise<CloudinaryResult> {
  try {
    // Upload to Cloudinary with generative replace transformation
    const result = await cloudinary.uploader.upload(imageUrl, {
      transformation: [
        {
          effect: 'gen_background_replace',
          prompt: 'blue sky with white clouds, sunny day',
        },
      ],
      resource_type: 'image',
    });

    return { success: true, url: result.secure_url };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Correct perspective distortion and tilted lines using Cloudinary's AI.
 *
 * @param imageUrl - URL of the image to process
 * @returns Result with corrected image URL or error message
 */
export async function correctPerspective(imageUrl: string): Promise<CloudinaryResult> {
  try {
    // Cloudinary's perspective correction via AI
    const result = await cloudinary.uploader.upload(imageUrl, {
      transformation: [
        { effect: 'improve' },
        { effect: 'auto_orientation' },
        // Use Cloudinary's generative AI for perspective
        { effect: 'gen_restore' },
      ],
      resource_type: 'image',
    });

    return { success: true, url: result.secure_url };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Check if Cloudinary is properly configured with all required credentials.
 *
 * @returns True if all Cloudinary environment variables are set
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}
