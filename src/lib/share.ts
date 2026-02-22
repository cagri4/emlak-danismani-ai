import { Property } from '@/types/property'

/**
 * Generate shareable URL for a property
 */
export function generateShareUrl(userId: string, propertyId: string): string {
  return `${window.location.origin}/share/${userId}/${propertyId}`
}

/**
 * Format property details into a WhatsApp-friendly message
 */
export function formatShareMessage(property: Property): string {
  const url = generateShareUrl(property.userId, property.id)

  // Turkish number formatting for price (2.000.000 TL)
  const formattedPrice = property.price.toLocaleString('tr-TR')

  // Build message components
  const parts = [
    property.title,
    `${formattedPrice} TL`,
  ]

  // Add details
  const details = []
  if (property.rooms) details.push(property.rooms)
  if (property.area) details.push(`${property.area}m²`)
  details.push(property.location.district)
  details.push(property.location.city)

  parts.push(details.join(', '))

  // Add URL
  parts.push('')
  parts.push(url)

  return parts.join('\n')
}

/**
 * Share property to WhatsApp using Web Share API or fallback to URL scheme
 */
export async function shareToWhatsApp(property: Property): Promise<void> {
  const shareUrl = generateShareUrl(property.userId, property.id)
  const message = formatShareMessage(property)

  try {
    // Try Web Share API first (better mobile UX)
    if (navigator.share) {
      await navigator.share({
        title: property.title,
        text: message,
        url: shareUrl,
      })
    } else {
      // Fallback to WhatsApp URL scheme
      const text = encodeURIComponent(message)
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
    }
  } catch (error) {
    // User cancelled or error occurred
    if (error instanceof Error && error.name !== 'AbortError') {
      throw error
    }
  }
}

/**
 * Copy share link to clipboard
 */
export async function copyShareLink(userId: string, propertyId: string): Promise<void> {
  const url = generateShareUrl(userId, propertyId)

  try {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url)
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()

      try {
        document.execCommand('copy')
      } finally {
        document.body.removeChild(textArea)
      }
    }
  } catch (error) {
    throw new Error('Link kopyalanamadı')
  }
}
