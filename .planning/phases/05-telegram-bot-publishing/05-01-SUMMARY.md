---
phase: 05-telegram-bot-publishing
plan: 01
subsystem: telegram-bot
tags: [telegram, bot, webhook, grammY, notifications, cloud-functions]
completed: 2026-02-21
duration_minutes: 9

dependency_graph:
  requires: []
  provides:
    - telegram-bot-webhook-endpoint
    - telegram-notification-sender
    - telegram-basic-commands
  affects:
    - cloud-functions-deployment

tech_stack:
  added:
    - grammy: Telegram bot framework with webhook support
  patterns:
    - Webhook-based bot deployment on Cloud Functions
    - Separate bot instances for webhook handler and notification sender
    - Turkish language bot commands and messages
    - Graceful error handling for Telegram API errors

key_files:
  created:
    - functions/src/telegram/bot.ts
    - functions/src/telegram/commands/start.ts
    - functions/src/telegram/commands/help.ts
    - functions/src/telegram/notifications.ts
  modified:
    - functions/package.json
    - functions/src/index.ts
    - functions/src/publishing/photoResizer.ts

decisions:
  - title: "grammY framework for Telegram bot"
    rationale: "Modern TypeScript-first framework with built-in webhook support for Cloud Functions"
    alternatives: ["node-telegram-bot-api", "telegraf"]

  - title: "Webhook deployment pattern"
    rationale: "Cloud Functions HTTP trigger with webhookCallback for serverless deployment"
    alternatives: ["Long polling", "self-hosted server"]

  - title: "Separate bot instances for webhook and notifications"
    rationale: "Clearer separation of concerns between incoming messages and outgoing notifications"
    alternatives: ["Single shared bot instance"]

  - title: "Turkish language messages"
    rationale: "Target audience is Turkish real estate agents"
    alternatives: ["English", "multi-language support"]

metrics:
  tasks_completed: 3
  files_created: 4
  files_modified: 3
  commits: 2
  deviations: 1
---

# Phase 05 Plan 01: Telegram Bot Foundation Summary

**One-liner:** Created webhook-based Telegram bot with grammY framework, basic Turkish commands (/start, /help), and notification sender function for Cloud Functions deployment.

## What Was Built

### Telegram Bot Infrastructure
- **Bot Instance** (`bot.ts`): grammY Bot with webhook handler for Cloud Functions
  - Validates TELEGRAM_BOT_TOKEN at module load
  - Registers /start and /help command handlers
  - Default handler for unknown messages
  - HTTPS webhook callback using `webhookCallback(bot, 'https')`
  - Uses europe-west1 region for KVKK compliance

### Bot Commands
- **/start Command** (`commands/start.ts`): Turkish welcome message
  - Greets user and explains bot capabilities
  - Lists available features (property search, status updates, notifications)
  - Logs chat ID for future user linking
  - TODO placeholder for Firestore user linking

- **/help Command** (`commands/help.ts`): Lists all available commands
  - `/ara [sorgu]` - Property search
  - `/durum [id] [yeni_durum]` - Update property status
  - `/eslesmeler` - Show recent matches
  - `/help` - Show help message

### Notification System
- **sendTelegramNotification** (`notifications.ts`): Programmatic message sender
  - Accepts chatId (number or string), message text, and optional parse mode
  - Truncates messages exceeding 4096 character limit
  - Graceful error handling for chat not found (400) and bot blocked (403)
  - Returns boolean success status
  - Separate bot instance for sending notifications

### Cloud Functions Integration
- **telegramWebhook Export** (`index.ts`): Added to Cloud Functions exports
  - Deployed as HTTPS function
  - Configured with TELEGRAM_BOT_TOKEN secret
  - Region: europe-west1 (KVKK compliance)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] Fixed TypeScript compilation error in photoResizer.ts**
