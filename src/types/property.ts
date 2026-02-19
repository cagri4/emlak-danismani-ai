export type PropertyType = 'daire' | 'villa' | 'arsa' | 'işyeri' | 'müstakil' | 'rezidans'

export type PropertyStatus = 'aktif' | 'opsiyonlu' | 'satıldı' | 'kiralandı'

export type ListingType = 'satılık' | 'kiralık'

export interface PropertyLocation {
  city: string
  district: string
  neighborhood?: string
}

export interface Property {
  id: string
  title: string
  type: PropertyType
  listingType: ListingType
  status: PropertyStatus
  price: number
  location: PropertyLocation
  area: number // m²
  rooms?: string // e.g., "3+1", "2+1", "stüdyo"
  floor?: number
  totalFloors?: number
  buildingAge?: number
  features: string[]
  description?: string
  aiDescription?: string
  imageUrl?: string // Optional - Phase 3 will add uploads
  photos?: string[] // Optional - Phase 3 will add uploads
  createdAt: Date | { toDate: () => Date } // Can be Firestore Timestamp or Date
  updatedAt: Date | { toDate: () => Date }
  userId: string
}

// For form handling (without id and timestamps)
export type PropertyFormData = Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'photos'>
