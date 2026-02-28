import Anthropic from '@anthropic-ai/sdk'
import type { IntentResult } from './structured-schemas'

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

// Turkish system prompt for chat assistant (2000+ tokens for effective caching)
const CHAT_SYSTEM_PROMPT = `Sen bir emlak danışmanı AI asistanısın. Türkçe konuşuyorsun ve emlakçılara mülk yönetimi, müşteri takibi ve eşleştirme konularında yardım ediyorsun.

# Yeteneklerin

1. **Mülk Ekleme**: Kullanıcı doğal dilde mülk bilgisi verdiğinde çıkar
   - Örnek: "3+1 daire Ankara Çankaya 2M TL"
   - Örnek: "Bodrum'da 5 milyon TL villa"
   - Çıkar: tip, oda sayısı, konum, fiyat

2. **Müşteri Ekleme**: Yeni müşteri ekle
   - Örnek: "Mehmet adında müşteri ekle"
   - Örnek: "Ali Yılmaz, 0532 123 4567"
   - Çıkar: isim, telefon, tercihler

3. **Mülk Arama**: Kriterlere göre mülk ara
   - Örnek: "Bodrum'da villa ara"
   - Örnek: "10-20M arası daireler"
   - Örnek: "Çankaya'da 3+1"
   - Çıkar: konum, fiyat aralığı, oda sayısı

4. **Müşteri Arama**: Müşterileri ara ve bul
   - Örnek: "Mehmet adlı müşteriyi bul"
   - Örnek: "5M bütçesi olan müşteriler"

5. **Durum Güncelleme**: Mülk durumunu değiştir
   - Örnek: "Çankaya daireyi satıldı yap"
   - Örnek: "Bu mülkü pasif yap"
   - Çıkar: mülk referansı, yeni durum

6. **Eşleştirme**: Müşteri ve mülk eşleştir
   - Örnek: "Mehmet için mülk bul"
   - Örnek: "Bu daireye uygun müşteriler kim?"

7. **İlan Düzenleme**: Mülk açıklamasını düzenle veya iyileştir
   - Örnek: "İlanı daha çekici yap"
   - Örnek: "Açıklamayı kısa yaz"

8. **Not Ekleme**: Müşteri veya mülke not ekle
   - Örnek: "Mehmet'e not ekle: yarın arayacak"

# Kurallar

1. **Türkçe Yanıt**: Her zaman Türkçe yanıt ver, doğal ve samimi ol
2. **Onay İste**: Veri eklemeden/değiştirmeden önce MUTLAKA onay iste
   - "Bu mülkü ekleyeyim mi?"
   - "Durumu 'satıldı' olarak güncelleyeyim mi?"
3. **Netleştirme Sor**: Belirsiz durumlarda netleştirme sorusu sor
   - "Hangi şehirde arıyorsunuz?"
   - "Fiyat aralığınız nedir?"
4. **Seçim Sun**: Birden fazla eşleşme varsa liste göster, kullanıcıya seçtir
   - "3 Çankaya dairesi buldum: 1) Çayyolu 2) Ümitköy 3) Kızılay"
5. **Doğal Dil**: Eşleşmeleri doğal dilde açıkla, teknik değil sohbet tarzında
   - "Bu villa Mehmet'in aradığı kriterlere uyuyor çünkü..."

# Türkçe Format Özellikleri

**Fiyat Formatı**:
- "2M" veya "2m" = 2,000,000 TL
- "1.5M" = 1,500,000 TL
- "500K" veya "500k" = 500,000 TL
- "2.5 milyon" = 2,500,000 TL

**Oda Formatı**:
- "3+1" = 3 oda + 1 salon
- "2+1" = 2 oda + 1 salon
- "stüdyo" = studio apartment
- "dubleks" = duplex

**Konum**:
- Şehir: İstanbul, Ankara, İzmir, Bodrum, etc.
- İlçe: Çankaya, Beşiktaş, Kadıköy, etc.
- Mahalle: Çayyolu, Ümitköy, etc.
- Turkish characters: ç, ğ, ı, ö, ş, ü

# Örnek Etkileşimler

**Mülk Ekleme**:
Kullanıcı: "3+1 daire Ankara Çankaya 2M TL"
Asistan: "Anladım! Şu bilgileri çıkardım:
- Tip: Daire
- Oda: 3+1
- Konum: Çankaya, Ankara
- Fiyat: 2,000,000 TL

Bu mülkü sisteme ekleyeyim mi?"

**Müşteri Ekleme**:
Kullanıcı: "Mehmet adında müşteri ekle"
Asistan: "Mehmet adlı bir müşteri oluşturayım. Telefon numarasını ve aradığı mülk tipini de belirtirseniz daha iyi eşleştirmeler yapabilirim. Yoksa şimdilik sadece isimle mi ekleyeyim?"

**Arama**:
Kullanıcı: "Bodrum'da villa ara"
Asistan: "Bodrum'da villa arıyorum... Fiyat aralığınız nedir? Böylece daha uygun sonuçlar bulabilirim."

**Durum Güncelleme**:
Kullanıcı: "Çankaya daireyi satıldı yap"
Asistan: "Çankaya'da birden fazla daire var:
1) 3+1 Çayyolu - 2M TL
2) 2+1 Ümitköy - 1.5M TL
3) 4+1 Kızılay - 3M TL

Hangisinin durumunu güncellememi istersiniz? (1, 2, veya 3)"

**Eşleştirme**:
Kullanıcı: "Mehmet için mülk bul"
Asistan: "Mehmet için uygun mülkleri arıyorum... Mehmet'in bütçesi ve tercih ettiği konum nedir? Bu bilgiler varsa daha iyi eşleştirme yapabilirim."

**Netleştirme**:
Kullanıcı: "daire ara"
Asistan: "Daire aramak istediğinizi anladım. Daha iyi sonuçlar için:
- Hangi şehirde arıyorsunuz?
- Fiyat aralığınız nedir?
- Kaç oda istiyorsunuz?"

# Önemli Notlar

- Kullanıcı "evet", "olur", "tamam" dediğinde confirm_action intent'i kullan
- Kullanıcı "hayır", "iptal", "vazgeç" dediğinde cancel_action intent'i kullan
- Belirsiz durumda need_clarification intent'i kullan ve soru sor
- Her zaman yardımsever ve profesyonel ol
- Kısa ve öz yanıtlar ver, gereksiz uzatma
- Türkçe karakter kullanımına dikkat et (ı, ş, ğ, ü, ö, ç)
`

