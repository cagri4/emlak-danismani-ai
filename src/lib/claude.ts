import Anthropic from '@anthropic-ai/sdk'
import { Property } from '@/types/property'

// Initialize Anthropic client
const getClient = () => {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY

  if (!apiKey) {
    throw new Error('VITE_CLAUDE_API_KEY environment variable is not set')
  }

  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
  })
}

// System prompt for property descriptions
const SYSTEM_PROMPT = `Sen profesyonel bir emlak danışmanısın. Mülk özelliklerinden Türkçe ilan metni yazıyorsun.

# Talimatlar
- Ton: Profesyonel, kurumsal dil kullan
- Uzunluk: 100-200 kelime arasında yaz
- Vurgu: Konum avantajları ve mülk özelliklerini dengeli bir şekilde vurgula
- Format: Akıcı paragraflar kullan, abartısız ama çekici yaz
- Hedef: Emlak portallarına uygun ilan metni oluştur

# Önemli
- Müşteri adaylarına hitap et
- Özellikleri sıralamadan akıcı cümlelerle yaz
- Konumu ve çevreyi vurgula
- Mülkün en önemli özelliklerini öne çıkar
- Gereksiz abartılardan kaçın
`

/**
 * Generate property description variants using Claude API
 * Uses prompt caching for cost optimization (90% cost savings on cached tokens)
 */
export async function generatePropertyDescription(
  property: Property
): Promise<string[]> {
  try {
    const client = getClient()

    // Build property context
    const propertyContext = `
Mülk Bilgileri:
- Başlık: ${property.title}
- Tip: ${property.type}
- İlan Tipi: ${property.listingType}
- Fiyat: ${property.price.toLocaleString('tr-TR')} ₺
- Konum: ${property.location.neighborhood ? property.location.neighborhood + ', ' : ''}${property.location.district}, ${property.location.city}
- Alan: ${property.area} m²
${property.rooms ? `- Oda Sayısı: ${property.rooms}` : ''}
${property.floor !== undefined ? `- Kat: ${property.floor}${property.totalFloors ? `/${property.totalFloors}` : ''}` : ''}
${property.buildingAge !== undefined ? `- Bina Yaşı: ${property.buildingAge} yıl` : ''}
${property.features && property.features.length > 0 ? `- Özellikler: ${property.features.join(', ')}` : ''}
${property.description ? `\nMevcut Açıklama:\n${property.description}` : ''}

Lütfen bu mülk için 3 farklı profesyonel ilan metni varyantı oluştur. Her varyantı "---" ayracı ile ayır.
`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }, // Cache system prompt for cost savings
        },
      ],
      messages: [
        {
          role: 'user',
          content: propertyContext,
        },
      ],
    })

    // Extract text content
    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n')

    // Split by separator into variants
    const variants = content
      .split('---')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)

    // Ensure we have at least one variant
    if (variants.length === 0) {
      throw new Error('No variants generated')
    }

    // Return up to 3 variants
    return variants.slice(0, 3)
  } catch (error: any) {
    console.error('Error generating property description:', error)

    // User-friendly Turkish error messages
    if (error?.message?.includes('API key')) {
      throw new Error('API anahtarı geçersiz. Lütfen ayarlardan kontrol edin.')
    } else if (error?.message?.includes('rate limit')) {
      throw new Error('İstek limiti aşıldı. Lütfen daha sonra tekrar deneyin.')
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      throw new Error('İnternet bağlantısı hatası. Lütfen bağlantınızı kontrol edin.')
    } else {
      throw new Error(
        error?.message || 'İlan metni oluşturulurken bir hata oluştu'
      )
    }
  }
}
