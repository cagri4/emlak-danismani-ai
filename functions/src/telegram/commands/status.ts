import { Context } from 'grammy';
import { getFirestore } from 'firebase-admin/firestore';
import fuzzball from 'fuzzball';

// Valid property statuses
type PropertyStatus = 'aktif' | 'opsiyonlu' | 'satıldı' | 'kiralandı';

const VALID_STATUSES: PropertyStatus[] = ['aktif', 'opsiyonlu', 'satıldı', 'kiralandı'];

// Map Turkish status variations to normalized forms
const STATUS_VARIATIONS: Record<string, PropertyStatus> = {
  'aktif': 'aktif',
  'active': 'aktif',
  'opsiyonlu': 'opsiyonlu',
  'opsiyon': 'opsiyonlu',
  'option': 'opsiyonlu',
  'satıldı': 'satıldı',
  'satildi': 'satıldı',
  'satıldi': 'satıldı',
  'sold': 'satıldı',
  'kiralandı': 'kiralandı',
  'kiralandi': 'kiralandı',
  'rented': 'kiralandı',
};

export async function handleStatus(ctx: Context) {
  try {
    // Parse command arguments
    const text = ctx.message?.text?.replace('/durum', '').trim() || '';

    if (!text) {
      await ctx.reply(
        '📝 Kullanim: /durum [mulk_adi_veya_id] [yeni_durum]\n\n' +
        'Gecerli durumlar: aktif, opsiyonlu, satildi, kiralandi\n\n' +
        'Örnekler:\n' +
        '• /durum 123 satildi\n' +
        '• /durum Cankaya Villa satildi\n' +
        '• /durum Bahcelievler Daire opsiyonlu'
      );
      return;
    }

    // Split into property identifier and status
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      await ctx.reply(
        '❌ Eksik parametre. Hem mulk adi/id hem de yeni durum gerekli.\n\n' +
        'Kullanim: /durum [mulk_adi_veya_id] [yeni_durum]'
      );
      return;
    }

    const statusText = parts[parts.length - 1].toLowerCase();
    const propertyIdentifier = parts.slice(0, -1).join(' ');

    // Normalize status
    const normalizedStatus = STATUS_VARIATIONS[statusText];

    if (!normalizedStatus) {
      await ctx.reply(
        '❌ Gecersiz durum.\n\n' +
        'Gecerli durumlar: aktif, opsiyonlu, satildi, kiralandi'
      );
      return;
    }

    // Get user ID (placeholder for now)
    const userId = ctx.from?.id.toString() || 'unknown';
    const db = getFirestore();

    // Try to find property by ID or title
    const propertiesRef = db.collection('users').doc(userId).collection('properties');

    let propertyDoc: any = null;
    let propertyId: string | null = null;

    // First, try to get by ID if identifier is numeric
    if (/^\d+$/.test(propertyIdentifier)) {
      const doc = await propertiesRef.doc(propertyIdentifier).get();
      if (doc.exists) {
        propertyDoc = doc;
        propertyId = doc.id;
      }
    }

    // If not found by ID, search by title
    if (!propertyDoc) {
      const snapshot = await propertiesRef.get();

      if (snapshot.empty) {
        await ctx.reply('⚠️ Hesabiniza bagli mulk bulunamadi.');
        return;
      }

      // Find matching properties using fuzzy search
      const matches: Array<{ id: string; title: string; score: number }> = [];

      snapshot.forEach((doc: any) => {
        const data = doc.data();
        const score = fuzzball.ratio(
          propertyIdentifier.toLowerCase(),
          data.title.toLowerCase()
        );

        if (score > 60) { // 60% similarity threshold
          matches.push({
            id: doc.id,
            title: data.title,
            score: score
          });
        }
      });

      if (matches.length === 0) {
        await ctx.reply('❌ Mulk bulunamadi. Lutfen mulk adini veya ID\'sini kontrol edin.');
        return;
      }

      if (matches.length > 1) {
        // Sort by score descending
        matches.sort((a, b) => b.score - a.score);

        // If top match is significantly better (10+ points difference), use it
        if (matches[0].score - matches[1].score >= 10) {
          propertyDoc = await propertiesRef.doc(matches[0].id).get();
          propertyId = matches[0].id;
        } else {
          // Ambiguous - list options
          let message = '🔍 Birden fazla eslesme bulundu. Lutfen ID ile belirtin:\n\n';
          matches.slice(0, 5).forEach(match => {
            message += `• ID: ${match.id} - ${match.title}\n`;
          });
          message += '\nÖrnek: /durum ' + matches[0].id + ' ' + statusText;

          await ctx.reply(message);
          return;
        }
      } else {
        // Single match found
        propertyDoc = await propertiesRef.doc(matches[0].id).get();
        propertyId = matches[0].id;
      }
    }

    if (!propertyDoc || !propertyId) {
      await ctx.reply('❌ Mulk bulunamadi.');
      return;
    }

    // Update property status
    await propertiesRef.doc(propertyId).update({
      status: normalizedStatus,
      updatedAt: new Date(),
    });

    const propertyData = propertyDoc.data();
    const statusEmojis: Record<PropertyStatus, string> = {
      'aktif': '✅',
      'opsiyonlu': '⏳',
      'satıldı': '🎉',
      'kiralandı': '🤝'
    };

    const emoji = statusEmojis[normalizedStatus];

    await ctx.reply(
      `${emoji} Guncellendi!\n\n` +
      `Mulk: ${propertyData.title}\n` +
      `Yeni durum: ${normalizedStatus}`
    );

  } catch (error) {
    console.error('Status update error:', error);
    await ctx.reply(
      '❌ Durum guncellenirken bir hata olustu. Lutfen tekrar deneyin.'
    );
  }
}