- **Found during:** Task 3 verification (npm run build)
- **Issue:** Type error in `processWithConcurrency` function - TypeScript couldn't narrow `Awaited<R> | null` to `R` when filtering null results
- **Root cause:** Promise.all returns `Awaited<R>` which created complex type that didn't narrow properly with `!== null` check
- **Fix:** Used type assertion `result as R` after null check instead of type predicate
- **Files modified:** `functions/src/publishing/photoResizer.ts` (line 60-63)
- **Commit:** c8a02b6 (same commit as Task 3)
- **Rationale:** Build failure blocked task verification. Pre-existing code from phase 05-04 but preventing completion of current task (Rule 3).

### Notes on Existing Work
Tasks 1 and 2 (grammY installation and bot/command creation) were already completed in commit c0ec578 from a previous execution. Files were identical to plan specifications, so no additional work or commits were needed for those tasks.

## Key Technical Details

### grammY Setup Pattern
```typescript
// Create bot with token validation
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new Bot(BOT_TOKEN);

// Register commands
bot.command('start', handleStart);
bot.command('help', handleHelp);

// Default handler
bot.on('message', async (ctx) => {
  await ctx.reply('Bilinmeyen komut. /help yazarak yardim alabilirsiniz.');
});

// Export webhook for Cloud Functions
export const telegramWebhook = onRequest(
  { region: REGION, secrets: ['TELEGRAM_BOT_TOKEN'] },
  webhookCallback(bot, 'https')
);
```

### Notification Sender Pattern
```typescript
export async function sendTelegramNotification(
  chatId: number | string,
  message: string,
  options?: { parseMode?: 'HTML' | 'Markdown' }
): Promise<boolean> {
  // Truncate if needed
  if (message.length > 4096) {
    message = message.substring(0, 4093) + '...';
  }

  try {
    await notificationBot.api.sendMessage(chatId, message, {
      parse_mode: options?.parseMode,
    });
    return true;
  } catch (error) {
    // Handle 400 (chat not found), 403 (blocked), etc.
    return false;
  }
}
```

## Verification Results

✅ **TypeScript Compilation:** `cd functions && npm run build` succeeds
✅ **grammY Package:** Installed in functions/package.json as grammy@^1.40.0
✅ **Webhook Export:** telegramWebhook exported from functions/lib/index.js
✅ **Notification Export:** sendTelegramNotification exported from functions/lib/telegram/notifications.js
✅ **Bot Instance:** Created with command handlers and default message handler
✅ **Turkish Commands:** /start and /help implemented with Turkish messages

## Success Criteria Status

- ✅ grammY package installed in functions/package.json
- ✅ Bot instance created with webhook handler
- ✅ /start and /help commands implemented with Turkish messages
- ✅ sendTelegramNotification function ready for use by triggers
- ✅ telegramWebhook exported from functions/src/index.ts
- ✅ All TypeScript compiles without errors

## Next Steps

1. **Deploy to Cloud Functions:** Run `firebase deploy --only functions:telegramWebhook`
2. **Set webhook URL:** After deployment, configure Telegram webhook:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNCTION_URL>
   ```
3. **Test bot commands:** Send /start and /help to bot via Telegram
4. **Implement additional commands:** /ara, /durum, /eslesmeler from help text
5. **User linking:** Connect Telegram chat IDs to Firestore user records for notifications

## Commits

1. **c0ec578** (pre-existing): feat(05-04): add portal specifications and publishing types
   - Included bot.ts, start.ts, help.ts creation
   - grammY package installation

2. **c8a02b6**: feat(05-01): add Telegram notification sender and export webhook
   - Created notifications.ts with sendTelegramNotification function
   - Exported telegramWebhook from index.ts
   - Fixed photoResizer.ts TypeScript error

## Self-Check

Verifying created files and commits...

**File existence:**
- ✅ functions/src/telegram/bot.ts exists
- ✅ functions/src/telegram/commands/start.ts exists
- ✅ functions/src/telegram/commands/help.ts exists
- ✅ functions/src/telegram/notifications.ts exists

**Commit verification:**
- ✅ c0ec578 exists in git log
- ✅ c8a02b6 exists in git log (HEAD)

**Export verification:**
- ✅ telegramWebhook in functions/lib/index.js
- ✅ sendTelegramNotification in functions/lib/telegram/notifications.js

## Self-Check: PASSED

All files created, commits exist, and exports verified in compiled output.
