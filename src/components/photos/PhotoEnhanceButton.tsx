import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { enhancePhoto, isEnhanced, ENHANCEMENT_PRESETS } from '../../services/photoEnhancement';
import { toast } from 'sonner';

interface PhotoEnhanceButtonProps {
  photoUrl: string;
  propertyId: string;
  photoIndex: number;
  onEnhanced: (newUrl: string) => void;
  disabled?: boolean;
}

/**
 * Button component to enhance property photos using AI.
 *
 * Features:
 * - Sparkles icon indicating enhancement capability
 * - Loading spinner during processing
 * - Disabled state for already-enhanced photos
 * - Turkish tooltips and error messages
 * - Automatic detection of enhanced photos via URL pattern
 */
export function PhotoEnhanceButton({
  photoUrl,
  propertyId,
  photoIndex,
  onEnhanced,
  disabled = false,
}: PhotoEnhanceButtonProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const alreadyEnhanced = isEnhanced(photoUrl);

  const handleEnhance = async () => {
    if (alreadyEnhanced || disabled || isEnhancing) {
      return;
    }

    setIsEnhancing(true);

    try {
      const result = await enhancePhoto({
        photoUrl,
        propertyId,
        photoIndex,
        options: ENHANCEMENT_PRESETS.auto,
      });

      if (result.success && result.enhancedUrl) {
        onEnhanced(result.enhancedUrl);
        toast.success('Fotoğraf iyileştirildi');
      } else {
        toast.error(result.error || 'Fotoğraf iyileştirilemedi');
      }
    } catch (error) {
      console.error('Error enhancing photo:', error);
      toast.error('Fotoğraf iyileştirme sırasında hata oluştu');
    } finally {
      setIsEnhancing(false);
    }
  };

  const isDisabled = disabled || alreadyEnhanced || isEnhancing;
  const tooltipText = alreadyEnhanced
    ? 'Fotoğraf zaten iyileştirilmiş'
    : 'Fotoğrafı iyileştir';

  return (
    <button
      onClick={handleEnhance}
      disabled={isDisabled}
      className={`
        p-2 bg-white rounded-full transition-colors
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'}
      `}
      title={tooltipText}
    >
      {isEnhancing ? (
        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 animate-spin" />
      ) : (
        <Sparkles
          className={`h-4 w-4 sm:h-5 sm:w-5 ${alreadyEnhanced ? 'text-blue-600 fill-blue-100' : 'text-gray-600'}`}
        />
      )}
    </button>
  );
}
