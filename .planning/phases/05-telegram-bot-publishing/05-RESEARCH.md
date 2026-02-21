# Phase 5: Telegram Bot & Publishing - Research

**Researched:** 2026-02-21
**Domain:** Telegram Bot Development, Real Estate Portal Publishing, Automated Notifications, AI Price Suggestions
**Confidence:** MEDIUM

## Summary

Phase 5 requires implementing two major feature domains: (1) a Telegram bot interface for property search, status updates, and notifications, and (2) listing publication to three Turkish real estate portals (sahibinden.com, hepsiemlak, emlakjet) with automatic photo resizing. Additionally, the phase includes automated matching notifications and AI-driven price suggestions.

**Critical findings:**
- **Telegram Bot**: grammY is the recommended framework over Telegraf for 2026 - better documentation, faster Bot API updates, superior TypeScript support
- **Portal Publishing**: No official public APIs found for sahibinden.com, hepsiemlak, or emlakjet. These portals likely require either (a) partner agreements for API access, or (b) automated browser interaction (Playwright/Puppeteer)
- **Existing Infrastructure**: Project already has Sharp for image processing, Playwright for scraping, Claude API integration, and matching engine - all can be reused
- **Architecture Pattern**: Webhook-based Telegram bot on Firebase Cloud Functions (not polling) for serverless efficiency

**Primary recommendation:** Use grammY with Firebase webhooks for Telegram bot. Leverage existing Playwright scrapers to reverse-engineer portal publish flows. Implement Firestore triggers for automatic notifications. Use Claude API for price suggestions based on market data from existing competitor monitoring.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ILET-03 | Telegram bot üzerinden mülk arayabilmeli | grammY natural language processing integration with Claude API, webhook pattern for Firebase |
| ILET-04 | Telegram bot üzerinden durum güncelleyebilmeli | grammY command handlers, Firebase Admin SDK for Firestore updates |
| ILET-05 | Telegram'dan bildirim alabilmeli | Telegram Bot API sendMessage, Firestore triggers for event detection |
| PORT-05 | Kullanıcı sistemden sahibinden.com'a ilan yükleyebilmeli | Playwright automation (reverse-engineer from existing scrapers), image specs: max 5MB, auto-resize to 800x600 |
| PORT-06 | Kullanıcı sistemden hepsiemlak'a ilan yükleyebilmeli | Playwright automation (no public API), photo specs unknown - need testing |
| PORT-07 | Kullanıcı sistemden emlakjet'e ilan yükleyebilmeli | Playwright automation (no public API), API transfer system exists but requires partner access |
| PORT-08 | Sistem fotoğrafları portal gereksinimlerine göre otomatik boyutlandırmalı | Sharp already in use - extend existing imageProcessor for portal-specific sizes |
| ESLE-04 | Yeni mülk eklendiğinde uygun müşterilere otomatik bildirim gitmeli | Firestore onCreate trigger on properties collection, existing scoring engine for matching |
| ESLE-05 | Yeni müşteri eklendiğinde uygun mülkler önerilmeli | Firestore onCreate trigger on customers collection, existing findMatchesForCustomer function |
| ESLE-06 | AI piyasa verilerine göre fiyat önerisi yapabilmeli | Claude API with market data from existing competitor monitoring, Turkey launching VIC (Value Information Center) 2026 |
| ESLE-07 | Kullanıcı değerleme raporunu görebilmeli | Claude API structured output for valuation report generation based on property features and market data |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| grammY | ^1.x | Telegram bot framework | Modern, maintained, faster Bot API updates than Telegraf, excellent TypeScript support, built-in webhook support |
| sharp | ^0.33.0 | Image resizing/optimization | Already in use, 4-5x faster than ImageMagick, supports all needed formats (JPEG, PNG, WebP), perfect for portal photo requirements |
| firebase-functions | ^6.0.0 | Serverless Cloud Functions | Already in use, v2 API supports Firestore triggers and webhook endpoints |
| firebase-admin | ^13.0.0 | Firebase Admin SDK | Already in use, required for Firestore operations from functions |
| playwright | ^1.48.0 | Browser automation | Already in use for scraping, can be repurposed for portal publishing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @anthropic-ai/sdk | ^0.77.0 | Claude API client | Already in use, for natural language processing in bot and price suggestions |
| exponential-backoff | ^3.1.1 | Retry logic | Already in use, essential for reliable portal publishing with network flakiness |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| grammY | Telegraf 4.x | Telegraf has more GitHub stars (9k vs 3.3k) but lags on Bot API updates, weaker docs, less TypeScript-friendly. Migration from Telegraf to grammY is common in 2026 |
| Playwright | Puppeteer | Similar capabilities, but Playwright already in use and supports multiple browsers if needed |
| Sharp | ImageMagick/GraphicsMagick | Much slower (4-5x), Sharp already integrated |

