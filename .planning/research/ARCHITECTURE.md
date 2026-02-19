# Architecture Research

**Domain:** AI-powered Real Estate SaaS (Multi-channel)
**Researched:** 2026-02-19
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Multi-Channel)                         │
├──────────────────────┬─────────────────────┬────────────────────────────────┤
│   Web App (Next.js)  │   PWA (Mobile)      │   Telegram Bot                 │
│   - React UI         │   - Offline-first   │   - Webhook endpoint           │
│   - SSR/SSG Pages    │   - Service Worker  │   - Bot commands               │
│   - API Routes       │   - IndexedDB       │   - Natural language           │
└──────────┬───────────┴──────────┬──────────┴─────────────┬──────────────────┘
           │                      │                        │
           └──────────────────────┴────────────────────────┘
                                  │
┌─────────────────────────────────┼─────────────────────────────────────────────┐
│                            API GATEWAY LAYER                                  │
├───────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │  Next.js API     │  │  Middleware      │  │  Telegram Webhook        │   │
│  │  Routes          │  │  - Auth Check    │  │  Handler                 │   │
│  │  - /api/chat     │  │  - Rate Limit    │  │  - Command Parser        │   │
│  │  - /api/listings │  │  - Tenant ID     │  │  - Event Router          │   │
│  │  - /api/scrape   │  │  - Validation    │  │                          │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘   │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
┌───────────────────────────────┼───────────────────────────────────────────────┐
│                        ORCHESTRATION LAYER                                    │
├───────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                      AI Agent Orchestrator                              │  │
│  │  - Command interpretation (Claude API)                                  │  │
│  │  - Task routing (to specialized agents)                                 │  │
│  │  - Context management (conversation state)                              │  │
│  │  - Response synthesis                                                   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬───────────────────────────────────────────────┘
                                │
┌───────────────────────────────┼───────────────────────────────────────────────┐
│                          SERVICE LAYER (Firebase Cloud Functions)            │
├────────────────────┬──────────┴──────────┬─────────────────┬─────────────────┤
│  Scraping Service  │  Image Service      │  Text Service   │  Integration    │
│  - Job Queue       │  - Upload Handler   │  - Generator    │  Service        │
│  - Worker Pool     │  - Processor        │  - Templates    │  - Platform API │
│  - Rate Limiter    │  - Optimizer        │  - Personalize  │  - Sync Jobs    │
│  - Parser          │  - Storage          │                 │  - Webhooks     │
└────────────────────┴─────────────────────┴─────────────────┴─────────────────┘
                                │
┌───────────────────────────────┼───────────────────────────────────────────────┐
│                          DATA LAYER (Firebase)                                │
├──────────────────────┬────────┴────────────┬─────────────────────────────────┤
│   Firestore          │   Firebase Storage  │   Firebase Auth                 │
│   - Users            │   - Property Images │   - User Sessions               │
│   - Listings         │   - Generated Docs  │   - API Tokens                  │
│   - Conversations    │   - Exports         │   - Multi-tenant                │
│   - Jobs (queue)     │                     │                                 │
│   - Integrations     │                     │                                 │
└──────────────────────┴─────────────────────┴─────────────────────────────────┘
                                │
