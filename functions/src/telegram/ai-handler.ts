import { Context } from 'grammy';
import Anthropic from '@anthropic-ai/sdk';
import { getFirestore } from 'firebase-admin/firestore';

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

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  location: {
    city: string;
    district: string;
    neighborhood?: string;
  };
  area: number;
  rooms?: string;
  status: string;
  listingType: string;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  preferences: {
    location: string[];
    budget: { min: number; max: number };
    propertyType: string[];
  };
}

/**
 * AI-powered natural language handler for Telegram bot
 * Understands Turkish natural language and executes appropriate actions
 */
export async function handleNaturalLanguage(ctx: Context): Promise<void> {
  const message = ctx.message?.text?.trim();
  if (!message) {
    await ctx.reply('Mesajınızı anlayamadım. Lütfen tekrar yazın.');
    return;
  }

  const telegramUserId = ctx.from?.id.toString();
  if (!telegramUserId) {
    await ctx.reply('Kullanıcı bilgisi alınamadı.');
    return;
  }

  try {
    // Find linked user account
    const db = getFirestore();
    const linkedUser = await findLinkedUser(db, telegramUserId);

    if (!linkedUser) {
      await ctx.reply(
        '⚠️ Telegram hesabınız uygulamaya bağlı değil.\n\n' +
        'Web uygulamasından Ayarlar > Telegram Bağlantısı bölümünden hesabınızı bağlayabilirsiniz.'
      );
      return;
    }

    // Get user's properties and customers for context
    const [properties, customers] = await Promise.all([
      getUserProperties(db, linkedUser.id),
      getUserCustomers(db, linkedUser.id)
    ]);

    // Use Claude to understand the message and generate response
    const response = await processWithAI(message, properties, customers, linkedUser.id, db);

    await ctx.reply(response, { parse_mode: 'HTML' });

  } catch (error) {
    console.error('AI handler error:', error);
    await ctx.reply('Bir hata oluştu. Lütfen tekrar deneyin.');
  }
}

/**
 * Find user linked to this Telegram account
 */
async function findLinkedUser(db: FirebaseFirestore.Firestore, telegramUserId: string): Promise<{ id: string } | null> {
  // Try to find user with this telegram ID in their profile
  const usersSnapshot = await db.collection('users')
    .where('telegramChatId', '==', telegramUserId)
    .limit(1)
    .get();

  if (!usersSnapshot.empty) {
    return { id: usersSnapshot.docs[0].id };
  }

  // Also try as number (Telegram IDs can be stored as number or string)
  const usersSnapshotNum = await db.collection('users')
    .where('telegramChatId', '==', parseInt(telegramUserId))
    .limit(1)
    .get();

  if (!usersSnapshotNum.empty) {
    return { id: usersSnapshotNum.docs[0].id };
  }

  return null;
}

/**
 * Get user's properties
 */
async function getUserProperties(db: FirebaseFirestore.Firestore, userId: string): Promise<Property[]> {
  const snapshot = await db.collection('users').doc(userId).collection('properties').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Property[];
}

/**
 * Get user's customers
 */
async function getUserCustomers(db: FirebaseFirestore.Firestore, userId: string): Promise<Customer[]> {
  const snapshot = await db.collection('users').doc(userId).collection('customers').get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Customer[];
}

/**
 * Process message with Claude AI and execute actions
 */
async function processWithAI(
  message: string,
  properties: Property[],
  customers: Customer[],
  userId: string,
  db: FirebaseFirestore.Firestore
): Promise<string> {
  // Create context summary for Claude
  const propertySummary = properties.slice(0, 20).map(p =>
    `- ${p.title}: ${p.type}, ${formatPrice(p.price)}, ${p.location.district}/${p.location.city}, ${p.status}`
  ).join('\n');

  const customerSummary = customers.slice(0, 20).map(c =>
    `- ${c.name}: Bütçe ${formatPrice(c.preferences.budget.min)}-${formatPrice(c.preferences.budget.max)}, Lokasyon: ${c.preferences.location.join(', ') || 'Belirtilmemiş'}`
  ).join('\n');

  const systemPrompt = `Sen bir emlak danışmanı asistanısın. Telegram üzerinden Türkçe yardım ediyorsun.

MEVCUT VERİLER:

📊 MÜLKLER (${properties.length} adet):
${propertySummary || 'Henüz mülk yok'}

👥 MÜŞTERİLER (${customers.length} adet):
${customerSummary || 'Henüz müşteri yok'}

YAPABİLECEKLERİN:
1. Mülk arama ve listeleme
2. Müşteri arama ve listeleme
3. Müşteri-mülk eşleştirme önerileri
4. Mülk fiyat güncelleme
5. Durum güncelleme (satıldı, kiralandı, vb.)
6. Genel emlak danışmanlığı soruları

KURALLAR:
- Kısa ve öz cevaplar ver
- Emoji kullan ama abartma
- Fiyatları "2.5M TL" formatında yaz
- Türkçe karakterleri doğru kullan
- Bilmediğin şeylerde dürüst ol
- Gerçek veri yoksa "kayıt bulunamadı" de

ÖNEMLİ: Eğer kullanıcı bir güncelleme istiyorsa (fiyat değiştir, durum güncelle), hangi mülk/müşteri olduğunu netleştir ve güncellemeyi yapacağını söyle. Sonra JSON formatında güncelleme komutunu döndür:
<update>{"type": "property_price", "id": "MULK_ID", "price": YENI_FIYAT}</update>
<update>{"type": "property_status", "id": "MULK_ID", "status": "satıldı|kiralandı|aktif|opsiyonlu"}</update>

Eğer eşleştirme istenirse, mevcut müşteri tercihlerine göre uygun mülkleri listele.`;

  const response = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: message
    }]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    return 'Bir hata oluştu.';
  }

  let responseText = content.text;

  // Check for update commands and execute them
  const updateMatch = responseText.match(/<update>(.*?)<\/update>/s);
  if (updateMatch) {
    try {
      const updateData = JSON.parse(updateMatch[1]);
      await executeUpdate(db, userId, updateData);
      // Remove the update tag from response
      responseText = responseText.replace(/<update>.*?<\/update>/s, '').trim();
    } catch (e) {
      console.error('Update execution error:', e);
    }
  }

  return responseText;
}

/**
 * Execute database update
 */
async function executeUpdate(
  db: FirebaseFirestore.Firestore,
  userId: string,
  updateData: any
): Promise<void> {
  try {
    if (updateData.type === 'property_price' && updateData.id && updateData.price) {
      await db.collection('users').doc(userId)
        .collection('properties').doc(updateData.id)
        .update({ price: updateData.price, updatedAt: new Date() });
      console.log(`Property ${updateData.id} price updated to ${updateData.price}`);
    }

    if (updateData.type === 'property_status' && updateData.id && updateData.status) {
      await db.collection('users').doc(userId)
        .collection('properties').doc(updateData.id)
        .update({ status: updateData.status, updatedAt: new Date() });
      console.log(`Property ${updateData.id} status updated to ${updateData.status}`);
    }
  } catch (error) {
    console.error('Failed to execute update:', error);
    throw error;
  }
}

/**
 * Format price in Turkish format
 */
function formatPrice(price: number): string {
  if (!price) return 'Belirtilmemiş';
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1).replace('.0', '')}M TL`;
  } else if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K TL`;
  }
  return `${price.toLocaleString('tr-TR')} TL`;
}
