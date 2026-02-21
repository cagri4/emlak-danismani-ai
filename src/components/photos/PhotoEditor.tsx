import { useState, useCallback } from 'react';
import { Area } from 'react-easy-crop';
import { X } from 'lucide-react';
import { PhotoCropper } from './PhotoCropper';
import { getCroppedImg } from '../../utils/imageHelpers';

interface PhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (croppedBlob: Blob) => Promise<void>;
}

/**
 * Modal wrapper for photo cropping.
 *
 * Features:
 * - Modal overlay with dark backdrop
 * - PhotoCropper component inside
 * - Save and Cancel buttons
 * - Loading state during save
 * - Error handling
 */
export function PhotoEditor({
  isOpen,
  onClose,
  imageUrl,
  onSave,
}: PhotoEditorProps) {
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCropComplete = useCallback((croppedArea: Area, rot: number) => {
    setCroppedAreaPixels(croppedArea);
    setRotation(rot);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      setError('Lütfen bir alan seçin');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get cropped image blob
      const croppedBlob = await getCroppedImg(
        imageUrl,
        croppedAreaPixels,
        rotation
      );

      // Call parent save handler
      await onSave(croppedBlob);

      // Close modal on success
      onClose();
    } catch (err) {
      console.error('Crop failed:', err);
      setError('Fotoğraf kırpılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Fotoğrafı Kırp
            </h2>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Cropper */}
          <div className="h-[600px]">
            <PhotoCropper
              image={imageUrl}
              onCropComplete={handleCropComplete}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-t border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !croppedAreaPixels}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
