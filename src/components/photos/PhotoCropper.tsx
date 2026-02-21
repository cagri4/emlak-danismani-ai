import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';

interface PhotoCropperProps {
  image: string; // URL or dataURL
  aspect?: number; // Default 16/9
  onCropComplete: (croppedAreaPixels: Area, rotation: number) => void;
}

/**
 * Interactive photo cropping component using react-easy-crop.
 *
 * Features:
 * - Drag to position crop area
 * - Zoom slider (1-3x)
 * - Rotation slider (0-360 degrees)
 * - Aspect ratio selector: 16:9, 4:3, 1:1, Free
 * - Mobile-friendly with pinch-to-zoom support
 * - Turkish labels
 */
export function PhotoCropper({
  image,
  aspect = 16 / 9,
  onCropComplete,
}: PhotoCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedAspect, setSelectedAspect] = useState<number | undefined>(aspect);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      onCropComplete(croppedAreaPixels, rotation);
    },
    [onCropComplete, rotation]
  );

  const aspectRatios = [
    { label: '16:9', value: 16 / 9 },
    { label: '4:3', value: 4 / 3 },
    { label: '1:1', value: 1 },
    { label: 'Serbest', value: undefined },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Cropper area */}
      <div className="relative flex-1 bg-gray-900" style={{ minHeight: '400px' }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={selectedAspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={handleCropComplete}
        />
      </div>

      {/* Controls */}
      <div className="bg-white p-6 space-y-4 border-t">
        {/* Aspect ratio selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Oran
          </label>
          <div className="flex gap-2">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio.label}
                onClick={() => setSelectedAspect(ratio.value)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${
                    selectedAspect === ratio.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {ratio.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yakınlaştır: {zoom.toFixed(1)}x
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Rotation slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Döndür: {rotation}°
          </label>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>
    </div>
  );
}
