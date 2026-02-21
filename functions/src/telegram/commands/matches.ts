import { Context } from 'grammy';
import { getFirestore } from 'firebase-admin/firestore';

export async function handleMatches(ctx: Context) {
  try {
    // Get user ID (placeholder for now)
    const userId = ctx.from?.id.toString() || 'unknown';
    const db = getFirestore();

    // Get recent match outcomes
    const matchesRef = db
      .collection('users')
      .doc(userId)
      .collection('match_outcomes')
      .orderBy('timestamp', 'desc')
      .limit(5);

    const snapshot = await matchesRef.get();

    if (snapshot.empty) {
      await ctx.reply(
        '📊 Henuz esleme yok.\n\n' +
        'Musterilerinizi mulklerinizle eslestirdiginde sonuclar burada goruntulenir.'
      );
      return;
    }

    // Format matches
    let message = '📊 Son eslemeler:\n\n';

    snapshot.forEach((doc: any) => {
      const match = doc.data();

      // Format timestamp
      const timestamp = match.timestamp?.toDate?.() || new Date(match.timestamp);
      const dateStr = timestamp.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      // Determine score emoji
      const scoreEmoji = match.score >= 80 ? '🟢' : match.score >= 60 ? '🟡' : '🟠';

      message += `${scoreEmoji} **${match.score}% Eslesme**\n`;
      message += `👤 Musteri: ${match.customerName || 'İsimsiz'}\n`;
      message += `🏘️ Mulk: ${match.propertyTitle || 'Başlıksız'}\n`;
      message += `📅 Tarih: ${dateStr}\n`;

      if (match.outcome) {
        const outcomeEmojis: Record<string, string> = {
          'liked': '❤️',
          'rejected': '❌',
          'pending': '⏳'
        };
        const outcomeEmoji = outcomeEmojis[match.outcome] || '';
        message += `${outcomeEmoji} Sonuc: ${match.outcome}\n`;
      }

      message += '\n';
    });

    await ctx.reply(message);

  } catch (error) {
    console.error('Matches command error:', error);
    await ctx.reply(
      '❌ Eslesmeler getirilirken bir hata olustu. Lutfen tekrar deneyin.'
    );
  }
}