/**
 * Stream a message from Claude with prompt caching
 */
export async function streamMessage(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  onChunk: (text: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const client = getClient()

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: CHAT_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' }, // Cache system prompt for 90% cost savings
        },
      ],
      messages,
    })

    stream.on('text', (text) => {
      onChunk(text)
    })

    stream.on('end', () => {
      onComplete?.()
    })

    stream.on('error', (error) => {
      onError?.(error)
    })

  } catch (error: any) {
    console.error('Error streaming message:', error)
    const errorMessage = createUserFriendlyError(error)
    onError?.(new Error(errorMessage))
  }
}

/**
 * Parse a message with structured output for intent detection
 */
export async function parseWithStructuredOutput(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  schema: any
): Promise<IntentResult> {
  try {
    const client = getClient()

    // Build messages array for context
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory.slice(-10), // Last 10 messages for context
      {
        role: 'user',
        content: `Analyze this user message and extract intent and entities in JSON format:

"${userMessage}"

Return JSON matching this schema. Pay special attention to Turkish language patterns and formats.`
      }
    ]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: CHAT_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: `You must respond with valid JSON matching this schema: ${JSON.stringify(schema, null, 2)}`,
        }
      ],
      messages,
    })

    // Extract text content
    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n')

    // Parse JSON from response
    // Try to extract JSON if it's wrapped in markdown code blocks
    let jsonText = content.trim()
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1]
    }

    const result = JSON.parse(jsonText) as IntentResult
    return result

  } catch (error: any) {
    console.error('Error parsing with structured output:', error)

    // Return need_clarification intent on error
    return {
      intent: 'need_clarification',
      confidence: 'low',
      clarificationNeeded: 'Anlayamadım. Lütfen daha açık ifade eder misiniz?'
    }
  }
}

/**
 * Create user-friendly Turkish error messages
 */
function createUserFriendlyError(error: any): string {
  if (error?.message?.includes('API key')) {
    return 'API anahtarı geçersiz. Lütfen ayarlardan kontrol edin.'
  } else if (error?.message?.includes('rate limit')) {
    return 'İstek limiti aşıldı. Lütfen daha sonra tekrar deneyin.'
  } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return 'İnternet bağlantısı hatası. Lütfen bağlantınızı kontrol edin.'
  } else {
    return error?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'
  }
}

/**
 * Format price in Turkish format
 */
function formatPrice(price: number): string {
  if (!price) return 'Belirtilmemiş'
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1).replace('.0', '')}M TL`
  } else if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K TL`
  }
  return `${price.toLocaleString('tr-TR')} TL`
}

export interface SmartChatResult {
  text: string
  action?: {
    type: 'update_price' | 'update_status' | 'delete_property' | 'delete_customer' | 'add_property'
    id?: string
    value?: any
    title?: string
    needsConfirmation?: boolean
    propertyData?: {
      title: string
      propertyType: string
      listingType: string
      price: number
      area: number
      rooms: string
      city: string
      district: string
      neighborhood?: string
      features?: string[]
    }
  }
}

export interface ChatContext {
  properties: Array<{
    id: string
    title: string
    type: string
    price: number
    location: { city: string; district: string }
    status: string
    rooms?: string
  }>
  customers: Array<{
    id: string
    name: string
    preferences: {
      budget: { min: number; max: number }
      location: string[]
    }
  }>
}

/**
 * Smart chat handler - similar to Telegram bot AI
 * Gives Claude full context and lets it respond naturally
 */
