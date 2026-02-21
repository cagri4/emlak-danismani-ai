import { Context } from 'grammy';

/**
 * Handle /start command
 * Sends Turkish welcome message and logs chat ID for future notification linking
 */
export async function handleStart(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;

  // Log chat ID for debugging/future user linking
  console.log(`Telegram /start command from chat ID: ${chatId}`);

  // Send Turkish welcome message
  await ctx.reply(
    `Merhaba! Emlak asistanina hosgeldiniz.

Bu bot ile:
- Mulk arayabilirsiniz (/ara)
- Mulk durumunu guncelleyebilirsiniz (/durum)
- Bildirim alabilirsiniz

/help yazarak tum komutlari gorebilirsiniz.`
  );

  // TODO: Link user's telegramChatId to Firestore when authentication is implemented
  // This will enable sending notifications to specific users
}