┌───────────────────────────────┼───────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                                       │
├──────────────────────┬────────┴────────────┬─────────────────────────────────┤
│   Claude API         │   Real Estate       │   Telegram API                  │
│   - Text Generation  │   Platforms         │   - Bot Framework               │
│   - Analysis         │   - sahibinden.com  │   - Message Delivery            │
│   - Streaming        │   - hepsiemlak.com  │                                 │
│                      │   - emlakjet.com    │                                 │
└──────────────────────┴─────────────────────┴─────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Web App (Next.js)** | Primary user interface, SSR pages, client-side state | Next.js 15 with App Router, React Server Components, TailwindCSS |
| **PWA Layer** | Offline-first mobile experience | Service Worker + IndexedDB + next-pwa plugin |
| **Telegram Bot** | Natural language interface for agents on-the-go | Bot API + webhook handler + command parser |
| **API Gateway** | Request routing, auth, rate limiting, validation | Next.js API Routes + Firebase Auth middleware |
| **AI Orchestrator** | Command → Action routing, conversation context | Claude API + state management (Firestore) |
| **Scraping Service** | Automated data collection from RE platforms | Cloud Functions + queue (Firestore) + Cheerio/Puppeteer |
| **Image Service** | Upload, optimize, process property images | Cloud Functions + Firebase Storage + Sharp |
| **Text Service** | AI-powered listing descriptions, messages | Cloud Functions + Claude API + templates |
| **Integration Service** | Bi-directional sync with RE platforms | Cloud Functions + Platform APIs + webhook handlers |
| **Firestore** | Primary database (NoSQL), real-time updates | Firebase Firestore with security rules |
| **Firebase Storage** | Binary file storage (images, documents) | Cloud Storage for Firebase with CDN |
| **Firebase Auth** | Identity, sessions, multi-tenancy | Firebase Authentication + custom claims |

## Recommended Project Structure

```
emlak-danismani-ai-asistanı/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth-protected routes
│   │   ├── (public)/          # Public routes
│   │   ├── api/               # API routes
│   │   │   ├── chat/          # AI chat endpoint
│   │   │   ├── listings/      # Listing CRUD
│   │   │   ├── scrape/        # Scraping triggers
│   │   │   ├── telegram/      # Telegram webhook
│   │   │   └── integrations/  # Platform webhooks
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── listings/         # Listing-specific
│   │   ├── chat/             # Chat interface
│   │   └── dashboard/        # Dashboard widgets
│   ├── lib/                   # Shared utilities
│   │   ├── firebase/         # Firebase client SDK
│   │   │   ├── client.ts     # Client config
│   │   │   ├── admin.ts      # Admin SDK (server-only)
│   │   │   └── hooks.ts      # React hooks
│   │   ├── claude/           # Claude API client
│   │   │   ├── client.ts     # API wrapper
│   │   │   ├── prompts.ts    # Prompt templates
│   │   │   └── streaming.ts  # SSE handling
│   │   ├── agents/           # AI agent logic
│   │   │   ├── orchestrator.ts    # Main router
│   │   │   ├── scraping-agent.ts  # Scraping tasks
│   │   │   ├── listing-agent.ts   # Listing tasks
│   │   │   └── chat-agent.ts      # Conversation
│   │   ├── scrapers/         # Web scraping
│   │   │   ├── base.ts       # Base scraper class
│   │   │   ├── sahibinden.ts # Platform-specific
│   │   │   ├── hepsiemlak.ts
│   │   │   └── emlakjet.ts
│   │   ├── integrations/     # Platform APIs
│   │   │   ├── base.ts
│   │   │   ├── sahibinden-api.ts
│   │   │   └── webhook-handlers.ts
│   │   └── telegram/         # Telegram bot
│   │       ├── bot.ts        # Bot instance
│   │       ├── commands.ts   # Command handlers
│   │       └── parser.ts     # NL parser
│   └── types/                 # TypeScript types
├── functions/                 # Firebase Cloud Functions
│   ├── src/
│   │   ├── scraping/         # Scraping workers
│   │   │   ├── scheduler.ts  # Cron triggers
│   │   │   ├── worker.ts     # Queue consumer
│   │   │   └── parser.ts     # HTML parser
│   │   ├── images/           # Image processing
│   │   │   ├── upload.ts     # Upload handler
│   │   │   ├── optimize.ts   # Compression
│   │   │   └── transform.ts  # Resizing
│   │   ├── text/             # Text generation
│   │   │   ├── generator.ts  # Claude wrapper
│   │   │   └── templates.ts  # Prompt templates
│   │   └── integrations/     # Platform sync
│   │       ├── sync.ts       # Bi-directional sync
│   │       └── webhooks.ts   # Incoming events
│   └── package.json
├── public/
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── firestore.rules            # Security rules
├── storage.rules              # Storage rules
└── firebase.json              # Firebase config
```