export async function smartChat(
  userMessage: string,
  context: ChatContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<SmartChatResult> {
  try {
    const client = getClient()

    // Build property summary with IDs
    const propertySummary = context.properties.slice(0, 20).map((p, idx) =>
      `${idx + 1}. [ID:${p.id}] ${p.title} - ${p.type}, ${formatPrice(p.price)}, ${p.location.district}/${p.location.city}, durum: ${p.status}`
    ).join('\n')

    // Build customer summary with IDs
    const customerSummary = context.customers.slice(0, 20).map((c, idx) =>
      `${idx + 1}. [ID:${c.id}] ${c.name}: Bütçe ${formatPrice(c.preferences.budget.min)}-${formatPrice(c.preferences.budget.max)}, Lokasyon: ${c.preferences.location.join(', ') || 'Belirtilmemiş'}`
    ).join('\n')

    const smartSystemPrompt = `Sen bir emlak danışmanı asistanısın. Türkçe yardım ediyorsun.

MEVCUT VERİLER:

📊 MÜLKLER (${context.properties.length} adet):
${propertySummary || 'Henüz mülk yok'}

👥 MÜŞTERİLER (${context.customers.length} adet):
${customerSummary || 'Henüz müşteri yok'}

YAPABİLECEKLERİN:
1. Mülk ekleme (doğal dilde: "3+1 daire ekle, Kadıköy, 120m², 5M TL")
2. Mülk arama ve listeleme
3. Müşteri arama ve listeleme
4. Müşteri-mülk eşleştirme önerileri
5. Mülk fiyat güncelleme
6. Durum güncelleme (satıldı, kiralandı, aktif, opsiyonlu)
7. Mülk veya müşteri silme (onay gerektirir)
8. Genel emlak danışmanlığı soruları

KURALLAR:
- Kısa ve öz cevaplar ver
- Emoji kullan ama abartma
- Fiyatları "2.5M TL" formatında yaz
- Türkçe karakterleri doğru kullan
- Bilmediğin şeylerde dürüst ol
- Samimi ve yardımsever ol

KOMUT FORMATLARI (ÇOK ÖNEMLİ):
Cevabının EN SONUNA uygun komutu ekle:

1. Yeni mülk ekleme:
<action>{"type":"add_property","title":"Yalıkavak Villa","propertyType":"villa","listingType":"satılık","price":15000000,"area":250,"rooms":"2+1","city":"Muğla","district":"Bodrum","neighborhood":"Yalıkavak","features":["Deniz Manzarası"]}</action>

propertyType: daire | villa | müstakil | arsa | dükkan | ofis
listingType: satılık | kiralık
Kullanıcının mesajından çıkarabildiğin tüm alanları doldur. Eksik alanlar için makul varsayımlar yap.

2. Fiyat güncellemesi:
<action>{"type":"update_price","id":"MULK_ID","value":25000000}</action>

3. Durum güncellemesi:
<action>{"type":"update_status","id":"MULK_ID","value":"satıldı"}</action>

4. Mülk silme (ONAY İSTEYECEK):
<action>{"type":"delete_property","id":"MULK_ID","title":"Mülk Adı","needsConfirmation":true}</action>

5. Müşteri silme (ONAY İSTEYECEK):
<action>{"type":"delete_customer","id":"MUSTERI_ID","title":"Müşteri Adı","needsConfirmation":true}</action>

DİKKAT:
- "id" alanına yukarıdaki listeden gerçek ID'yi koy (örn: [ID:abc123] ise "abc123" yaz)
- Fiyatı sayı olarak yaz (25M = 25000000)
- Silme işlemlerinde needsConfirmation: true kullan`

    // Build messages with conversation history
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory.slice(-10),
      { role: 'user', content: userMessage }
    ]

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: smartSystemPrompt,
      messages,
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return { text: 'Bir hata oluştu.' }
    }

    let responseText = content.text
    let action: SmartChatResult['action'] = undefined

    // Check for action commands
    const actionMatch = responseText.match(/<action>(.*?)<\/action>/s)
    if (actionMatch) {
      try {
        const actionData = JSON.parse(actionMatch[1])
        if (actionData.type === 'add_property') {
          action = {
            type: 'add_property',
            title: actionData.title,
            propertyData: {
              title: actionData.title || `${actionData.rooms || ''} ${actionData.propertyType || 'Mülk'}`.trim(),
              propertyType: actionData.propertyType || 'daire',
              listingType: actionData.listingType || 'satılık',
              price: actionData.price || 0,
              area: actionData.area || 0,
              rooms: actionData.rooms || '',
              city: actionData.city || '',
              district: actionData.district || '',
              neighborhood: actionData.neighborhood || '',
              features: actionData.features || [],
            }
          }
        } else {
          action = {
            type: actionData.type,
            id: actionData.id,
            value: actionData.value,
            title: actionData.title,
            needsConfirmation: actionData.needsConfirmation
          }
        }
        // Remove the action tag from response
        responseText = responseText.replace(/<action>.*?<\/action>/s, '').trim()
      } catch (e) {
        console.error('Action parse error:', e)
        responseText = responseText.replace(/<action>.*?<\/action>/s, '').trim()
      }
    }

    return { text: responseText, action }

  } catch (error: any) {
    console.error('Smart chat error:', error)
    return { text: createUserFriendlyError(error) }
  }
}
