import { Context, InlineKeyboard } from 'grammy';
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
    const result = await processWithAI(message, properties, customers, linkedUser.id, db);

    // Check if we need to show delete confirmation
    if (result.deleteConfirmation) {
      const keyboard = new InlineKeyboard()
        .text('✅ Evet, Sil', `delete_confirm:${linkedUser.id}:${result.deleteConfirmation.id}:${result.deleteConfirmation.type}`)
        .text('❌ İptal', 'delete_cancel');

      await ctx.reply(result.text, {
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } else {
      await ctx.reply(result.text, { parse_mode: 'HTML' });
    }

  } catch (error) {
    console.error('AI handler error:', error);
    await ctx.reply('Bir hata oluştu. Lütfen tekrar deneyin.');
  }
}

/**
 * Handle delete confirmation callback
 */
export async function handleDeleteCallback(ctx: Context): Promise<void> {
  const callbackData = ctx.callbackQuery?.data;
  if (!callbackData) return;

  try {
    await ctx.answerCallbackQuery();

    if (callbackData === 'delete_cancel') {
      await ctx.editMessageText('❌ Silme işlemi iptal edildi.');
      return;
    }

    if (callbackData.startsWith('delete_confirm:')) {
      const parts = callbackData.split(':');
      const userId = parts[1];
      const itemId = parts[2];
      const itemType = parts[3]; // 'property' or 'customer'

      const db = getFirestore();

      if (itemType === 'property') {
        // Get property title before deleting
        const propDoc = await db.collection('users').doc(userId)
          .collection('properties').doc(itemId).get();
        const propTitle = propDoc.exists ? (propDoc.data() as Property).title : 'Mülk';

        // Delete the property
        await db.collection('users').doc(userId)
          .collection('properties').doc(itemId).delete();

        console.log(`Property ${itemId} deleted by user ${userId}`);
        await ctx.editMessageText(`✅ "${propTitle}" başarıyla silindi.`);
      } else if (itemType === 'customer') {
        // Get customer name before deleting
        const custDoc = await db.collection('users').doc(userId)
          .collection('customers').doc(itemId).get();
        const custName = custDoc.exists ? (custDoc.data() as Customer).name : 'Müşteri';

        // Delete the customer
        await db.collection('users').doc(userId)
          .collection('customers').doc(itemId).delete();

        console.log(`Customer ${itemId} deleted by user ${userId}`);
        await ctx.editMessageText(`✅ "${custName}" başarıyla silindi.`);
      }
    }
  } catch (error) {
    console.error('Delete callback error:', error);
    await ctx.editMessageText('❌ Silme sırasında hata oluştu: ' + (error as Error).message);
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

interface AIResult {
  text: string;
  deleteConfirmation?: {
    id: string;
    type: 'property' | 'customer';
    title: string;
  };
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
): Promise<AIResult> {
  // Create context summary for Claude with IDs for updates
  const propertySummary = properties.slice(0, 20).map((p, idx) =>
    `${idx + 1}. [ID:${p.id}] ${p.title} - ${p.type}, ${formatPrice(p.price)}, ${p.location.district}/${p.location.city}, durum: ${p.status}`
  ).join('\n');

  const customerSummary = customers.slice(0, 20).map((c, idx) =>
    `${idx + 1}. [ID:${c.id}] ${c.name}: Bütçe ${formatPrice(c.preferences.budget.min)}-${formatPrice(c.preferences.budget.max)}, Lokasyon: ${c.preferences.location.join(', ') || 'Belirtilmemiş'}`
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
5. Durum güncelleme (satıldı, kiralandı, aktif, opsiyonlu)
6. Mülk veya müşteri silme (onay gerektirir)
7. Genel emlak danışmanlığı soruları

KURALLAR:
- Kısa ve öz cevaplar ver
- Emoji kullan ama abartma
- Fiyatları "2.5M TL" formatında yaz
- Türkçe karakterleri doğru kullan
- Bilmediğin şeylerde dürüst ol

KOMUT FORMATLARI (ÇOK ÖNEMLİ):
Cevabının EN SONUNA uygun komutu ekle:

1. Fiyat güncellemesi:
<update>{"type":"property_price","id":"MULK_ID","price":25000000}</update>

2. Durum güncellemesi:
<update>{"type":"property_status","id":"MULK_ID","status":"satıldı"}</update>

3. Mülk silme (ONAY İSTEYECEK):
<delete>{"type":"property","id":"MULK_ID","title":"Mülk Adı"}</delete>

4. Müşteri silme (ONAY İSTEYECEK):
<delete>{"type":"customer","id":"MUSTERI_ID","title":"Müşteri Adı"}</delete>

DİKKAT:
- "id" alanına yukarıdaki listeden gerçek ID'yi koy (örn: [ID:abc123] ise "abc123" yaz)
- Fiyatı sayı olarak yaz (25M = 25000000)
- Silme işlemlerinde kullanıcıya "Silmek istediğinize emin misiniz?" gibi bir soru sor`;

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
    return { text: 'Bir hata oluştu.' };
  }

  let responseText = content.text;
  let deleteConfirmation: AIResult['deleteConfirmation'] = undefined;

  // Check for delete commands (needs confirmation)
  const deleteMatch = responseText.match(/<delete>(.*?)<\/delete>/s);
  if (deleteMatch) {
    console.log('Found delete command:', deleteMatch[1]);
    try {
      const deleteData = JSON.parse(deleteMatch[1]);
      console.log('Parsed delete data:', JSON.stringify(deleteData));

      // Remove the delete tag from response
      responseText = responseText.replace(/<delete>.*?<\/delete>/s, '').trim();

      // Set up confirmation
      deleteConfirmation = {
        id: deleteData.id,
        type: deleteData.type,
        title: deleteData.title
      };
    } catch (e) {
      console.error('Delete parse error:', e);
      responseText = responseText.replace(/<delete>.*?<\/delete>/s, '').trim();
    }
  }

  // Check for update commands and execute them immediately
  const updateMatch = responseText.match(/<update>(.*?)<\/update>/s);
  if (updateMatch) {
    console.log('Found update command:', updateMatch[1]);
    try {
      const updateData = JSON.parse(updateMatch[1]);
      console.log('Parsed update data:', JSON.stringify(updateData));
      const updateResult = await executeUpdate(db, userId, updateData);
      // Remove the update tag from response and add confirmation
      responseText = responseText.replace(/<update>.*?<\/update>/s, '').trim();
      if (updateResult) {
        responseText += '\n\n✅ ' + updateResult;
      }
    } catch (e) {
      console.error('Update execution error:', e);
      responseText = responseText.replace(/<update>.*?<\/update>/s, '').trim();
      responseText += '\n\n❌ Güncelleme sırasında hata oluştu: ' + (e as Error).message;
    }
  }

  return { text: responseText, deleteConfirmation };
}

/**
 * Execute database update
 */
async function executeUpdate(
  db: FirebaseFirestore.Firestore,
  userId: string,
  updateData: any
): Promise<string | null> {
  try {
    if (updateData.type === 'property_price' && updateData.id && updateData.price) {
      await db.collection('users').doc(userId)
        .collection('properties').doc(updateData.id)
        .update({ price: updateData.price, updatedAt: new Date() });
      console.log(`Property ${updateData.id} price updated to ${updateData.price}`);
      return `Fiyat ${formatPrice(updateData.price)} olarak güncellendi`;
    }

    if (updateData.type === 'property_status' && updateData.id && updateData.status) {
      await db.collection('users').doc(userId)
        .collection('properties').doc(updateData.id)
        .update({ status: updateData.status, updatedAt: new Date() });
      console.log(`Property ${updateData.id} status updated to ${updateData.status}`);
      return `Durum "${updateData.status}" olarak güncellendi`;
    }

    return null;
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