### Structure Rationale

- **app/ folder:** Next.js App Router for SSR, RSC, and API routes. Route groups `(auth)` and `(public)` separate concerns cleanly.
- **lib/ folder:** Business logic separated from UI. Each subdomain (firebase, claude, agents, scrapers) is self-contained with clear boundaries.
- **functions/ folder:** Cloud Functions for long-running, background, or resource-intensive tasks. Organized by domain (scraping, images, text, integrations).
- **Separation of client/server:** `lib/firebase/client.ts` uses JS SDK (browser), `lib/firebase/admin.ts` uses Admin SDK (server/functions). Import guards prevent bundling server code in client.
- **Agent architecture:** `lib/agents/orchestrator.ts` routes commands to specialized agents (scraping, listing, chat), following the Subagents pattern from AI architecture research.

## Architectural Patterns

### Pattern 1: Multi-Channel Unified API

**What:** Single API layer serves web, mobile PWA, and Telegram bot with identical business logic.

**When to use:** When multiple client interfaces need consistent behavior and data access.

**Trade-offs:**
- **Pros:** Single source of truth, consistent behavior, easier to maintain, shared auth/rate limiting.
- **Cons:** API must handle diverse client capabilities (web has rich UI, Telegram is text-based).

**Example:**
```typescript
// src/app/api/listings/route.ts
// Serves web app, PWA, and Telegram bot

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getListings } from '@/lib/listings';

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req); // Works for all clients
  const listings = await getListings(user.tenantId);
  return NextResponse.json({ listings });
}
```

### Pattern 2: AI Agent Orchestration (Subagents Pattern)

**What:** Main orchestrator agent routes natural language commands to specialized subagents (scraping, listing, chat). Orchestrator maintains conversation context; subagents are stateless.

**When to use:** When AI performs diverse tasks requiring different tools/integrations. Prevents single monolithic agent from becoming unmaintainable.

**Trade-offs:**
- **Pros:** Separation of concerns, easier to test, can optimize each agent's prompts independently, strong context isolation.
- **Cons:** Requires routing logic, adds complexity, context must be passed explicitly.

**Example:**
```typescript
// src/lib/agents/orchestrator.ts

import { classifyIntent } from '@/lib/claude/client';
import { scrapingAgent } from './scraping-agent';
import { listingAgent } from './listing-agent';
import { chatAgent } from './chat-agent';

export async function orchestrate(userMessage: string, context: ConversationContext) {
  const intent = await classifyIntent(userMessage); // Claude classifies intent

  switch (intent) {
    case 'scrape':
      return scrapingAgent.handle(userMessage, context);
    case 'listing':
      return listingAgent.handle(userMessage, context);
    case 'chat':
      return chatAgent.handle(userMessage, context);
    default:
      return { error: 'Intent not recognized' };
  }
}
```

### Pattern 3: Event-Driven Background Processing (Queue + Worker)

**What:** Long-running tasks (scraping, image processing) are enqueued in Firestore, consumed by Cloud Functions workers. Decouples request intake from processing.

**When to use:** Tasks that exceed API route timeout (10s Vercel, 60s Firebase), need retries, or have spiky load.

**Trade-offs:**
- **Pros:** Respects rate limits, handles failures gracefully, scales horizontally, user gets immediate response.
- **Cons:** Eventual consistency (job status updates later), requires queue monitoring, more complex than synchronous.

**Example:**
```typescript
// src/app/api/scrape/route.ts (enqueue)

import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export async function POST(req: NextRequest) {
  const { url, platform } = await req.json();

  const job = await addDoc(collection(db, 'scrapeJobs'), {
    url,
    platform,
    status: 'pending',
    createdAt: new Date(),
  });

  return NextResponse.json({ jobId: job.id }); // Immediate response
}

// functions/src/scraping/worker.ts (consume)

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { scrapeUrl } from './scraper';

export const scrapeWorker = onDocumentCreated('scrapeJobs/{jobId}', async (event) => {
  const { url, platform } = event.data.data();
  const result = await scrapeUrl(url, platform); // Long-running task

  await event.data.ref.update({ status: 'completed', result });
});
```

