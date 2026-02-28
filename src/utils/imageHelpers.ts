import { Area } from 'react-easy-crop';

/**
 * Create an HTMLImageElement from a URL.
 * Sets crossOrigin='anonymous' for remote URLs so the canvas is not tainted.
 * For object URLs (blob:) or data URLs, crossOrigin is not needed.
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    // Set crossOrigin for remote URLs — required for canvas getImageData/toBlob
    // Firebase Storage bucket must have CORS configured (see cors.json)
    if (url.startsWith('http')) {
      image.crossOrigin = 'anonymous';
    }
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

/**
 * Extract cropped image from source using Canvas API.
 *
 * Loads the image with crossOrigin='anonymous' so canvas operations (getImageData,
 * toBlob) work without taint errors. This requires the Firebase Storage bucket to
 * have CORS configured — see cors.json in project root.
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
  const image = await createImage(imageSrc);
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

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (croppedBlob) => {
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
