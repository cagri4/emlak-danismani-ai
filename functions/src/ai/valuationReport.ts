import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import Anthropic from '@anthropic-ai/sdk';

interface ValuationReport {
  propertyId: string;
  generatedAt: Date;
  estimatedValue: number;
  valueRange: { min: number; max: number };
  marketAnalysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  comparativeAnalysis: string;
  marketTrend: string;
  confidence: 'yuksek' | 'orta' | 'dusuk';
}

export const generateValuationReport = onCall(
  { region: 'europe-west1', memory: '512MiB' },
  async (request) => {
    const { propertyId, userId } = request.data;

    if (!propertyId || !userId) {
      throw new HttpsError('invalid-argument', 'propertyId ve userId gerekli');
    }

    const db = getFirestore();
    const propertyDoc = await db
      .collection('users').doc(userId)
      .collection('properties').doc(propertyId)
      .get();

    if (!propertyDoc.exists) {
      throw new HttpsError('not-found', 'Mulk bulunamadi');
    }

    const property = propertyDoc.data()!;

    // Get competitor data
    const notificationsSnap = await db
      .collection('users').doc(userId)
      .collection('notifications')
      .where('type', '==', 'competitor_listing')
      .orderBy('createdAt', 'desc')
      .limit(30)
      .get();

    const marketData = notificationsSnap.docs
      .map(doc => doc.data().data)
      .filter(d => d?.price);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `Sen bir Turkiye emlak degerleme uzmanisin. Asagidaki mulk icin detayli degerleme raporu hazirla.

MULK:
- Baslik: ${property.title}
- Tip: ${property.type}
- Oda: ${property.rooms || 'Belirtilmemis'}
- Alan: ${property.area}m2
- Konum: ${property.location.neighborhood || ''} ${property.location.district || ''}, ${property.location.city}
- Ozellikler: ${property.features?.join(', ') || 'Yok'}
- Kat: ${property.floor || 'Belirtilmemis'}/${property.totalFloors || 'Belirtilmemis'}
- Bina Yasi: ${property.buildingAge || 'Belirtilmemis'} yil
- Mevcut Fiyat: ${property.price?.toLocaleString('tr-TR')} TL

PIYASA VERILERI:
${marketData.slice(0, 15).map((m: any) =>
  `- ${m.title || 'Ilan'}: ${m.price?.toLocaleString('tr-TR')} TL, ${m.area}m2`
).join('\n') || 'Veri yok'}

Su JSON formatinda yanit ver:
{
  "estimatedValue": number,
  "valueRange": { "min": number, "max": number },
  "marketAnalysis": "string (3-4 cumle, piyasa durumu)",
  "strengths": ["string", "string", "string"],
  "weaknesses": ["string", "string"],
  "recommendations": ["string", "string"],
  "comparativeAnalysis": "string (2-3 cumle, benzer mulklerle karsilastirma)",
  "marketTrend": "string (1 cumle, piyasa trendi)",
  "confidence": "yuksek" | "orta" | "dusuk"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new HttpsError('internal', 'AI yaniti alinamadi');
    }

    try {
      const report = JSON.parse(content.text);
      return {
        ...report,
        propertyId,
        generatedAt: new Date()
      } as ValuationReport;
    } catch {
      throw new HttpsError('internal', 'AI yaniti parse edilemedi');
    }
  }
);
