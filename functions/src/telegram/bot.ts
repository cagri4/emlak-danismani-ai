import { Bot, webhookCallback } from 'grammy';
import { onRequest } from 'firebase-functions/v2/https';
import { REGION } from '../config';
import { handleStart } from './commands/start';
import { handleHelp } from './commands/help';
import { handleSearch } from './commands/search';
import { handleStatus } from './commands/status';
import { handleMatches } from './commands/matches';
import { handleNaturalLanguage, handleDeleteCallback } from './ai-handler';

// Lazy initialization to avoid errors during deployment
let bot: Bot | null = null;
let botInitialized = false;

async function getBot(): Promise<Bot> {
  if (!bot) {
    console.log('Initializing Telegram bot...');
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('TELEGRAM_BOT_TOKEN is not set');
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }
    console.log('Bot token found, creating Bot instance...');
    bot = new Bot(token);

    // Error handling wrapper
    bot.catch((err) => {
      console.error('Bot error:', err);
    });

    // Register command handlers with error wrapping
    bot.command('start', async (ctx) => {
      try {
        await handleStart(ctx);
      } catch (e) {
        console.error('Start handler error:', e);
        await ctx.reply('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    });

    bot.command('help', async (ctx) => {
      try {
        await handleHelp(ctx);
      } catch (e) {
        console.error('Help handler error:', e);
        await ctx.reply('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    });

    bot.command('ara', async (ctx) => {
      try {
        await handleSearch(ctx);
      } catch (e) {
        console.error('Search handler error:', e);
        await ctx.reply('Arama sırasında bir hata oluştu.');
      }
    });

    bot.command('durum', async (ctx) => {
      try {
        await handleStatus(ctx);
      } catch (e) {
        console.error('Status handler error:', e);
        await ctx.reply('Durum güncellemesi sırasında bir hata oluştu.');
      }
    });

    bot.command('eslesmeler', async (ctx) => {
      try {
        await handleMatches(ctx);
      } catch (e) {
        console.error('Matches handler error:', e);
        await ctx.reply('Eşleşmeler yüklenirken bir hata oluştu.');
      }
    });

    // Handle callback queries (for delete confirmations, etc.)
    bot.on('callback_query:data', async (ctx) => {
      try {
        console.log('Callback query received:', ctx.callbackQuery.data);
        await handleDeleteCallback(ctx);
      } catch (error) {
        console.error('Callback handler error:', error);
        await ctx.answerCallbackQuery({ text: 'Bir hata oluştu' });
      }
    });

    // Default handler - use AI for natural language processing
    bot.on('message:text', async (ctx) => {
      try {
        // Skip if it looks like an unrecognized command
        if (ctx.message.text.startsWith('/')) {
          await ctx.reply('Bilinmeyen komut. /help yazarak yardım alabilirsiniz.');
          return;
        }

        // Process with AI
        console.log('Processing with AI handler:', ctx.message.text.substring(0, 50));
        await handleNaturalLanguage(ctx);
      } catch (error) {
        console.error('AI handler error:', error);
        await ctx.reply('Bir hata oluştu. Lütfen tekrar deneyin veya /help yazın.');
      }
    });

    console.log('Telegram bot handlers registered');
  }

  // Initialize bot if not done yet (required by grammy for webhooks)
  if (!botInitialized) {
    console.log('Calling bot.init()...');
    await bot.init();
    botInitialized = true;
    console.log('Telegram bot initialized successfully');
  }

  return bot;
}

// Export bot getter for other modules
export { getBot };

// Export webhook handler for Cloud Functions
export const telegramWebhook = onRequest(
  {
    region: REGION,
    secrets: ['TELEGRAM_BOT_TOKEN', 'ANTHROPIC_API_KEY'],
    timeoutSeconds: 60, // Allow time for AI operations
  },
  async (req, res) => {
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] Telegram webhook received:`, req.method);

    // Only handle POST requests
    if (req.method !== 'POST') {
      console.log('Non-POST request, returning OK');
      res.status(200).send('OK');
      return;
    }

    try {
      // Log request body for debugging
      const update = req.body;
      console.log('Update:', JSON.stringify(update).substring(0, 500));

      if (!update || !update.update_id) {
        console.log('Invalid update, no update_id');
        res.status(200).send('OK');
        return;
      }

      // Initialize bot
      console.log('Getting bot instance...');
      const botInstance = await getBot();
      console.log('Bot instance obtained and initialized');

      // Manually handle the update
      console.log('Handling update...');
      await botInstance.handleUpdate(update);

      console.log(`Webhook processed successfully in ${Date.now() - startTime}ms`);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Telegram webhook error:', error);
      console.error('Error stack:', (error as Error).stack);
      console.log(`Webhook failed after ${Date.now() - startTime}ms`);

      // Return 200 to prevent Telegram from retrying
      res.status(200).send('Error handled');
    }
  }
);
