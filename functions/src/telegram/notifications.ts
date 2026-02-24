import { Bot } from 'grammy';

// Lazy initialization to avoid errors during deployment
let notificationBot: Bot | null = null;
function getBot(): Bot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  if (!notificationBot) {
    notificationBot = new Bot(token);
  }
  return notificationBot;
}

/**
 * Send a notification message to a Telegram chat
 * @param chatId - Telegram chat ID (number or string)
 * @param message - Message text to send
 * @param options - Optional message formatting options
 * @returns true on success, false on failure
 */
export async function sendTelegramNotification(
  chatId: number | string,
  message: string,
  options?: { parseMode?: 'HTML' | 'Markdown' }
): Promise<boolean> {
  // Get bot instance (lazy initialization)
  const bot = getBot();
  if (!bot) {
    console.error('TELEGRAM_BOT_TOKEN is not configured. Cannot send notification.');
    return false;
  }

  if (!chatId) {
    console.error('Chat ID is required to send notification.');
    return false;
  }

  // Truncate long messages (Telegram limit is 4096 characters)
  const MAX_LENGTH = 4096;
  let finalMessage = message;
  if (message.length > MAX_LENGTH) {
    finalMessage = message.substring(0, MAX_LENGTH - 3) + '...';
    console.warn(`Message truncated from ${message.length} to ${MAX_LENGTH} characters`);
  }

  try {
    await bot.api.sendMessage(chatId, finalMessage, {
      parse_mode: options?.parseMode,
    });
    console.log(`Telegram notification sent successfully to chat ${chatId}`);
    return true;
  } catch (error: unknown) {
    // Handle specific Telegram errors gracefully
    if (error && typeof error === 'object' && 'error_code' in error) {
      const telegramError = error as { error_code: number; description: string };

      if (telegramError.error_code === 400) {
        console.error(`Chat not found or invalid: ${chatId}`);
      } else if (telegramError.error_code === 403) {
        console.error(`Bot blocked by user: ${chatId}`);
      } else {
        console.error(`Telegram API error: ${telegramError.description}`);
      }
    } else {
      console.error('Failed to send Telegram notification:', error);
    }
    return false;
  }
}
