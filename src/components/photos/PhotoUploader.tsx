import { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera } from 'lucide-react';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import { useCamera } from '../../hooks/useCamera';
import { CameraCapture } from './CameraCapture';

interface PhotoUploaderProps {
  propertyId: string;
  onUploadComplete?: () => void;
}

/**
 * Photo uploader component with drag-drop, click-to-browse, and camera capture.
 *
 * Features:
 * - Drag-drop zone with visual feedback
 * - Click to browse alternative
 * - Camera capture for mobile devices (with fallback)
 * - Accept only image files (jpeg, jpg, png, webp)
 * - Max 20 files per MULK-05 requirement
 * - Automatic upload on drop/capture using usePhotoUpload hook
 */
export function PhotoUploader({ propertyId, onUploadComplete }: PhotoUploaderProps) {
  const { uploadPhotos } = usePhotoUpload(propertyId);
  const { isSupported } = useCamera();
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      try {
        await uploadPhotos(acceptedFiles);
        onUploadComplete?.();
      } catch (error) {
        console.error('Upload failed:', error);
      }
    },
    [uploadPhotos, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 20,
    multiple: true,
  });

  const handleCameraCapture = async (file: File) => {
    try {
      await uploadPhotos([file]);
      setShowCamera(false);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleCameraButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isSupported) {
      // Show camera modal
      setShowCamera(true);
    } else {
      // Fallback to file input with capture attribute
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      try {
        await uploadPhotos(files);
        onUploadComplete?.();
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  return (
    <>
      {/* Camera capture modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Fallback file input for camera on unsupported devices */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />
      <div className="space-y-4">
        {/* Main upload area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-3">
            <Upload className={`h-10 w-10 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />

            {isDragActive ? (
              <p className="text-blue-600 font-medium">Fotoğrafları buraya bırakın...</p>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-700 font-medium">
                  Fotoğrafları sürükleyin veya tıklayarak seçin
                </p>
                <p className="text-sm text-gray-500">
                  Maksimum 20 fotoğraf (JPEG, PNG, WebP)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Camera button */}
        <button
          onClick={handleCameraButtonClick}
          type="button"
          className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Camera className="h-5 w-5" />
          Fotoğraf Çek
        </button>
      </div>
    </>
  );
}
