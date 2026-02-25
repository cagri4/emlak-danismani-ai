import { Context } from 'grammy';
import Anthropic from '@anthropic-ai/sdk';
import { getFirestore, Query, DocumentData } from 'firebase-admin/firestore';

// Lazy initialization - create client inside handler when secrets are available
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

interface SearchFilters {
  location: {
    city: string | null;
    district: string | null;
  };
  propertyType: 'daire' | 'villa' | 'arsa' | 'işyeri' | null;
  rooms: string | null;
  maxPrice: number | null;
  minPrice: number | null;
}

export async function handleSearch(ctx: Context) {
  try {
    // Extract search text from message
    const searchText = ctx.message?.text?.replace('/ara', '').trim() || '';

    if (!searchText) {
      await ctx.reply(
        "📝 Kullanim: /ara Cankaya'da 3+1 daire 5M'ye kadar\n\n" +
        "Örnekler:\n" +
        "• /ara Ankara'da 2+1 daire\n" +
        "• /ara Cankaya'da 4 milyon TL'ye kadar villa\n" +
        "• /ara 3+1 150m2 5M-8M arasi"
      );
      return;
    }

    // Use Claude AI to parse the Turkish query
    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Parse this Turkish property search query into JSON filters:
"${searchText}"

Return ONLY valid JSON (no markdown, no explanations):
{
  "location": { "city": "string or null", "district": "string or null" },
  "propertyType": "daire" | "villa" | "arsa" | "işyeri" | null,
  "rooms": "string or null",
  "maxPrice": number | null,
  "minPrice": number | null
}

Notes:
- Normalize Turkish characters (Çankaya, İstanbul)
- Convert "5M" -> 5000000, "3M" -> 3000000
- Keep rooms format like "3+1", "2+1", "stüdyo"
- If no city specified but district given, infer city (e.g., Çankaya -> Ankara)
- If only max mentioned (e.g., "5M'ye kadar"), set maxPrice only
- If range (e.g., "3M-5M"), set both minPrice and maxPrice`
      }]
    });

    // Extract JSON from Claude's response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const filters: SearchFilters = JSON.parse(content.text.trim());

    // Query Firestore for properties
    // For now, use placeholder userId - will be replaced with real user linking
    const userId = ctx.from?.id.toString() || 'unknown';
    const db = getFirestore();

    // Start with base query
    let firestoreQuery: Query<DocumentData> = db.collection('users').doc(userId).collection('properties');

    // Apply filters
    if (filters.propertyType) {
      firestoreQuery = firestoreQuery.where('type', '==', filters.propertyType);
    }

    if (filters.location.city) {
      firestoreQuery = firestoreQuery.where('location.city', '==', filters.location.city);
    }

    if (filters.location.district) {
      firestoreQuery = firestoreQuery.where('location.district', '==', filters.location.district);
    }

    // Execute query
    const snapshot = await firestoreQuery.get();

    if (snapshot.empty) {
      // Check if user exists
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        await ctx.reply(
          '⚠️ Hesabiniz henuz baglanmadi.\n\n' +
          'Web uygulamasindan Telegram\'i baglayabilirsiniz.'
        );
        return;
      }

      await ctx.reply('🔍 Aramaniza uygun mulk bulunamadi.');
      return;
    }

    // Filter by price range and rooms client-side
    let properties = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    if (filters.minPrice !== null) {
      properties = properties.filter((p: any) => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== null) {
      properties = properties.filter((p: any) => p.price <= filters.maxPrice!);
    }

    if (filters.rooms !== null) {
      properties = properties.filter((p: any) => p.rooms === filters.rooms);
    }

    // Limit to 5 results
    properties = properties.slice(0, 5);

    if (properties.length === 0) {
      await ctx.reply('🔍 Aramaniza uygun mulk bulunamadi.');
      return;
    }

    // Format results
    const typeEmojis: Record<string, string> = {
      daire: '🏢',
      villa: '🏡',
      arsa: '📐',
      işyeri: '🏪',
      müstakil: '🏠',
      rezidans: '🏙️'
    };

    let message = `🔍 ${properties.length} mulk bulundu:\n\n`;

    for (const property of properties) {
      const emoji = typeEmojis[property.type as string] || '🏘️';
      message += `${emoji} ${property.title}\n`;
      message += `💰 ${property.price.toLocaleString('tr-TR')} TL\n`;
      message += `📏 ${property.area}m² ${property.rooms ? `- ${property.rooms}` : ''}\n`;
      message += `📍 ${property.location.district}, ${property.location.city}\n`;
      message += `\n`;
    }

    const totalResults = snapshot.size;
    if (totalResults > 5) {
      message += `... ve ${totalResults - 5} mulk daha`;
    }

    await ctx.reply(message);

  } catch (error) {
    console.error('Search command error:', error);
    await ctx.reply(
      '❌ Arama sirasinda bir hata olustu. Lutfen tekrar deneyin.'
    );
  }
}