**Installation:**
```bash
# In functions directory
cd functions
npm install grammy@^1.0.0

# Other dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
functions/src/
├── telegram/
│   ├── bot.ts              # grammY bot instance and webhook handler
│   ├── commands/           # Command handlers (start, search, update)
│   ├── conversations/      # grammY conversations for multi-step flows
│   └── notifications.ts    # Telegram notification sender
├── publishing/
│   ├── publishers/         # Portal-specific publishers
│   │   ├── sahibinden.ts
│   │   ├── hepsiemlak.ts
│   │   └── emlakjet.ts
│   ├── photoResizer.ts     # Portal-specific image resizing
│   └── common.ts           # Shared publishing utilities
├── triggers/
│   ├── onPropertyCreated.ts    # ESLE-04: Notify matching customers
│   ├── onCustomerCreated.ts    # ESLE-05: Suggest matching properties
│   └── onPublishRequested.ts   # Trigger portal publishing workflow
├── ai/
│   ├── pricePredictor.ts   # ESLE-06: AI price suggestions
│   └── valuationReport.ts  # ESLE-07: Generate valuation report
└── index.ts                # Export all functions
```

### Pattern 1: Webhook-Based Telegram Bot (Serverless)
**What:** Use grammY's `webhookCallback` with Firebase HTTPS function instead of long polling
**When to use:** Always - Firebase Cloud Functions are serverless and can't maintain persistent connections
**Example:**
```typescript
// Source: https://grammy.dev/hosting/firebase
import { Bot, webhookCallback } from "grammy";
import * as functions from "firebase-functions";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "");

// Register commands
bot.command("start", (ctx) => ctx.reply("Merhaba! Emlak asistanı hazır."));
bot.command("ara", async (ctx) => {
  // Natural language search via Claude API
  const query = ctx.message.text.replace("/ara", "").trim();
  // Process with Claude...
});

// Export webhook handler
export const telegramWebhook = functions
  .region("europe-west1")
  .https.onRequest(webhookCallback(bot, "https"));
```

**Setup webhook after deploy:**
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://europe-west1-<PROJECT>.cloudfunctions.net/telegramWebhook"
```

### Pattern 2: Firestore Triggers for Automatic Notifications
**What:** Use `onDocumentCreated` triggers to detect new properties/customers and send notifications
**When to use:** ESLE-04 (new property → notify customers), ESLE-05 (new customer → suggest properties)
**Example:**
```typescript
// Source: https://firebase.google.com/docs/functions/firestore-events
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { findMatchesForProperty } from "../lib/matching/scoring-engine";
import { sendTelegramNotification } from "../telegram/notifications";

export const onPropertyCreated = onDocumentCreated(
  {
    document: "users/{userId}/properties/{propertyId}",
    region: "europe-west1"
  },
  async (event) => {
    const property = event.data.data();
    const userId = event.params.userId;

    // Find matching customers
    const customers = await getCustomersForUser(userId);
    const matches = await findMatchesForProperty(property, customers, []);

    // Send Telegram notifications to top matches
    for (const match of matches.slice(0, 3)) {
      if (match.customer.telegramChatId) {
        await sendTelegramNotification(
          match.customer.telegramChatId,
          `Yeni mülk: ${property.title} - Eşleşme: ${match.score.score}%`
        );
      }
    }
  }
);
```

**CRITICAL:** Prevent infinite loops by checking if document actually changed before updating:
```typescript
// Bad: Can cause infinite loop
export const onPropertyUpdate = onDocumentUpdated(..., async (event) => {
  await event.data.after.ref.update({ processed: true }); // Triggers same function!
});