### Pattern 4: Prompt Caching for Claude API

**What:** Mark reusable context (system prompts, examples, knowledge base) as cacheable. Claude caches it server-side, subsequent requests with same cached content don't count toward ITPM rate limits.

**When to use:** Always. 90% cost reduction on cache hits, and cached tokens don't count toward rate limits—effectively 5x throughput increase.

**Trade-offs:**
- **Pros:** Massive cost savings, higher effective rate limits, faster responses.
- **Cons:** Small complexity in prompt structure (must mark cache boundaries), cache TTL (5 min) means some requests miss cache.

**Example:**
```typescript
// src/lib/claude/client.ts

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

export async function generateListing(propertyData: Property) {
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: 'You are a Turkish real estate expert. Write compelling property listings.',
        cache_control: { type: 'ephemeral' }, // Cache system prompt
      },
      {
        type: 'text',
        text: exampleListings, // 50KB of examples
        cache_control: { type: 'ephemeral' }, // Cache examples
      }
    ],
    messages: [
      { role: 'user', content: JSON.stringify(propertyData) } // Only this changes per request
    ]
  });

  return response.content[0].text;
}
```

### Pattern 5: PWA Offline-First with Sync Queue

**What:** Service worker intercepts requests, serves cached data when offline, queues mutations (create/update listing) in IndexedDB, syncs when online.

**When to use:** Mobile users (agents in the field) need to work without connectivity.

**Trade-offs:**
- **Pros:** Works offline, better UX on flaky connections, faster perceived performance.
- **Cons:** Complex state management, conflict resolution on sync, cache invalidation strategy needed.

**Example:**
```typescript
// public/sw.js (service worker)

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request); // Cache-first
      })
    );
  } else {
    // POST/PUT/DELETE → queue in IndexedDB, sync later
    event.respondWith(queueMutation(event.request));
  }
});

// Sync when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(syncQueuedMutations());
  }
});
```

### Pattern 6: Telegram Bot Webhook with Command Parser

**What:** Telegram sends updates to webhook endpoint. Parser extracts command/natural language, routes to orchestrator, sends response via Bot API.

**When to use:** Agents need mobile-first, chat-based interface without installing app.

**Trade-offs:**
- **Pros:** Familiar interface (Telegram), no app install, fast for text commands.
- **Cons:** Limited UI (no rich forms), webhook must respond in 60s (use queue for long tasks).

