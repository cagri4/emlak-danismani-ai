import { onCall, HttpsError } from 'firebase-functions/v2/https';
import Anthropic from '@anthropic-ai/sdk';

interface PropertyData {
  title: string;
  type: string;
  listingType: string;
  price: number;
  location: {
    city: string;
    district: string;
    neighborhood?: string;
  };
  area: number;
  rooms?: string;
  floor?: number;
  totalFloors?: number;
  buildingAge?: number;
  features?: string[];
  description?: string;
}

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
`;

/**
 * Cloud Function to generate property descriptions using Claude API
 * Bypasses CORS issues by running on server-side
 */
export const generatePropertyDescriptions = onCall(
  {
    region: 'europe-west1',
    memory: '512MiB',
    timeoutSeconds: 60,
    secrets: ['ANTHROPIC_API_KEY']
  },
  async (request) => {
    const property = request.data as PropertyData;

    if (!property || !property.title || !property.type) {
      throw new HttpsError('invalid-argument', 'Mülk bilgileri eksik');
    }

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
`;

    try {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: propertyContext
          }
        ]
      });

      // Extract text content
      const content = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as { type: 'text'; text: string }).text)
        .join('\n');

      // Split by separator into variants
      const variants = content
        .split('---')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      // Ensure we have at least one variant
      if (variants.length === 0) {
        throw new HttpsError('internal', 'AI varyant oluşturamadı');
      }

      // Return up to 3 variants
      return { variants: variants.slice(0, 3) };
    } catch (error: any) {
      console.error('Error generating property description:', error);

      if (error?.status === 401) {
        throw new HttpsError('unauthenticated', 'API anahtarı geçersiz');
      } else if (error?.status === 429) {
        throw new HttpsError('resource-exhausted', 'İstek limiti aşıldı. Lütfen daha sonra tekrar deneyin.');
      } else if (error instanceof HttpsError) {
        throw error;
      } else {
        throw new HttpsError('internal', error?.message || 'İlan metni oluşturulurken bir hata oluştu');
      }
    }
  }
);