// Good: Check before updating
export const onPropertyUpdate = onDocumentUpdated(..., async (event) => {
  if (!event.data.before.data().processed && !event.data.after.data().processed) {
    await event.data.after.ref.update({ processed: true });
  }
});
```

### Pattern 3: Portal Publishing with Playwright
**What:** Reuse existing scraper infrastructure to automate portal form submission
**When to use:** PORT-05, PORT-06, PORT-07 (publish to portals without official APIs)
**Example:**
```typescript
// Pattern based on existing scrapers/sahibinden.ts
import { createBrowser, randomDelay } from "../scrapers/common";

export async function publishToSahibinden(listing: ListingData): Promise<string> {
  const { browser, page } = await createBrowser();

  try {
    // Navigate to listing creation page
    await page.goto("https://www.sahibinden.com/ilan/olustur/emlak");

    // Login if needed
    await page.fill("#email", listing.userEmail);
    await page.fill("#password", listing.userPassword);
    await page.click("button[type=submit]");

    await randomDelay(2000, 3000);

    // Fill form
    await page.selectOption("#category", "konut");
    await page.fill("#title", listing.title);
    await page.fill("#price", String(listing.price));
    // ... more fields

    // Upload photos (resized to sahibinden specs)
    const resizedPhotos = await resizeForSahibinden(listing.photos);
    for (const photo of resizedPhotos) {
      await page.setInputFiles("input[type=file]", photo);
      await randomDelay(1000, 2000);
    }

    // Submit
    await page.click("button.submit-listing");
    await page.waitForURL(/\/ilan\/\d+/);

    const listingUrl = page.url();
    return listingUrl;
  } finally {
    await browser.close();
  }
}
```

### Pattern 4: Portal-Specific Photo Resizing
**What:** Extend existing Sharp image processor to create portal-optimized versions
**When to use:** PORT-08 (automatic photo resizing for portal requirements)
**Example:**
```typescript
// Source: https://sharp.pixelplumbing.com/api-resize/
import sharp from "sharp";

export async function resizeForPortal(
  sourceBuffer: Buffer,
  portal: "sahibinden" | "hepsiemlak" | "emlakjet"
): Promise<Buffer> {
  const specs = getPortalSpecs(portal);

  return sharp(sourceBuffer)
    .resize(specs.maxWidth, specs.maxHeight, {
      fit: "inside",
      withoutEnlargement: true
    })
    .jpeg({ quality: specs.quality })
    .toBuffer();
}

function getPortalSpecs(portal: string) {
  const portalSpecs = {
    sahibinden: { maxWidth: 800, maxHeight: 600, quality: 85, maxSize: 5 * 1024 * 1024 },
    hepsiemlak: { maxWidth: 1024, maxHeight: 768, quality: 85, maxSize: 5 * 1024 * 1024 }, // estimated
    emlakjet: { maxWidth: 1024, maxHeight: 768, quality: 85, maxSize: 5 * 1024 * 1024 }    // estimated
  };
  return portalSpecs[portal];
}
```

### Pattern 5: Claude API for Price Suggestions
**What:** Use Claude with structured output to analyze market data and generate price recommendations
**When to use:** ESLE-06 (price suggestions), ESLE-07 (valuation reports)
**Example:**
```typescript
import Anthropic from "@anthropic-ai/sdk";

export async function generatePriceSuggestion(
  property: Property,
  marketData: CompetitorListing[]
): Promise<PriceSuggestion> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Aşağıdaki mülk için piyasa verilerine göre fiyat önerisi yap:

Mülk: ${property.type}, ${property.rooms}, ${property.area}m², ${property.location.district}/${property.location.city}

Rakip ilanlar:
${marketData.map(m => `- ${m.price} TL, ${m.area}m², ${m.location}`).join("\n")}

Lütfen şu formatta yanıt ver:
{
  "suggestedPrice": number,
  "priceRange": { "min": number, "max": number },
  "reasoning": "string",
  "marketTrend": "yükseliş" | "durgun" | "düşüş",
  "confidence": "yüksek" | "orta" | "düşük"
}`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }]
  });

  const content = response.content[0];
  return JSON.parse(content.type === "text" ? content.text : "{}");
}
```

### Anti-Patterns to Avoid

