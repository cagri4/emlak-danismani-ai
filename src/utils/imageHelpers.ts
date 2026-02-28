import { Area } from 'react-easy-crop';

/**
 * Create an HTMLImageElement from a URL or object URL.
 * Used to load images before processing them on canvas.
 * Note: crossOrigin attribute removed — object URLs are same-origin and don't need it.
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

/**
 * Extract cropped image from source using Canvas API.
 *
 * Uses fetch + createObjectURL to bypass Firebase Storage CORS restrictions.
 * The crossOrigin='anonymous' approach causes canvas taint with Firebase Storage
 * because Firebase does not serve CORS headers for that auth pattern — canvas.toBlob()
 * silently returns null. Fetching as a blob and creating an object URL avoids taint
 * because the object URL is treated as same-origin.
 *
 * @param imageSrc - URL of the source image (Firebase Storage URL)
 * @param pixelCrop - Crop area in pixels (from react-easy-crop)
 * @param rotation - Rotation angle in degrees (0-360), defaults to 0
 * @returns Promise<Blob> - Cropped image as JPEG blob with 0.95 quality
 */
export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> => {
  // Fetch image as blob and create same-origin object URL to prevent canvas taint
  const response = await fetch(imageSrc);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const image = await createImage(objectUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // Set canvas size to rotated image size
  canvas.width = safeArea;
  canvas.height = safeArea;

  // Translate canvas context to center
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // Draw rotated image
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // Reset canvas with crop dimensions
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Clear canvas and draw cropped image
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // Convert canvas to blob and revoke object URL to avoid memory leaks
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (croppedBlob) => {
        URL.revokeObjectURL(objectUrl);
        if (croppedBlob) {
          resolve(croppedBlob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      },
      'image/jpeg',
      0.95
    );
  });
};
