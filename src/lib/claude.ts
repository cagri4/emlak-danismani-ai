import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import { Property } from '@/types/property'

/**
 * Generate property description variants using Cloud Function
 * Cloud Function calls Claude API server-side to avoid CORS issues
 */
export async function generatePropertyDescription(
  property: Property
): Promise<string[]> {
  try {
    const generateFn = httpsCallable<
      {
        title: string
        type: string
        listingType: string
        price: number
        location: {
          city: string
          district: string
          neighborhood?: string
        }
        area: number
        rooms?: string
        floor?: number
        totalFloors?: number
        buildingAge?: number
        features?: string[]
        description?: string
      },
      { variants: string[] }
    >(functions, 'generatePropertyDescriptions')

    const result = await generateFn({
      title: property.title,
      type: property.type,
      listingType: property.listingType,
      price: property.price,
      location: property.location,
      area: property.area,
      rooms: property.rooms,
      floor: property.floor,
      totalFloors: property.totalFloors,
      buildingAge: property.buildingAge,
      features: property.features,
      description: property.description
    })

    return result.data.variants
  } catch (error: any) {
    console.error('Error generating property description:', error)

    // Extract error message from Firebase Functions error
    const message = error?.message || error?.details || 'İlan metni oluşturulurken bir hata oluştu'

    // User-friendly Turkish error messages
    if (message.includes('unauthenticated') || message.includes('API key')) {
      throw new Error('API anahtarı geçersiz. Lütfen ayarlardan kontrol edin.')
    } else if (message.includes('resource-exhausted') || message.includes('rate limit')) {
      throw new Error('İstek limiti aşıldı. Lütfen daha sonra tekrar deneyin.')
    } else if (message.includes('network') || message.includes('fetch')) {
      throw new Error('İnternet bağlantısı hatası. Lütfen bağlantınızı kontrol edin.')
    } else {
      throw new Error(message)
    }
  }
}
