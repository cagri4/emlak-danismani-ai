import { Bot } from 'grammy';

// Create bot instance for sending notifications
// This can be the same token but separate instance for clarity
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const notificationBot = new Bot(BOT_TOKEN);

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
  // Validate inputs
  if (!BOT_TOKEN) {
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
    await notificationBot.api.sendMessage(chatId, finalMessage, {
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
