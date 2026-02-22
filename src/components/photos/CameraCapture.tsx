import { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, Loader2 } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

/**
 * Full-screen camera capture component.
 *
 * Features:
 * - Live camera viewfinder
 * - Front/rear camera switching
 * - Capture button with flash animation
 * - Turkish error messages
 * - Auto-cleanup on unmount
 *
 * Usage:
 * ```tsx
 * const [showCamera, setShowCamera] = useState(false);
 *
 * {showCamera && (
 *   <CameraCapture
 *     onCapture={(file) => {
 *       // Handle captured photo
 *       setShowCamera(false);
 *     }}
 *     onClose={() => setShowCamera(false)}
 *   />
 * )}
 * ```
 */
export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const { stream, isActive, error, startCamera, stopCamera, switchCamera, capturePhoto } =
    useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // Start camera on mount
  useEffect(() => {
    startCamera('environment');

    // Clean up on unmount
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Attach stream to video element when available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleCapture = async () => {
    if (isCapturing) return;

    setIsCapturing(true);

    try {
      // Show flash animation
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 200);

      // Capture photo
      const file = await capturePhoto();

      // Call onCapture callback
      onCapture(file);
    } catch (err) {
      console.error('Capture failed:', err);
      alert('Fotoğraf çekme başarısız oldu');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleSwitch = async () => {
    await switchCamera();
  };

  // Loading state
  if (!isActive && !error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p className="text-lg">Kamera açılıyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="max-w-md mx-4 bg-white rounded-lg p-6 text-center">
          <div className="mb-4">
            <Camera className="h-12 w-12 text-red-500 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Kamera Hatası</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    );
  }

  // Camera viewfinder
  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Video stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Flash animation */}
      {showFlash && (
        <div className="absolute inset-0 bg-white animate-pulse pointer-events-none" />
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pb-8 pt-12">
        <div className="flex items-center justify-center gap-8 px-4">
          {/* Switch camera button */}
          <button
            onClick={handleSwitch}
            disabled={isCapturing}
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors disabled:opacity-50"
            aria-label="Kamera değiştir"
          >
            <RefreshCw className="h-6 w-6" />
          </button>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Fotoğraf çek"
          >
            {isCapturing && <Loader2 className="h-6 w-6 animate-spin text-gray-600" />}
          </button>

          {/* Close button */}
          <button
            onClick={handleClose}
            disabled={isCapturing}
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors disabled:opacity-50"
            aria-label="Kapat"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Hint text */}
        <p className="text-center text-white/80 text-sm mt-4">
          {isCapturing ? 'Fotoğraf çekiliyor...' : 'Çekmek için büyük düğmeye dokunun'}
        </p>
      </div>
    </div>
  );
}
