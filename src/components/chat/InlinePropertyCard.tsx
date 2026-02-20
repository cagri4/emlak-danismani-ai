import { useEffect, useState } from 'react';
import { MapPin, Home, Maximize2, Share2 } from 'lucide-react';
import { useProperties } from '@/hooks/useProperties';
import type { Property } from '@/types/property';

interface InlinePropertyCardProps {
  propertyId: string;
}

export function InlinePropertyCard({ propertyId }: InlinePropertyCardProps) {
  const { getProperty } = useProperties();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperty() {
      const result = await getProperty(propertyId);
      if (result.success && result.property) {
        setProperty(result.property);
      }
      setLoading(false);
    }

    fetchProperty();
  }, [propertyId, getProperty]);

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-3 animate-pulse">
        <div className="h-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M TL`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K TL`;
    }
    return `${price.toLocaleString('tr-TR')} TL`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 my-2 hover:shadow-md transition-shadow">
      {/* Property Image/Placeholder */}
      <div className="bg-gray-100 rounded-lg h-32 mb-3 flex items-center justify-center">
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.title}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <Home className="h-12 w-12 text-gray-400" />
        )}
      </div>

      {/* Property Info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 line-clamp-1">
          {property.title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">
            {property.location.district}, {property.location.city}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            {property.rooms && (
              <span className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                {property.rooms}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Maximize2 className="h-4 w-4" />
              {property.area} m²
            </span>
          </div>

          <div className="text-lg font-bold text-blue-600">
            {formatPrice(property.price)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => window.open(`/properties/${propertyId}`, '_blank')}
            className="flex-1 py-1.5 px-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            Görüntüle
          </button>
          <button
            onClick={() => {
              // Share functionality - copy link to clipboard
              navigator.clipboard.writeText(`${window.location.origin}/properties/${propertyId}`);
            }}
            className="py-1.5 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
