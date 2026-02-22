import { useState, useCallback, useRef } from 'react';
import imageCompression from 'browser-image-compression';

type FacingMode = 'user' | 'environment';

interface UseCameraReturn {
  stream: MediaStream | null;
  isActive: boolean;
  facingMode: FacingMode;
  error: string | null;
  startCamera: (facing?: FacingMode) => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
  capturePhoto: () => Promise<File>;
  isSupported: boolean;
}

/**
 * Hook for accessing device camera and capturing photos.
 *
 * Features:
 * - Camera stream management with getUserMedia
 * - Front/rear camera switching
 * - Photo capture with canvas
 * - Automatic compression (max 500KB, 1920px)
 * - HTTPS requirement detection
 * - Error handling for permissions and device availability
 *
 * Usage:
 * ```tsx
 * const { startCamera, capturePhoto, stopCamera, isSupported } = useCamera();
 *
 * // Start camera
 * await startCamera('environment'); // rear camera
 *
 * // Capture photo
 * const file = await capturePhoto();
 *
 * // Stop camera
 * stopCamera();
 * ```
 */
export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check if getUserMedia is supported
  const isSupported =
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  /**
   * Start camera with specified facing mode.
   */
  const startCamera = useCallback(
    async (facing: FacingMode = 'environment') => {
      setError(null);

      if (!isSupported) {
        setError('Kameranız bu tarayıcıda desteklenmiyor');
        return;
      }

      // Check HTTPS requirement (getUserMedia requires secure context except localhost)
      if (
        window.location.protocol !== 'https:' &&
        !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('127.0.0.1')
      ) {
        setError('Kamera için HTTPS gerekli');
        return;
      }

      try {
        // Stop existing stream before starting new one
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        setStream(newStream);
        setFacingMode(facing);
        setIsActive(true);
      } catch (err) {
        console.error('Camera access error:', err);

        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setError('Kamera izni reddedildi');
          } else if (err.name === 'NotFoundError') {
            setError('Kamera bulunamadı');
          } else if (err.name === 'NotReadableError') {
            setError('Kamera başka bir uygulama tarafından kullanılıyor');
          } else {
            setError('Kamera erişim hatası');
          }
        }

        setIsActive(false);
      }
    },
    [stream, isSupported]
  );

  /**
   * Stop camera and release stream.
   */
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsActive(false);
    setError(null);
  }, [stream]);

  /**
   * Switch between front and rear camera.
   */
  const switchCamera = useCallback(async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    await startCamera(newFacing);
  }, [facingMode, startCamera]);

  /**
   * Capture photo from current camera stream.
   * Returns compressed File object ready for upload.
   */
  const capturePhoto = useCallback(async (): Promise<File> => {
    if (!stream) {
      throw new Error('Camera stream not active');
    }

    try {
      // Create video element to render stream
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
      }

      const video = videoRef.current;
      video.srcObject = stream;

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      // Create canvas at video dimensions
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/jpeg',
          0.85
        );
      });

      // Convert blob to File for compression
      const file = new File([blob], `camera-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      // Compress image
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      // Stop camera after capture
      stopCamera();

      return compressed;
    } catch (err) {
      console.error('Photo capture error:', err);
      throw new Error('Fotoğraf çekme hatası');
    }
  }, [stream, stopCamera]);

  return {
    stream,
    isActive,
    facingMode,
    error,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    isSupported,
  };
}