**Example:**
```typescript
// src/app/api/telegram/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyTelegramWebhook } from '@/lib/telegram/verify';
import { orchestrate } from '@/lib/agents/orchestrator';
import { sendMessage } from '@/lib/telegram/bot';

export async function POST(req: NextRequest) {
  const update = await req.json();

  if (!verifyTelegramWebhook(update)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message } = update;
  const userId = message.from.id;
  const text = message.text;

  // Route to AI orchestrator
  const response = await orchestrate(text, { userId, channel: 'telegram' });

  // Send response to Telegram
  await sendMessage(message.chat.id, response.text);

  return NextResponse.json({ ok: true });
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Monolithic AI Agent

**What people do:** Single Claude prompt handles all tasks (scraping, listing generation, platform integration, chat).

**Why it's wrong:** As complexity grows, prompt becomes thousands of tokens, hard to debug, expensive, slow, and brittle. Different tasks need different tools/context.

**Do this instead:** Use Subagents pattern—orchestrator classifies intent, routes to specialized agents. Each agent has focused prompt, clear responsibility.

### Anti-Pattern 2: Synchronous Long-Running Tasks in API Routes

**What people do:** API route directly scrapes website, processes images, calls Claude API multiple times—user waits 30+ seconds.

**Why it's wrong:** Vercel API routes timeout at 10s (hobby), 60s (pro). Firebase Cloud Functions timeout at 60s default. User sees timeout error, but task might still be running (zombie process).

**Do this instead:** Use Queue + Worker pattern. API route enqueues job, returns immediately with job ID. Worker processes asynchronously. Client polls for status or subscribes to Firestore real-time updates.

### Anti-Pattern 3: Client-Side Firebase Admin SDK

**What people do:** Import Firebase Admin SDK in client-side code to bypass security rules.

**Why it's wrong:** Admin SDK requires service account credentials. If bundled client-side, credentials are exposed to users—full database access, security catastrophe.

**Do this instead:** Use Admin SDK only in server-side code (Next.js API routes with `export const runtime = 'nodejs'`, or Cloud Functions). Client uses JS SDK with Firestore security rules enforcing access control.

### Anti-Pattern 4: Ignoring Claude API Rate Limits

**What people do:** Send 100 concurrent Claude API requests from 100 users, all hit 429 errors, retry immediately, thundering herd.

**Why it's wrong:** Rate limits are per-organization, not per-user. Tier 1 starts at 50 RPM. Naive retry logic causes repeated 429s, poor UX.

**Do this instead:** Implement client-side rate limiting + queue. Use exponential backoff with jitter on retries. Enable prompt caching to increase effective throughput 5x. Monitor usage in Claude Console, upgrade tier proactively.

### Anti-Pattern 5: Storing Conversation State in Client

**What people do:** Keep conversation history in React state/localStorage. On page refresh or switching to Telegram, context is lost.

**Why it's wrong:** Multi-channel architecture requires shared state. Agent needs conversation history to provide context-aware responses.

**Do this instead:** Store conversation in Firestore (`conversations/{conversationId}/messages/{messageId}`). All clients (web, PWA, Telegram) read/write same conversation. AI orchestrator fetches recent messages for context.

## Data Flow

### Request Flow (Web/PWA)

```
[User Action in React UI]
    ↓
[Client-Side Validation]
    ↓
[API Route (Next.js)] → [Auth Middleware (verifyAuth)] → [Tenant ID Check]
    ↓                                                            ↓
[Business Logic (lib/)]                                    [Rate Limit Check]
    ↓
[Firebase SDK Call (Firestore/Storage/Auth)]
    ↓
[Security Rules (server-side enforcement)]
    ↓
[Data Retrieved/Mutated]
    ↓
[Response → Client (JSON)]
    ↓
[React State Update → UI Render]
```

### AI Command Flow

```
[User: "Find apartments in Ankara under 2M TL"]
    ↓
[orchestrator.classify()] → Claude API (intent classification)
    ↓ intent: 'scrape'
[scrapingAgent.handle()]
    ↓
[Enqueue scrape job in Firestore scrapeJobs collection]
    ↓ (async, Firestore trigger)
[Cloud Function: scrapeWorker] → [scrapeUrl()] → Platform API/HTML parse
    ↓
[Parse results, normalize data]
    ↓
[Save listings to Firestore listings collection]
    ↓
[Update job status: 'completed']
    ↓ (Firestore real-time listener)
[Client receives update] → [Show listings in UI]
```

### Image Upload Flow

```
[User uploads image from web/mobile]
    ↓
[Client: Firebase Storage uploadBytes()] → [Direct upload to Cloud Storage]
    ↓ (Storage trigger)
[Cloud Function: onImageUpload]
    ↓
[Download image, optimize (Sharp), generate thumbnails]
    ↓
[Upload optimized images back to Storage]
    ↓
[Update Firestore listing doc with image URLs]
    ↓ (Firestore real-time listener)
[Client UI shows optimized images]
```

### Telegram Bot Flow

```
[User sends message in Telegram]
    ↓
[Telegram → Webhook POST /api/telegram]
    ↓
[Verify signature, parse command]
    ↓
[orchestrate(message)] → AI agent routing
    ↓
[Agent performs task (query Firestore, call Claude API, enqueue job)]
    ↓
[Response generated]
    ↓
[sendMessage() → Telegram API]
    ↓
[User sees response in Telegram chat]
```

### Platform Integration Sync Flow

```
[Scheduled Cloud Function (cron: every 1 hour)]
    ↓
[For each connected integration in Firestore integrations collection]
    ↓
