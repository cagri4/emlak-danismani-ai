import { Bot, webhookCallback } from 'grammy';
import { onRequest } from 'firebase-functions/v2/https';
import { REGION } from '../config';
import { handleStart } from './commands/start';
import { handleHelp } from './commands/help';

// Validate bot token at module load
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

if (!BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN is not set. Bot will not function until token is provided.');
}

// Create bot instance
export const bot = new Bot(BOT_TOKEN);

// Register command handlers
bot.command('start', handleStart);
bot.command('help', handleHelp);

// Default handler for unknown messages
bot.on('message', async (ctx) => {
  await ctx.reply('Bilinmeyen komut. /help yazarak yardim alabilirsiniz.');
});

// Export webhook handler for Cloud Functions
export const telegramWebhook = onRequest(
  {
    region: REGION,
    secrets: ['TELEGRAM_BOT_TOKEN'],
  },
  webhookCallback(bot, 'https')
);
