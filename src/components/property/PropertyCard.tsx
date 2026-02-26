import { Link } from 'react-router-dom'
import { MapPin, Maximize, BedDouble, Calendar, ArrowUpRight } from 'lucide-react'
import { Property } from '@/types/property'
import StatusBadge from './StatusBadge'
import PropertyPlaceholder from './PropertyPlaceholder'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { getThumbnailUrl } from '@/lib/utils'
import { useState } from 'react'

interface PropertyCardProps {
  property: Property
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const hasPhoto = property.photos && property.photos.length > 0
  const [imgError, setImgError] = useState(false)

  // Get the best available image URL
  const getImageUrl = () => {
    if (!hasPhoto) return null
    const photo = property.photos![0]

    // If we already had an error, use original URL
    if (imgError) return photo.url

    // Try public thumbnail URL first
    const publicThumbUrl = getThumbnailUrl(photo.url)
    if (publicThumbUrl) return publicThumbUrl

    // Fall back to stored thumbnailUrl or original
    return photo.thumbnailUrl || photo.url
  }

  return (
    <Link to={`/properties/${property.id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-slate-100 transition-all duration-300 hover:shadow-soft-lg hover:border-indigo-100 hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative h-52 bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
          {hasPhoto ? (
            <img
              src={getImageUrl()!}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgError(true)}
            />
          ) : (
            <PropertyPlaceholder type={property.type} className="w-full h-full" />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Status Badge in top-right corner */}
          <div className="absolute top-3 right-3">
            <StatusBadge status={property.status} />
          </div>

          {/* View Button - appears on hover */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-slate-700 shadow-lg">
              Detaylar
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>

          {/* Photo Count Badge */}
          {property.photos && property.photos.length > 1 && (
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
              +{property.photos.length - 1} foto
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {property.title}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {property.price.toLocaleString('tr-TR')}
            </span>
            <span className="text-lg font-semibold text-slate-400">₺</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-slate-600">
            <div className="p-1.5 rounded-lg bg-slate-100">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <span className="text-sm line-clamp-1">
              {property.location.district}, {property.location.city}
            </span>
          </div>

          {/* Details Grid */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
              <Maximize className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">{property.area} m²</span>
            </div>
            {property.rooms && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
                <BedDouble className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{property.rooms}</span>
              </div>
            )}
          </div>

          {/* Date Added */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
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
