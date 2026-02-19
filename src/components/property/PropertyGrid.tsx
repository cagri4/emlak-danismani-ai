import { Property } from '@/types/property'
import PropertyCard from './PropertyCard'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PropertyGridProps {
  properties: Property[]
}

export default function PropertyGrid({ properties }: PropertyGridProps) {
  const navigate = useNavigate()

  if (properties.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-gray-400">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Henüz mülk eklemediniz
          </h3>
          <p className="text-gray-600">
            Portföyünüze ilk mülkünüzü ekleyerek başlayın
          </p>
          <Button onClick={() => navigate('/properties/new')} className="gap-2">
            <PlusCircle className="h-5 w-5" />
            İlk Mülkünüzü Ekleyin
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  )
}