[Fetch new listings from platform API (sahibinden, hepsiemlak, emlakjet)]
    ↓
[Diff: identify new/updated/deleted listings]
    ↓
[Sync changes to Firestore listings collection]
    ↓ (Firestore trigger)
[Cloud Function: onListingUpdate]
    ↓
[Generate AI description (Claude API)] → [Update listing doc]
    ↓ (Firestore real-time listener)
[Client sees updated listing]
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-100 users** | Monolith is fine. Next.js app + API routes + Cloud Functions all on Firebase/Vercel free tier. Firestore handles reads/writes easily. Claude API Tier 1 (50 RPM) sufficient. |
| **100-1,000 users** | Enable prompt caching (5x Claude throughput). Add Redis/Memorystore for session caching. Optimize Firestore queries (add composite indexes). Upgrade Claude API to Tier 2 (1000 RPM). Monitor Cloud Function cold starts. |
| **1,000-10,000 users** | Separate heavy workloads to Cloud Run (better cold start control). Implement queue-based rate limiting for Claude API. Use Firestore collection groups for multi-tenant queries. Add monitoring (Firebase Performance, Sentry). Tier 3 Claude API (5000 RPM). |
| **10,000+ users** | Consider regional Firestore instances (EU vs US users). Move to Cloud Run for all long-running tasks (Functions have 9min max). Implement caching layer (Redis) for hot reads. Use BigQuery for analytics (Firestore exports). Advanced AI routing (cheaper models for simple tasks, Claude for complex). Tier 4 Claude API or enterprise. |

### Scaling Priorities

1. **First bottleneck: Claude API rate limits (Tier 1 = 50 RPM)**
   - **Symptom:** Users see 429 errors, "AI is slow" complaints.
   - **Fix:** Enable prompt caching (instant 5x increase). Implement queue with exponential backoff. Cache common responses (Firestore or Redis). Upgrade to Tier 2.

2. **Second bottleneck: Firestore read costs (hot collections)**
   - **Symptom:** High Firebase bill, slow queries on `listings` collection.
   - **Fix:** Add composite indexes for common queries. Denormalize frequently accessed data (store user name in listing doc, not just userId). Cache top 100 listings in Redis with 5min TTL. Use Firestore bundle for initial page load.

3. **Third bottleneck: Cold starts (Cloud Functions)**
   - **Symptom:** First request after idle is slow (2-3s).
   - **Fix:** Keep functions warm with scheduled pings (every 5 min). Migrate critical paths to Cloud Run (always-on instances). Use minimum instances (costs $, but eliminates cold starts).

4. **Fourth bottleneck: Scraping rate limits (platform blocks)**
   - **Symptom:** sahibinden/hepsiemlak returns 429/CAPTCHA.
   - **Fix:** Implement exponential backoff. Rotate IPs (Bright Data, ScrapingBee). Reduce scrape frequency (hourly → daily for stable listings). Respect robots.txt, use official APIs where available.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Claude API** | REST API with streaming SSE | Use prompt caching, handle 429 with exponential backoff + jitter. Monitor usage in Console. |
| **Telegram Bot API** | Webhook (POST from Telegram) | Verify signature (`X-Telegram-Bot-Api-Secret-Token`). Respond within 60s or use queue. |
| **sahibinden.com** | Web scraping (no public API) | Puppeteer for JS-heavy pages, Cheerio for static HTML. Respect rate limits (1 req/sec). |
| **hepsiemlak.com** | Web scraping (no public API) | Similar to sahibinden. May have API (check docs). |
| **emlakjet.com** | Web scraping (no public API) | Similar pattern. Monitor for anti-bot measures. |
| **Firebase Services** | Official SDKs (JS for client, Admin for server) | Never bundle Admin SDK client-side. Use security rules strictly. |
| **Vercel (hosting)** | Next.js deployment, automatic | API route timeout: 10s hobby, 60s pro. Use streaming responses for long tasks. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Web App ↔ API Routes** | HTTP (fetch) | Auth via Firebase ID token in `Authorization: Bearer <token>` header. |
| **API Routes ↔ Cloud Functions** | Firestore triggers (event-driven) | API enqueues job in Firestore, Function reacts to `onCreate` event. |
| **AI Orchestrator ↔ Subagents** | Function calls (in-process) | Pass context explicitly. Subagents are stateless; orchestrator manages state. |
| **Client ↔ Firestore** | Real-time listeners (`onSnapshot`) | For live updates (new listings, job status). Unsubscribe on unmount to avoid memory leaks. |
| **Telegram Bot ↔ Orchestrator** | Shared lib (`lib/agents/orchestrator.ts`) | Webhook handler imports orchestrator, calls `orchestrate()`, sends response via Bot API. |
| **Functions ↔ External APIs** | REST/GraphQL (axios, fetch) | Implement retry logic, timeout (30s), error handling. Log failures to Firestore for debugging. |

