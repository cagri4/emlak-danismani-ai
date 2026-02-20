import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';

interface PhotoUploaderProps {
  propertyId: string;
  onUploadComplete?: () => void;
}

/**
 * Photo uploader component with drag-drop and click-to-browse.
 *
 * Features:
 * - Drag-drop zone with visual feedback
 * - Click to browse alternative
 * - Accept only image files (jpeg, jpg, png, webp)
 * - Max 20 files per MULK-05 requirement
 * - Automatic upload on drop using usePhotoUpload hook
 */
export function PhotoUploader({ propertyId, onUploadComplete }: PhotoUploaderProps) {
  const { uploadPhotos } = usePhotoUpload(propertyId);

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

  return (
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
  );
}
