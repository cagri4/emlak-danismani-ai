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
