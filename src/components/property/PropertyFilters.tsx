import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  TURKISH_CITIES,
  PROPERTY_STATUS_OPTIONS,
  LISTING_TYPE_OPTIONS,
  PRICE_RANGES,
} from '@/lib/constants'
import { PropertyStatus, ListingType } from '@/types/property'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

interface PropertyFiltersProps {
  onFilterChange: (filters: FilterValues) => void
  activeFilters: FilterValues
}

export interface FilterValues {
  status?: PropertyStatus
  listingType?: ListingType
  city?: string
  minPrice?: number
  maxPrice?: number
  priceRange?: string
}

export default function PropertyFilters({
  onFilterChange,
  activeFilters,
}: PropertyFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [localFilters, setLocalFilters] = useState<FilterValues>(activeFilters)

  const handleFilterUpdate = (key: keyof FilterValues, value: any) => {
    const updated = { ...localFilters, [key]: value }
    setLocalFilters(updated)
  }

  const handlePriceRangeChange = (rangeLabel: string) => {
    const range = PRICE_RANGES.find((r) => r.label === rangeLabel)
    if (range) {
      setLocalFilters({
        ...localFilters,
        priceRange: rangeLabel,
        minPrice: range.min,
        maxPrice: range.max || undefined,
      })
    }
  }

  const handleApplyFilters = () => {
    onFilterChange(localFilters)
  }

  const handleClearFilters = () => {
    const cleared: FilterValues = {}
    setLocalFilters(cleared)
    onFilterChange(cleared)
  }

  const activeFilterCount = Object.values(localFilters).filter((v) => v !== undefined).length

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {/* Mobile Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtreler
            {activeFilterCount > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className={`space-y-4 ${!isExpanded && 'hidden lg:block'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status-filter">Durum</Label>
            <Select
              id="status-filter"
              value={localFilters.status || ''}
              onChange={(e) =>
                handleFilterUpdate('status', e.target.value || undefined)
              }
            >
              <option value="">Tüm Durumlar</option>
              {PROPERTY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Listing Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="listing-type-filter">İlan Tipi</Label>
            <Select
              id="listing-type-filter"
              value={localFilters.listingType || ''}
              onChange={(e) =>
                handleFilterUpdate('listingType', e.target.value || undefined)
              }
            >
              <option value="">Tümü</option>
              {LISTING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* City Filter */}
          <div className="space-y-2">
            <Label htmlFor="city-filter">Şehir</Label>
            <Select
              id="city-filter"
              value={localFilters.city || ''}
              onChange={(e) =>
                handleFilterUpdate('city', e.target.value || undefined)
              }
            >
              <option value="">Tüm Şehirler</option>
              {TURKISH_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <Label htmlFor="price-range-filter">Fiyat Aralığı</Label>
            <Select
              id="price-range-filter"
              value={localFilters.priceRange || ''}
              onChange={(e) => handlePriceRangeChange(e.target.value)}
            >
              <option value="">Tüm Fiyatlar</option>
              {PRICE_RANGES.map((range) => (
                <option key={range.label} value={range.label}>
                  {range.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Custom Price Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-price">Min Fiyat</Label>
            <Input
              id="min-price"
              type="number"
              placeholder="0"
              value={localFilters.minPrice || ''}
              onChange={(e) =>
                handleFilterUpdate('minPrice', e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-price">Max Fiyat</Label>
            <Input
              id="max-price"
              type="number"
              placeholder="Sınırsız"
              value={localFilters.maxPrice || ''}
              onChange={(e) =>
                handleFilterUpdate('maxPrice', e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleApplyFilters} className="flex-1">
            Filtrele
          </Button>
          <Button variant="outline" onClick={handleClearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Temizle
          </Button>
        </div>
      </div>
    </div>
  )
}
