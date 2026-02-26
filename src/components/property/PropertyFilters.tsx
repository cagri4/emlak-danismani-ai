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
import { Filter, X, ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <SlidersHorizontal className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Filtreler</h3>
              <p className="text-xs text-slate-500">Mülkleri filtreleyin</p>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <span className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
              {activeFilterCount} aktif
            </span>
          )}
        </div>
      </div>

      {/* Mobile Toggle */}
      <div className="lg:hidden p-4 border-b border-slate-100">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {isExpanded ? 'Filtreleri Gizle' : 'Filtreleri Göster'}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className={cn(
        'p-6 space-y-6 transition-all duration-300',
        !isExpanded && 'hidden lg:block'
      )}>
        {/* Main Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
              Durum
            </Label>
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
            <Label htmlFor="listing-type-filter" className="text-sm font-medium text-slate-700">
              İlan Tipi
            </Label>
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
            <Label htmlFor="city-filter" className="text-sm font-medium text-slate-700">
              Şehir
            </Label>
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
            <Label htmlFor="price-range-filter" className="text-sm font-medium text-slate-700">
              Fiyat Aralığı
            </Label>
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
        <div className="pt-4 border-t border-slate-100">
          <Label className="text-sm font-medium text-slate-700 mb-3 block">
            Özel Fiyat Aralığı
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                id="min-price"
                type="number"
                placeholder="Min fiyat"
                value={localFilters.minPrice || ''}
                onChange={(e) =>
                  handleFilterUpdate('minPrice', e.target.value ? Number(e.target.value) : undefined)
                }
                className="pl-8"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₺</span>
            </div>
            <div className="relative">
              <Input
                id="max-price"
                type="number"
                placeholder="Max fiyat"
                value={localFilters.maxPrice || ''}
                onChange={(e) =>
                  handleFilterUpdate('maxPrice', e.target.value ? Number(e.target.value) : undefined)
                }
                className="pl-8"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₺</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <Button onClick={handleApplyFilters} className="flex-1 gap-2 shadow-lg shadow-indigo-500/20">
            <Search className="h-4 w-4" />
            Filtrele
          </Button>
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <X className="h-4 w-4" />
            Temizle
          </Button>
        </div>
      </div>
    </div>
  )
}
