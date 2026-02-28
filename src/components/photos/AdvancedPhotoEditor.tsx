import { useState } from 'react';
import { X, CloudSun, Maximize2, Loader2 } from 'lucide-react';
import { enhancePhoto } from '../../services/photoEnhancement';
import { toast } from 'sonner';

interface AdvancedPhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  propertyId: string;
  photoIndex: number;
  onSave: (newUrl: string) => Promise<void>;
}

type ActiveTab = 'enhance' | 'advanced';

/**
 * Advanced photo editor with AI-powered transformations.
 *
 * Features:
 * - Tab interface: Enhance (basic) and Advanced (AI features)
 * - Sky replacement for outdoor photos
 * - Perspective correction for interior photos
 * - Before/after comparison toggle
 * - Loading state with progress indicator
 */
export function AdvancedPhotoEditor({
  isOpen,
  onClose,
  imageUrl,
  propertyId,
  photoIndex,
  onSave,
}: AdvancedPhotoEditorProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('enhance');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [showBefore, setShowBefore] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Enhancement options state
  const [brightness, setBrightness] = useState(1.1);
  const [saturation, setSaturation] = useState(1.1);
  const [sharpen, setSharpen] = useState(true);

  const handleAutoEnhance = async () => {
    setIsProcessing(true);
    setProcessingMessage('Fotoğraf iyileştiriliyor...');

    try {
      const result = await enhancePhoto({
        photoUrl: imageUrl,
        propertyId,
        photoIndex,
        options: {
          brightness,
          saturation,
          sharpen,
        },
      });

      if (result.success && result.enhancedUrl) {
        setEnhancedUrl(result.enhancedUrl);
        toast.success('Fotoğraf iyileştirildi!');
      } else {
        toast.error(result.error || 'İyileştirme başarısız oldu');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleSkyReplace = async () => {
    setIsProcessing(true);
    setProcessingMessage('Gökyüzü değiştiriliyor... (10-30 saniye sürebilir)');

    try {
      const result = await enhancePhoto({
        photoUrl: imageUrl,
        propertyId,
        photoIndex,
        options: {
          skyReplace: true,
        },
      });

      if (result.success && result.enhancedUrl) {
        setEnhancedUrl(result.enhancedUrl);
        toast.success(`Gökyüzü değiştirildi! (${(result.processingTime! / 1000).toFixed(1)}s)`);
      } else {
        toast.error(result.error || 'Gökyüzü değiştirme başarısız oldu');
      }
    } catch (error: any) {
      console.error('Sky replacement error:', error);
      if (error.message?.includes('Cloudinary')) {
        toast.error('Bu özellik henüz aktif değil. Yöneticiye başvurun.');
      } else {
        toast.error('Bir hata oluştu');
      }
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handlePerspectiveCorrect = async () => {
    setIsProcessing(true);
    setProcessingMessage('Perspektif düzeltiliyor... (10-30 saniye sürebilir)');

    try {
      const result = await enhancePhoto({
        photoUrl: imageUrl,
        propertyId,
        photoIndex,
        options: {
          perspectiveCorrect: true,
        },
      });

      if (result.success && result.enhancedUrl) {
        setEnhancedUrl(result.enhancedUrl);
        toast.success(`Perspektif düzeltildi! (${(result.processingTime! / 1000).toFixed(1)}s)`);
      } else {
        toast.error(result.error || 'Perspektif düzeltme başarısız oldu');
      }
    } catch (error: any) {
      console.error('Perspective correction error:', error);
      if (error.message?.includes('Cloudinary')) {
        toast.error('Bu özellik henüz aktif değil. Yöneticiye başvurun.');
      } else {
        toast.error('Bir hata oluştu');
      }
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleSave = async () => {
    if (!enhancedUrl && !isDirty) {
      toast.error('Önce bir işlem uygulayın');
      return;
    }

    const urlToSave = enhancedUrl || imageUrl;

    try {
      await onSave(urlToSave);
      toast.success('Değişiklikler kaydedildi');
      setIsDirty(false);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Kaydetme başarısız oldu');
    }
  };

  if (!isOpen) return null;

  const displayUrl = showBefore ? imageUrl : enhancedUrl || imageUrl;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={isProcessing ? undefined : onClose}
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
              Gelişmiş Düzenleyici
            </h2>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('enhance')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'enhance'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                İyileştirme
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'advanced'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Gelişmiş
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="relative h-[500px] bg-gray-100 overflow-hidden">
            <img
              src={displayUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />

            {/* Loading Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-white animate-spin mb-4" />
                <p className="text-white text-lg font-medium">{processingMessage}</p>
              </div>
            )}

            {/* Before/After Toggle */}
            {enhancedUrl && (
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setShowBefore(!showBefore)}
                  className="px-4 py-2 bg-white rounded-lg shadow-md text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {showBefore ? 'Sonra' : 'Önce'}
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-6 space-y-6">
            {/* Enhance Tab */}
            {activeTab === 'enhance' && (
              <div className="space-y-4">
                {/* Brightness */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parlaklık: {brightness.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.9"
                    max="1.2"
                    step="0.05"
                    value={brightness}
                    onChange={(e) => { setBrightness(parseFloat(e.target.value)); setIsDirty(true); }}
                    className="w-full"
                    disabled={isProcessing}
                  />
                </div>

                {/* Saturation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doygunluk: {saturation.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.9"
                    max="1.2"
                    step="0.05"
                    value={saturation}
                    onChange={(e) => { setSaturation(parseFloat(e.target.value)); setIsDirty(true); }}
                    className="w-full"
                    disabled={isProcessing}
                  />
                </div>

                {/* Sharpen */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sharpen"
                    checked={sharpen}
                    onChange={(e) => { setSharpen(e.target.checked); setIsDirty(true); }}
                    className="h-4 w-4 text-blue-600 rounded"
                    disabled={isProcessing}
                  />
                  <label htmlFor="sharpen" className="ml-2 text-sm text-gray-700">
                    Keskinleştir
                  </label>
                </div>

                {/* Auto Enhance Button */}
                <button
                  onClick={handleAutoEnhance}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Otomatik İyileştir
                </button>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  ⚠️ Bu işlemler 10-30 saniye sürebilir
                </p>

                {/* Sky Replace */}
                <button
                  onClick={handleSkyReplace}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CloudSun className="h-5 w-5" />
                  Gökyüzü Değiştir
                </button>

                {/* Perspective Correct */}
                <button
                  onClick={handlePerspectiveCorrect}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Maximize2 className="h-5 w-5" />
                  Perspektif Düzelt
                </button>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Gökyüzü Değiştir: Gri/bulutlu gökyüzünü mavi gökyüzüyle değiştirir
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Perspektif Düzelt: Eğik çizgileri ve perspektif bozulmalarını düzeltir
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing || (!enhancedUrl && !isDirty)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'İşleniyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
