import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useProperties } from '@/hooks/useProperties'
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PropertyGrid from '@/components/property/PropertyGrid'
import PropertyFilters, { FilterValues } from '@/components/property/PropertyFilters'
import { Plus } from 'lucide-react'
import { PropertyStatus, ListingType } from '@/types/property'

export default function Properties() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Parse filters from URL
  const [filters, setFilters] = useState<FilterValues>(() => {
    return {
      status: (searchParams.get('status') as PropertyStatus) || undefined,
      listingType: (searchParams.get('listingType') as ListingType) || undefined,
      city: searchParams.get('city') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    }
  })

  const { properties, loading, error } = useProperties({ filters })

  // Update URL params when filters change
  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters)

    const params = new URLSearchParams()
    if (newFilters.status) params.set('status', newFilters.status)
    if (newFilters.listingType) params.set('listingType', newFilters.listingType)
    if (newFilters.city) params.set('city', newFilters.city)
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice.toString())
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice.toString())

    setSearchParams(params)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Mülkler yükleniyor...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mülkler</h1>
            <p className="text-slate-500 mt-1">
              Portföyünüzdeki <span className="font-semibold text-indigo-600">{properties.length}</span> mülkü yönetin
            </p>
          </div>
          <Button onClick={() => navigate('/properties/new')} className="gap-2 shadow-lg shadow-indigo-500/20">
            <Plus className="h-4 w-4" />
            Yeni Mülk Ekle
          </Button>
        </div>

        <PropertyFilters onFilterChange={handleFilterChange} activeFilters={filters} />

        <PropertyGrid properties={properties} />
      </div>
    </DashboardLayout>
  )
}