- **Long Polling in Cloud Functions:** Functions timeout after max 540s. Use webhooks for Telegram bots, not polling.
- **Hardcoded Portal Credentials:** Use Firebase environment config or Secret Manager for portal login credentials.
- **Synchronous Photo Upload:** Uploading 10-20 photos sequentially is slow. Use Promise.all for parallel processing (but respect portal rate limits).
- **No Idempotency in Triggers:** Firestore triggers can fire multiple times for same event. Always check if work already done before processing.
- **Storing Telegram Bot Token in Code:** Use environment variables or Secret Manager, never commit tokens.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Telegram Bot Framework | Custom webhook parser and message router | grammY | Handles all Bot API types, updates, middleware, conversations, file handling, error handling |
| Image Resizing | Canvas API or custom JPEG encoder | Sharp | 4-5x faster, handles color profiles, EXIF, progressive JPEG, format detection automatically |
| Retry Logic for Portal Publishing | Custom setTimeout loops | exponential-backoff (already in use) | Handles backoff strategy, max attempts, jitter, error classification |
| Natural Language Understanding | Regex parsers or keyword matching | Claude API (already integrated) | Turkish language understanding, context handling, intent extraction |
| Price Prediction Algorithm | Manual formula with location/size coefficients | Claude API with market data | Understands market nuances, trends, seasonal factors, qualitative features |
| Duplicate Detection | Manual string comparison | fuzzball (already in use) | Levenshtein distance, Turkish character handling, threshold tuning |
| Telegram Conversation State | Manual state machine in Firestore | grammY conversations plugin | Handles multi-step flows, cancellation, timeouts, type-safe state |

**Key insight:** Portal publishing is deceptively complex - form validation, CSRF tokens, rate limiting, captchas, session management, error handling. Playwright handles all browser complexity. Don't try to reverse-engineer HTTP APIs manually.

## Common Pitfalls

### Pitfall 1: Webhook Not Receiving Updates
**What goes wrong:** Deploy Telegram bot function, but bot doesn't respond to messages
**Why it happens:** Forgot to call setWebhook or webhook URL is wrong
**How to avoid:**
1. Always call setWebhook after deployment with exact function URL
2. Test webhook is active: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
3. Check Firebase function logs for incoming requests
**Warning signs:** `getWebhookInfo` shows `url: ""` or old URL

### Pitfall 2: Infinite Firestore Trigger Loops
**What goes wrong:** Function creates/updates document, triggering itself infinitely, exhausting quota
**Why it happens:** Trigger modifies same collection it watches without checking if change needed
**How to avoid:**
1. Write to different collection (e.g., trigger on `properties` but write to `notifications`)
2. Check field value before updating: `if (!doc.data().notified) { await update({ notified: true }) }`
3. Use naming conventions: ignore files/documents with `-processed` suffix
**Warning signs:** Function execution count spikes, quota warnings, same function name in logs repeatedly

### Pitfall 3: Portal Publishing Fails Silently
**What goes wrong:** Publishing function completes successfully but listing doesn't appear on portal
**Why it happens:** Portal changed form structure, added validation, or detected automation
**How to avoid:**
1. Screenshot on error: `await page.screenshot({ path: "/tmp/error.png" })`
2. Log full page HTML on unexpected state: `console.log(await page.content())`
3. Check for error messages in page: `await page.locator(".error-message").textContent()`
4. Test in headless: false mode during development
**Warning signs:** Function logs show success but portal dashboard shows no new listing

### Pitfall 4: Photo Upload Exceeds Portal Limits
**What goes wrong:** Portal rejects photos or degrades quality unexpectedly
**Why it happens:** Photos exceed size limit (5MB for sahibinden), or wrong format, or too large dimensions
**How to avoid:**
1. Always resize AND check file size: `if (buffer.length > 5 * 1024 * 1024) { reduce quality }`
2. Convert to JPEG even if source is PNG: portals prefer JPEG
3. Use progressive JPEG for faster loading: `sharp().jpeg({ progressive: true })`
4. Test with actual portal upload to verify specs (docs may be outdated)
**Warning signs:** Portal shows "file too large" error, or photos appear blurry/low quality

