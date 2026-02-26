import { Context } from 'grammy';

/**
 * Handle /start command
 * Sends Turkish welcome message and logs chat ID for future notification linking
 */
export async function handleStart(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;

  // Log chat ID for debugging/future user linking
  console.log(`Telegram /start command from chat ID: ${chatId}`);

  // Send Turkish welcome message with Chat ID for linking
  await ctx.reply(
    `🏠 Merhaba! Emlak AI Asistanına hoş geldiniz.

📱 <b>Chat ID'niz:</b> <code>${chatId}</code>

Web uygulamasından (Ayarlar > Telegram Bağlantısı) bu ID'yi girerek hesabınızı bağlayın.

Bağlandıktan sonra yapabilecekleriniz:
• Doğal Türkçe ile soru sorma
• Mülk arama ve listeleme
• Müşteri eşleştirme
• Fiyat ve durum güncelleme
• Anlık bildirim alma

/help yazarak tüm komutları görebilirsiniz.`,
    { parse_mode: 'HTML' }
  );
}
