import { Link } from 'react-router-dom'
import { MapPin, Maximize, BedDouble, Calendar } from 'lucide-react'
import { Property } from '@/types/property'
import StatusBadge from './StatusBadge'
import PropertyPlaceholder from './PropertyPlaceholder'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface PropertyCardProps {
  property: Property
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const hasPhoto = property.photos && property.photos.length > 0

  return (
    <Link to={`/properties/${property.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
        {/* Image Container */}
        <div className="relative h-48 bg-gray-100">
          {hasPhoto ? (
            <img
              src={property.photos![0]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <PropertyPlaceholder type={property.type} className="w-full h-full" />
          )}
          {/* Status Badge in top-right corner */}
          <div className="absolute top-2 right-2">
            <StatusBadge status={property.status} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {property.title}
          </h3>

          {/* Price */}
          <div className="text-2xl font-bold text-blue-600">
            {property.price.toLocaleString('tr-TR')} ₺
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm line-clamp-1">
              {property.location.district}, {property.location.city}
            </span>
          </div>

          {/* Details Grid */}
          <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t">
            <div className="flex items-center gap-1">
              <Maximize className="h-4 w-4" />
              <span>{property.area} m²</span>
            </div>
            {property.rooms && (
              <div className="flex items-center gap-1">
                <BedDouble className="h-4 w-4" />
                <span>{property.rooms}</span>
              </div>
            )}
          </div>

          {/* Date Added */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>
              {property.createdAt
                ? format(
                    property.createdAt instanceof Date
                      ? property.createdAt
                      : property.createdAt.toDate(),
                    'd MMMM yyyy',
                    { locale: tr }
                  )
                : 'Tarih bilinmiyor'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