### Pitfall 5: Telegram Message Length Limits
**What goes wrong:** Bot tries to send long property listing description, Telegram API returns 400 error
**Why it happens:** Telegram message limit is 4096 characters
**How to avoid:**
1. Truncate with ellipsis: `description.slice(0, 4000) + "... (devamı için linke tıklayın)"`
2. Split into multiple messages for very long content
3. Use inline keyboard with "Detaylar" button linking to web app
**Warning signs:** Telegram API error "message is too long"

### Pitfall 6: Node.js Version Mismatch
**What goes wrong:** Deploy fails or function crashes with "unsupported Node.js version" error
**Why it happens:** Firebase Functions only supports Node.js 18, 20, 22 (as of 2026), local dev may use different version
**How to avoid:**
1. Set in functions/package.json: `"engines": { "node": "20" }`
2. Use nvm locally: `nvm use 20`
3. Verify before deploy: `node --version`
**Warning signs:** Deploy error mentioning Node.js version, or runtime crashes with module errors

### Pitfall 7: Missing Telegram Chat ID
**What goes wrong:** Can't send notification to user because telegramChatId is null
**Why it happens:** User hasn't started conversation with bot yet, or chat ID not saved during /start
**How to avoid:**
1. Save chat ID on first /start: `await saveUser({ telegramChatId: ctx.chat.id })`
2. Prompt user to start bot before enabling notifications
3. Check if chat ID exists before sending: `if (customer.telegramChatId) { send() }`
**Warning signs:** Notification function logs "missing chat ID" or Telegram API returns "chat not found"

## Code Examples

Verified patterns from official sources:

### grammY Natural Language Search with Claude
```typescript
// Source: Existing @anthropic-ai/sdk integration + grammY docs
import { Bot } from "grammy";
import Anthropic from "@anthropic-ai/sdk";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

bot.command("ara", async (ctx) => {
  const query = ctx.message.text.replace("/ara", "").trim();

  if (!query) {
    return ctx.reply("Kullanım: /ara Çankaya'da 2+1 daire 3M TL'ye kadar");
  }

  // Use Claude to parse natural language query
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Parse this Turkish property search query into structured filters:
      "${query}"

      Return JSON:
      {
        "location": { "city": "string", "district": "string" },
        "propertyType": "daire" | "villa" | "arsa",
        "rooms": "string",
        "maxPrice": number
      }`
    }]
  });

  const filters = JSON.parse(response.content[0].text);

  // Search properties in Firestore
  const properties = await searchProperties(ctx.from.id, filters);

  // Send results
  if (properties.length === 0) {
    return ctx.reply("Aramanıza uygun mülk bulunamadı.");
  }

  for (const property of properties.slice(0, 5)) {
    await ctx.reply(
      `📍 ${property.title}\n` +
      `💰 ${property.price.toLocaleString("tr-TR")} TL\n` +
      `📐 ${property.area}m² • ${property.rooms}\n` +
      `🏘 ${property.location.district}, ${property.location.city}`
    );
  }
});
```

### Firestore Trigger for New Property Notifications
```typescript
// Source: https://firebase.google.com/docs/functions/firestore-events
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";
import { Bot } from "grammy";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

export const notifyMatchingCustomers = onDocumentCreated(
  {
    document: "users/{userId}/properties/{propertyId}",
    region: "europe-west1"
  },
  async (event) => {
    const propertyId = event.params.propertyId;
    const userId = event.params.userId;
    const property = event.data.data();

    // Get all customers for this user
    const db = getFirestore();
    const customersSnap = await db
      .collection("users").doc(userId)
      .collection("customers")
      .where("preferences.propertyType", "array-contains", property.type)
      .get();

    // Find matches
    const matches = [];
    for (const doc of customersSnap.docs) {
      const customer = doc.data();
      const score = await scorePropertyForCustomer(customer, property, []);
      if (score.score >= 60) { // 60% threshold
        matches.push({ customer, score });
      }
    }

    // Send Telegram notifications
    for (const { customer, score } of matches.slice(0, 3)) {
      if (customer.telegramChatId) {
        await bot.api.sendMessage(
          customer.telegramChatId,
          `🎯 Yeni eşleşme!\n\n` +
          `${property.title}\n` +
          `${property.location.district}, ${property.location.city}\n` +
          `${property.price.toLocaleString("tr-TR")} TL\n\n` +
          `Eşleşme oranı: ${score.score}%`
        );
      }
    }

    console.log(`Sent ${matches.length} notifications for property ${propertyId}`);
  }
);
```

### Sharp Multi-Size Image Resizing
```typescript
// Source: https://sharp.pixelplumbing.com/api-resize/
import sharp from "sharp";

