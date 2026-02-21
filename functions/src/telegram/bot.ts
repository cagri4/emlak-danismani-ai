import { Bot, webhookCallback } from 'grammy';
import { onRequest } from 'firebase-functions/v2/https';
import { REGION } from '../config';
import { handleStart } from './commands/start';
import { handleHelp } from './commands/help';
import { handleSearch } from './commands/search';
import { handleStatus } from './commands/status';
import { handleMatches } from './commands/matches';

// Validate bot token at module load
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

if (!BOT_TOKEN) {
  console.warn('TELEGRAM_BOT_TOKEN is not set. Bot will not function until token is provided.');
}

// Create bot instance
export const bot = new Bot(BOT_TOKEN);

// Error handling wrapper
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Register command handlers
bot.command('start', handleStart);
bot.command('help', handleHelp);
bot.command('ara', handleSearch);
bot.command('durum', handleStatus);
bot.command('eslesmeler', handleMatches);

// Default handler for unknown messages
bot.on('message', async (ctx) => {
  try {
    await ctx.reply('Bilinmeyen komut. /help yazarak yardim alabilirsiniz.');
  } catch (error) {
    console.error('Default handler error:', error);
  }
});

// Export webhook handler for Cloud Functions
export const telegramWebhook = onRequest(
  {
    region: REGION,
    secrets: ['TELEGRAM_BOT_TOKEN', 'ANTHROPIC_API_KEY'],
  },
  webhookCallback(bot, 'https')
);
