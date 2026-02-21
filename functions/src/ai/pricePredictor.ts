import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import Anthropic from '@anthropic-ai/sdk';

interface PriceSuggestion {
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  reasoning: string;
  marketTrend: 'yukselis' | 'durgun' | 'dusus';
  confidence: 'yuksek' | 'orta' | 'dusuk';
  comparableProperties: Array<{
    title: string;
    price: number;
    similarity: string;
  }>;
}

export const generatePriceSuggestion = onCall(
  { region: 'europe-west1', memory: '512MiB' },
  async (request) => {
    const { propertyId, userId } = request.data;

    if (!propertyId || !userId) {
      throw new HttpsError('invalid-argument', 'propertyId ve userId gerekli');
    }

    const db = getFirestore();

    // Get property details
    const propertyDoc = await db
      .collection('users').doc(userId)
      .collection('properties').doc(propertyId)
      .get();

    if (!propertyDoc.exists) {
      throw new HttpsError('not-found', 'Mulk bulunamadi');
    }

    const property = propertyDoc.data()!;

    // Get market data from notifications (competitor monitoring results)
    const notificationsSnap = await db
      .collection('users').doc(userId)
      .collection('notifications')
      .where('type', '==', 'competitor_listing')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const marketData = notificationsSnap.docs
      .map(doc => doc.data().data)
      .filter(d => d && d.price && d.location);

    // Build prompt for Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `Sen bir Turkiye emlak piyasasi uzmanı danışmanısın. Asagidaki mulk icin piyasa verilerine dayanarak fiyat onerisi yap.

MULK BILGILERI:
- Tip: ${property.type}
- Oda: ${property.rooms || 'Belirtilmemis'}
- Alan: ${property.area}m2
- Konum: ${property.location.district || ''}, ${property.location.city}
- Ozellikler: ${property.features?.join(', ') || 'Yok'}
- Bina Yasi: ${property.buildingAge || 'Belirtilmemis'} yil

PIYASA VERILERI (son 20 rakip ilan):
${marketData.length > 0
  ? marketData.map((m: any) =>
    `- ${m.price?.toLocaleString('tr-TR')} TL, ${m.area}m2, ${m.location?.district || m.location?.city}`
  ).join('\n')
  : 'Piyasa verisi bulunamadi - genel piyasa bilgisine gore degerlendir'}

Lutfen su JSON formatinda yanit ver (SADECE JSON, baska bir sey yazma):
{
  "suggestedPrice": number,
  "priceRange": { "min": number, "max": number },
  "reasoning": "string (Turkce, 2-3 cumle)",
  "marketTrend": "yukselis" | "durgun" | "dusus",
  "confidence": "yuksek" | "orta" | "dusuk",
  "comparableProperties": [
    { "title": "string", "price": number, "similarity": "string" }
  ]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new HttpsError('internal', 'AI yaniti alinamadi');
    }

    try {
      const suggestion: PriceSuggestion = JSON.parse(content.text);
      return suggestion;
    } catch {
      throw new HttpsError('internal', 'AI yaniti parse edilemedi');
    }
  }
);