export async function generatePortalPhotos(
  sourceBuffer: Buffer,
  portal: "sahibinden" | "hepsiemlak" | "emlakjet"
): Promise<{ buffer: Buffer; size: number }> {
  const specs = {
    sahibinden: { width: 800, height: 600, quality: 85 },
    hepsiemlak: { width: 1024, height: 768, quality: 85 },
    emlakjet: { width: 1024, height: 768, quality: 85 }
  };

  const spec = specs[portal];

  let quality = spec.quality;
  let buffer = await sharp(sourceBuffer)
    .resize(spec.width, spec.height, {
      fit: "inside",
      withoutEnlargement: true
    })
    .jpeg({ quality, progressive: true })
    .toBuffer();

  // Reduce quality if still too large (5MB limit for sahibinden)
  const maxSize = 5 * 1024 * 1024;
  while (buffer.length > maxSize && quality > 60) {
    quality -= 5;
    buffer = await sharp(sourceBuffer)
      .resize(spec.width, spec.height, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, progressive: true })
      .toBuffer();
  }

  return { buffer, size: buffer.length };
}
```

### Idempotent Firestore Trigger Pattern
```typescript
// Source: Best practices for Firestore triggers
import { onDocumentCreated } from "firebase-functions/v2/firestore";

export const processNewCustomer = onDocumentCreated(
  {
    document: "users/{userId}/customers/{customerId}",
    region: "europe-west1"
  },
  async (event) => {
    const customerRef = event.data.ref;
    const customer = event.data.data();

    // CRITICAL: Check if already processed (idempotency)
    if (customer.matchingSuggestionsSent) {
      console.log("Already processed, skipping");
      return;
    }

    // Find matching properties
    const matches = await findMatchesForCustomer(customer, properties, []);

    // Mark as processed FIRST (prevent re-triggering if notification fails)
    await customerRef.update({ matchingSuggestionsSent: true });

    // Send suggestions
    if (customer.telegramChatId && matches.length > 0) {
      await sendMatchingSuggestions(customer.telegramChatId, matches);
    }
  }
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Telegraf for new Telegram bots | grammY | 2024-2025 | grammY has better docs, faster Bot API updates, superior TypeScript support. Migration from Telegraf increasing |
| Long polling for bots on Cloud Functions | Webhook-based deployment | Always (serverless requirement) | Can't maintain persistent connections in serverless. Webhooks are faster and more efficient |
| Manual portal API integration | Browser automation (Playwright/Puppeteer) | Ongoing (portals don't offer public APIs) | No official APIs exist for Turkish portals. Automation only viable option for publishing |
| ImageMagick for image processing | Sharp | 2020+ | Sharp is 4-5x faster, native performance, better quality |
| Manual price calculations | AI/ML price predictions | 2024+ | Turkey launching VIC (Value Information Center) in 2026, AI models achieving 3% error margin |
| Firebase Functions v1 | Firebase Functions v2 | 2022+ | v2 has better TypeScript support, Cloud Tasks integration, improved Firestore triggers |

**Deprecated/outdated:**
- **node-telegram-bot-api**: Largely unmaintained (per grammY comparison page), use grammY or Telegraf instead
- **Firebase Functions Node.js 14, 16**: End of life, use Node.js 18 or 20 minimum
- **Long polling for production bots**: Webhooks are recommended for efficiency and Cloud platform compatibility

## Open Questions

1. **Portal API Access**
   - What we know: No public APIs found for sahibinden, hepsiemlak, emlakjet
   - What's unclear: Whether partner agreements exist for API access, or only browser automation is viable
   - Recommendation: Start with Playwright automation (proven with scrapers), contact portals in parallel to inquire about API access

2. **Hepsiemlak & Emlakjet Photo Specs**
   - What we know: Sahibinden specs documented (max 5MB, auto-resize to 800x600), hepsiemlak/emlakjet specs not found
   - What's unclear: Exact dimension, size, and format requirements for hepsiemlak and emlakjet
   - Recommendation: Test actual uploads to determine limits, start with 1024x768 @ 85% quality as baseline

3. **Telegram Bot Authentication**
   - What we know: Users need to link Telegram account to system user
   - What's unclear: Best UX flow - deep link from web app vs. manual token entry vs. QR code
   - Recommendation: Use Telegram deep links (`https://t.me/botname?start=USER_TOKEN`) for seamless linking

4. **Market Data for Price Suggestions**
   - What we know: Existing competitor monitoring provides market data, Turkey launching VIC in 2026
   - What's unclear: How to structure market data for Claude prompts, accuracy threshold expectations
   - Recommendation: Start with competitor listing prices + property features, show confidence level in UI, iterate based on user feedback

5. **Rate Limiting on Portals**
   - What we know: Portals likely have rate limits and anti-bot measures
   - What's unclear: Specific rate limits, whether IP-based or account-based
   - Recommendation: Implement exponential backoff (already have library), random delays (already in scrapers), monitor for captchas/blocks

6. **Notification Preferences**
   - What we know: Users can receive Telegram notifications for matches
   - What's unclear: Granularity of preferences (all matches? only high scores? daily digest?)
   - Recommendation: Start simple (notify for 70%+ matches), add preferences in later iteration

## Sources

### Primary (HIGH confidence)
- [grammY Framework Official Docs](https://grammy.dev/) - Telegram bot framework features, TypeScript support, webhook deployment
- [grammY Firebase Hosting Guide](https://grammy.dev/hosting/firebase) - Complete setup for Firebase Cloud Functions deployment
- [Sharp Official Docs](https://sharp.pixelplumbing.com/) - Image resizing API, quality optimization, performance characteristics
- [Firebase Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events) - onCreate/onUpdate triggers, event structure, best practices
- Existing codebase (`functions/src/scrapers/`, `src/lib/matching/`) - Playwright patterns, matching engine, Sharp usage

### Secondary (MEDIUM confidence)
- [grammY vs Telegraf Comparison](https://grammy.dev/resources/comparison) - Feature comparison, migration considerations
- [Building Telegram Bot with Firebase and Telegraf](https://medium.com/firebase-developers/building-a-telegram-bot-with-firebase-cloud-functions-and-telegraf-js-5e5323068894) - Webhook setup patterns
- [Image Thumbnail Resizer Cloud Function Tutorial](https://fireship.io/lessons/image-thumbnail-resizer-cloud-function/) - Sharp with Firebase Storage triggers
- [Sahibinden.com Photo Requirements](http://www.seatclubturkey.com/showthread.php?t=59050) - User-reported photo specs (5MB, 800x600 resize)

### Tertiary (LOW confidence - requires verification)
- WebSearch results on hepsiemlak/emlakjet APIs - No official public APIs found, marked for testing
- WebSearch on photo requirements for hepsiemlak/emlakjet - Specs unknown, need empirical testing
- [Turkey Digital Real Estate Valuation System](https://internationalinvestment.biz/en/real-estate/5884-turkey-to-launch-digital-real-estate-valuation-system.html) - VIC launch 2026, may affect price prediction features
- [AI Real Estate Market Predictions](https://www.growthfactor.ai/blog-posts/ai-real-estate-market-analysis) - AI price prediction with 3% error margin claims

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - grammY and Sharp well-documented, Firebase already in use, Playwright proven in codebase
- Architecture patterns: MEDIUM-HIGH - Webhook pattern verified in docs, Firestore triggers official, portal publishing based on extrapolation from scrapers
- Portal publishing: LOW-MEDIUM - No official APIs found, automation patterns proven but portal-specific flows need testing
- Photo specs: MEDIUM (sahibinden) / LOW (hepsiemlak, emlakjet) - Sahibinden specs from user reports, others need empirical testing
- Price suggestions: MEDIUM - Claude API proven, market data available, but accuracy and prompt engineering need iteration

**Research date:** 2026-02-21
**Valid until:** 30 days (2026-03-23) for stable components (grammY, Sharp, Firebase), 7 days for portal-specific research (may change form structures)