## Build Order Implications

Based on dependencies between components, recommended build order:

### Phase 1: Foundation (No AI Yet)
1. **Firebase setup** (Auth, Firestore, Storage, rules)
2. **Next.js app skeleton** (App Router, layouts, basic pages)
3. **Auth flow** (login, signup, session management)
4. **Listing CRUD** (create, read, update, delete—manual, no AI)

**Why first:** All other features depend on auth and data access. Proves Firebase + Next.js integration works.

### Phase 2: AI Integration (Core Value)
1. **Claude API client** (`lib/claude/client.ts`)
2. **Simple text generation** (listing description from property data)
3. **Chat interface** (UI + API route)
4. **Orchestrator (basic)** (single agent, no routing yet)

**Why second:** Core value prop is AI. Get working end-to-end (user input → Claude → response) ASAP.

### Phase 3: Background Processing
1. **Cloud Functions setup** (local emulator, deploy pipeline)
2. **Job queue pattern** (Firestore `jobs` collection)
3. **Image processing function** (upload → optimize → store)
4. **Text generation function** (move from API route to Function for long tasks)

**Why third:** As AI tasks get complex (multiple Claude calls, image processing), API route timeout becomes blocker. Need async processing.

### Phase 4: Web Scraping
1. **Scraper base class** (`lib/scrapers/base.ts`)
2. **Platform-specific scrapers** (sahibinden, hepsiemlak, emlakjet)
3. **Scraping worker function** (queue consumer)
4. **Scheduler function** (cron trigger for periodic scraping)

**Why fourth:** High complexity (anti-bot measures, parsing HTML, rate limits). Requires queue pattern from Phase 3. Not critical for MVP.

### Phase 5: Multi-Channel (Telegram Bot)
1. **Telegram bot setup** (Bot API token, webhook)
2. **Webhook endpoint** (`/api/telegram`)
3. **Command parser** (text → structured command)
4. **Bot ↔ Orchestrator integration** (reuse existing agents)

**Why fifth:** Extends existing orchestrator. Proves multi-channel architecture works. High value for agents (mobile-first).

### Phase 6: PWA Offline Support
1. **Service worker** (`public/sw.js`)
2. **Offline caching strategy** (cache-first for static, network-first for API)
3. **IndexedDB sync queue** (queue mutations when offline)
4. **Background sync** (sync queue when online)

**Why sixth:** Complex, requires solid understanding of caching/state management. Not critical for web users. High value for mobile (flaky connections).

### Phase 7: Platform Integrations
1. **Integration API clients** (sahibinden API, hepsiemlak API—if available)
2. **Bi-directional sync** (our listings → platform, platform listings → ours)
3. **Webhook handlers** (platform → our system events)
4. **Conflict resolution** (our data vs platform data diverges)

**Why last:** Requires official APIs (may not exist → fallback to scraping). Complex state management. Nice-to-have, not critical.

## Sources

**AI Architecture & Patterns:**
- [CloudZero: AI-Native SaaS Architecture](https://www.cloudzero.com/blog/ai-native-saas-architecture/)
- [Orbix: 10 AI-Driven UX Patterns Transforming SaaS in 2026](https://www.orbix.studio/blogs/ai-driven-ux-patterns-saas-2026)
- [Microsoft: AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [Toward AI: Agentic Design Patterns for Production AI](https://pub.towardsai.net/architects-guide-to-agentic-design-patterns-the-next-10-patterns-for-production-ai-9ed0b0f5a5c3)
- [Lindy: Complete Guide to AI Agent Architecture 2026](https://www.lindy.ai/blog/ai-agent-architecture)

**Next.js + Firebase:**
- [Firebase: Integrate Next.js (Official)](https://firebase.google.com/docs/hosting/frameworks/nextjs)
- [Medium: Firebase in 2026 - Advanced Features & Patterns](https://medium.com/@alisha00/firebase-in-2026-advanced-features-patterns-and-best-practices-for-scalable-apps-c0cbf084e6a4)
- [Medium: Firebase 2026 Complete Advanced Guide](https://medium.com/@ramankumawat119/firebase-2026-the-complete-advanced-guide-for-modern-app-developers-7d24891010c7)
- [Firebase: Cloud Functions Official Docs](https://firebase.google.com/docs/functions)

**Multi-Tenant & SaaS Architecture:**
- [Microsoft: Multi-tenant AI/ML Architectural Approaches](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/approaches/ai-machine-learning)
- [Brim Labs: Scalable Multi-Tenant Architectures for AI-Enabled SaaS](https://brimlabs.ai/blog/how-to-build-scalable-multi-tenant-architectures-for-ai-enabled-saas/)
- [ClickIT: Multi-tenant SaaS Architecture on AWS 2026](https://www.clickittech.com/software-development/multi-tenant-architecture/)

**Serverless & Event-Driven:**
- [AWS: Serverless Architecture for Web Scraping](https://aws.amazon.com/blogs/architecture/serverless-architecture-for-a-web-scraping-solution/)
- [Solace: Event-Driven Architecture Patterns](https://solace.com/event-driven-architecture-patterns/)
- [OneUpTime: SQS for Event-Driven Architecture 2026](https://oneuptime.com/blog/post/2026-02-02-sqs-event-driven/view)

**PWA & Offline-First:**
- [Fishtank: Building Native-Like Offline Experience in Next.js PWAs](https://www.getfishtank.com/insights/building-native-like-offline-experience-in-nextjs-pwas)
- [LogRocket: Build Next.js 16 PWA with True Offline Support](https://blog.logrocket.com/nextjs-16-pwa-offline-support/)
- [Next.js: Official PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)

**Claude API Integration:**
- [Anthropic: Claude API Rate Limits (Official)](https://docs.claude.com/en/api/rate-limits)
- [HashBuilds: Claude API Rate Limits Production Scaling](https://www.hashbuilds.com/articles/claude-api-rate-limits-production-scaling-guide-for-saas)
- [AI Free API: Claude API Quota Tiers 2026](https://www.aifreeapi.com/en/posts/claude-api-quota-tiers-limits)

**Telegram Bot:**
- [Medium: Architecting Highly Scalable Serverless Telegram Bots](https://medium.com/@erdavtyan/architecting-highly-scalable-serverless-telegram-bots-5da2bb8fab61)
- [Medium: Production-Ready Telegram Bot with AI on Cloudflare Workers](https://medium.com/@michael.rhema/building-a-production-ready-telegram-bot-with-ai-agent-integration-on-cloudflare-workers-0b40543398fb)

**Real Estate SaaS:**
- [Apriorit: How to Build SaaS for Real Estate](https://www.apriorit.com/dev-blog/767-web-saas-for-real-estate)
- [SolGuruz: Real Estate SaaS Development 2026 Guide](https://solguruz.com/blog/real-estate-saas-development/)
- [Richestsoft: SaaS Platform Architecture Components](https://richestsoft.com/blog/saas-platform-architecture/)

---
*Architecture research for: AI-powered Real Estate SaaS (Multi-channel)*
*Researched: 2026-02-19*
*Confidence: HIGH (verified with official docs, recent 2026 sources, and architectural best practices)*
