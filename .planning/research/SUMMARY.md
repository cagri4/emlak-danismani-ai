# Project Research Summary

**Project:** AI-Powered Real Estate Agent SaaS (Turkish Market)
**Domain:** Real Estate CRM with AI-First Architecture
**Researched:** 2026-02-19
**Confidence:** HIGH

## Executive Summary

This is an AI-first real estate CRM SaaS targeting Turkish real estate agents who currently use manual workflows (Excel spreadsheets, portal copy-paste, WhatsApp communication). The recommended approach builds a multi-channel system (web, mobile PWA, Telegram bot) with natural language as the primary interface, backed by Next.js + Firebase + Claude API. The core differentiator is conversational AI that lets agents say "Add 3+1 apartment Ankara Çankaya 2M TL" instead of filling 15 form fields—this transforms data entry from a chore into a conversation.

The architecture follows a subagents pattern: an AI orchestrator classifies user intent and routes commands to specialized agents (listing management, scraping, customer matching). This prevents monolithic prompt complexity while maintaining conversational UX across all channels. Critical dependencies include: Firebase regional data storage (KVKK compliance), prompt caching architecture (90% cost reduction), and anti-bot scraping infrastructure (residential proxies, rate limiting, human behavior mimicry) from day one—these cannot be retrofitted.

Key risks center on Turkish market specifics: sahibinden.com/hepsiemlak scraping breaks easily without proper anti-detection, Claude API costs explode without caching, Turkish language quality requires validation with native speakers, and KVKK compliance demands VERBIS registration before processing any personal data. Mitigation strategy: build these safeguards into Phase 1 foundation, not as later optimizations.

## Key Findings

### Recommended Stack

**Core: Next.js 16 + React 19 + TypeScript + Firebase + Claude Sonnet 4.6**

This stack optimizes for rapid development of AI-first features while meeting project constraints (Firebase/Vercel requirements). Next.js 16 provides SSR for SEO-critical property listings, API routes for backend logic, and edge functions for low-latency AI streaming. Firebase delivers zero-config backend (Auth, Firestore NoSQL, Storage, Cloud Functions) with Turkish-compatible regional deployment (europe-west1).

**Core technologies:**
- **Next.js 16 + React 19**: Full-stack framework with SSR, App Router, built-in API routes—industry standard for SaaS with 10x faster Turbopack bundler
- **Firebase (Firestore, Auth, Storage, Functions)**: BaaS meeting project requirements—handles auth, database, files, background jobs with europe-west1 regional support for KVKK
- **Claude Sonnet 4.6 (Anthropic)**: Best Turkish language performance of any LLM, 200K context fits entire portfolios, streaming for real-time chat UX
- **Vercel**: Zero-config Next.js hosting with edge functions for AI, global CDN, European edge locations (Frankfurt) for Turkish user latency
- **Zustand**: Minimal state management (30% YoY growth), better DX than Redux, handles AI chat state and property filters
- **Telegraf 4.16.3**: Node.js Telegram bot framework—TypeScript-first, middleware architecture, webhook support for Vercel Edge Functions
- **Puppeteer 24 + Cheerio 1.2**: Web scraping for sahibinden/hepsiemlak—headless browser for JS-rendered sites, HTML parser for static content
- **Tailwind CSS 4.2 + shadcn/ui**: Rapid UI development with utility classes, accessible components, RTL support for Turkish
- **Sharp 0.34.5**: Server-side image optimization (libvips-based), fastest Node.js library for batch photo processing
- **next-pwa 5.6**: PWA transformation with offline support, service worker caching, push notifications for mobile-first agents

**Version notes:**
- Next.js 16.1.6 requires React 19.2.4 (concurrent features dependency)
- Firebase 12.9.0 requires Node.js 18+ (Vercel uses Node 20)
- Puppeteer 24 needs Firebase Cloud Functions Gen 2 with 4GB RAM
- next-pwa 5.6 compatibility with Next.js 16 needs verification (may require @ducanh2912/next-pwa community fork)

### Expected Features

**Must have (table stakes):**
- **Property Listing Management**: Multi-photo upload, property details (type, price, location, features), status workflow (available/pending/sold)—without this, no product exists
- **Customer/Lead Database**: Contact management, property preferences, interaction history—CRM is non-negotiable for agents
- **Multi-Portal Integration (Read)**: Import from sahibinden.com, hepsiemlak, emlakjet—agents already have listings there, re-entry is adoption blocker
- **Mobile Access (PWA)**: Agents work in field showing properties—view properties, quick status updates, photo capture, offline capability
- **Property-Customer Matching**: Find properties matching buyer criteria automatically—saves 15+ minutes of manual database searching
- **WhatsApp Sharing**: Share property cards to WhatsApp with photos/details—primary communication channel in Turkey (cultural requirement)

**Should have (competitive differentiators):**
- **Natural Language AI Interface**: "Add property: 3+1 apt Çankaya 2M TL" vs clicking through forms—CORE VALUE PROPOSITION defining product
- **AI-Generated Property Descriptions**: Turkish language quality descriptions from property attributes—saves 10-15 minutes per listing
- **Telegram Bot Interface**: Quick property updates, notifications, commands on-the-go—Turkish users love Telegram, mobile-first
- **Automated Portfolio Scraping**: Import competitor listings automatically—saves hours of manual copy-paste weekly
- **Intelligent Lead Scoring**: AI identifies hot leads vs tire-kickers—90% of leads don't convert, prioritize effectively
- **AI Photo Enhancement**: HDR, brightness, perspective correction—professional photos sell 32% faster
- **Smart Property Valuation**: AI suggests market price from comparables—pricing assistance for agents

**Defer (v2+):**
- **Voice Commands (Turkish)**: Advanced NLP requiring proven text interface first—high complexity, defer until core AI solid
- **Advanced Analytics Dashboard**: Agents need simple metrics, not data science—focus on 5-10 key metrics initially
- **Team/Agency Features**: Multi-tenant, lead distribution, manager dashboards—start with solo agents, expand when PMF proven
- **Transaction Management**: Legal compliance, bank/notary integrations—scope creep, focus on pre-transaction (listing, matching)

### Architecture Approach

**Multi-channel unified API with AI agent orchestration.** Single Next.js backend serves web, PWA, and Telegram bot with identical business logic. AI orchestrator classifies user intent (via Claude) and routes to specialized subagents: scraping agent (portfolio import), listing agent (CRUD operations), chat agent (customer queries). This prevents monolithic prompts while maintaining conversational UX. Long-running tasks (scraping, image processing) use event-driven queue pattern: API route enqueues job in Firestore, Cloud Function consumes asynchronously, client subscribes to real-time status updates.

**Major components:**
1. **Client Layer (Multi-Channel)**: Web app (Next.js React), PWA (offline-first with service worker), Telegram bot (webhook endpoint)—all consume same API
2. **API Gateway**: Next.js API routes with Firebase Auth middleware, rate limiting, tenant ID validation—single entry point for all clients
3. **AI Orchestrator**: Intent classification (Claude) → route to subagents → response synthesis—maintains conversation context in Firestore
4. **Service Layer (Cloud Functions)**: Scraping service (queue + worker pool), image service (upload/optimize/storage), text service (AI generation), integration service (platform sync)
5. **Data Layer (Firebase)**: Firestore (users, listings, conversations, jobs), Storage (property images), Auth (sessions, multi-tenant)—NoSQL fits property documents well
6. **External Services**: Claude API (text generation with prompt caching), Turkish RE platforms (sahibinden/hepsiemlak/emlakjet), Telegram API (bot delivery)

**Key patterns:**
- **Prompt Caching**: Mark system prompts, examples, Turkish instructions as cacheable—90% cost reduction, 5x effective throughput increase
- **Queue + Worker**: Long tasks (scraping, Claude API batches) enqueued in Firestore, consumed by Cloud Functions—prevents API route timeouts
- **Offline-First PWA**: Service worker caches data, queues mutations in IndexedDB, syncs when online—field agents need offline access
- **Subagents Orchestration**: Orchestrator classifies intent, specialized agents handle execution—prevents prompt bloat, enables independent testing

### Critical Pitfalls

1. **Turkish Platform Anti-Bot Detection Breaking Production**: sahibinden.com/hepsiemlak deploy sophisticated anti-bot systems (Cloudflare ML, DataDome behavioral analysis) that block scrapers. **Prevention**: Use fortified headless browsers (Camoufox), residential proxy rotation, 2-5 req/min rate limiting, mimic human behavior (randomize scroll/clicks), exponential backoff retries from day one. Commercial scraping APIs (ScraperAPI, ZenRows) as fallback. Address in Phase 1—anti-detection is foundational, cannot retrofit.

2. **Claude API Cost Explosion Without Prompt Caching**: Costs spiral to $3,650+/month when generating property descriptions without caching. Crossing 200K tokens doubles input costs from $3 to $6 per request. **Prevention**: Implement prompt caching from day one (mark style guidelines, examples, Turkish instructions as cacheable), monitor token usage real-time, keep inputs under 200K when possible, plan tier upgrade path (Tier 1 $5 → Tier 4 $400 for 80x higher limits). Address in Phase 1—caching architecture impossible to retrofit.

3. **Turkish Language AI Quality Below Standards**: Turkish's agglutinative morphology causes AI to produce unnatural text that signals "machine-written." Most LLMs tokenize Turkish inefficiently. **Prevention**: Test Claude API specifically with Turkish real estate text generation before committing, compare outputs from Turkish-optimized models (gemma2-9b-it, Kumru AI), build evaluation dataset of 50-100 real Turkish listings, implement human-in-the-loop review for first 200 generations, have Turkish-speaking QA tester from day one. Address in Phase 1—quality is make-or-break.

4. **Firebase + Vercel Serverless Cold Starts Killing UX**: First visits take 5-10 seconds to load, API responses 1-3 seconds minimum—agents assume site is broken. Next.js 13.4.12+ has memory issues causing OOM crashes. **Prevention**: Keep Cloud Functions lightweight, use scheduled functions to "keep warm" (invoke every 5 minutes), test with Next.js 13.4.12 (stable version), allocate 1GiB+ memory, implement optimistic UI updates, pre-render with ISR, measure P95 latency (<2s target). Address in Phase 1—performance architecture must be correct from start.

5. **KVKK Compliance Violations Causing Massive Fines**: Turkish Data Protection Authority levies fines of 341,809₺ to 17,092,242₺ ($12K-$615K) for violations. KVKK has specific requirements beyond GDPR: VERBIS registration, 72-hour breach notification, stricter cross-border data transfer rules. **Prevention**: Register with VERBIS before processing personal data, obtain explicit granular consent, configure Firebase europe-west1 regional deployment, implement SCCs for US-stored data, build 72-hour breach notification system, conduct DPIA, consult Turkish data protection lawyer. Address in Phase 1—compliance must be built in from day one.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & AI Core (MVP)
**Rationale:** All other features depend on auth, data access, and working AI integration. Must prove Firebase + Next.js works, then demonstrate core value prop (AI-first interface) ASAP before building complexity. Critical compliance (KVKK) and cost optimization (prompt caching) cannot be retrofitted—must be foundational.

**Delivers:**
- Working auth and data access (Firebase Auth + Firestore + Storage)
- Basic property and customer CRUD (manual, no AI yet)
- Claude API integration with prompt caching architecture
- Simple AI text generation (listing descriptions from property data)
- Chat interface with basic orchestrator (single agent, no routing yet)
- KVKK compliance infrastructure (VERBIS registration, consent management, regional data storage)

**Addresses (from FEATURES.md):**
- Property Listing Management (table stakes)
- Customer/Lead Database (table stakes)
- Natural Language AI Interface (limited scope—core differentiator)

**Avoids (from PITFALLS.md):**
- Pitfall #2: Claude API cost explosion—prompt caching from day one
- Pitfall #3: Turkish language quality—validate with native speakers in this phase
- Pitfall #4: Firebase cold starts—performance architecture correct from start
- Pitfall #8: KVKK violations—compliance built in foundationally

**Research flags:**
- **Skip research-phase**: Auth, basic CRUD, Firestore integration are well-documented patterns
- **May need research**: Turkish data protection lawyer consultation for KVKK specifics, Claude API Turkish quality validation

### Phase 2: Background Processing & Scraping
**Rationale:** As AI tasks get complex (multiple Claude calls, image processing), API route timeout becomes blocker. Need async processing before building scraping (inherently long-running). Scraping is high complexity (anti-bot, parsing, rate limits) but not critical for initial MVP—agents can manually enter properties if scraping not ready.

**Delivers:**
- Cloud Functions setup (local emulator, deploy pipeline)
- Job queue pattern (Firestore `jobs` collection with worker consumers)
- Image processing function (upload → Sharp optimization → Storage)
- Text generation function (move from API route to Cloud Function for batches)
- Scraper base class with anti-bot architecture
- Platform-specific scrapers (sahibinden, hepsiemlak, emlakjet)
- Scraping worker function (queue consumer with rate limiting)

**Uses (from STACK.md):**
- Firebase Cloud Functions Gen 2 (4GB RAM for Puppeteer)
- Puppeteer 24 (headless browser with Camoufox fortification)
- Cheerio 1.2 (HTML parsing)
- Sharp 0.34.5 (image optimization)
- Residential proxies (anti-bot requirement)

**Implements (from ARCHITECTURE.md):**
- Queue + Worker pattern (event-driven background processing)
- Scraping Service component
- Image Service component

**Avoids (from PITFALLS.md):**
- Pitfall #1: Anti-bot detection—build fortified scraping from start with residential proxies, rate limiting, human behavior mimicry
- Pitfall #4: API route timeouts—async processing via Cloud Functions

**Research flags:**
- **Needs research**: sahibinden.com/hepsiemlak specific anti-bot measures, residential proxy providers for Turkey, Camoufox setup
- **Standard patterns**: Cloud Functions setup, job queue implementation

### Phase 3: Multi-Channel Foundation (Telegram Bot)
**Rationale:** Extends existing orchestrator to prove multi-channel architecture works. High value for agents (mobile-first, Telegram popular in Turkey). Requires queue pattern from Phase 2 (webhook timeout handling). Validates that AI orchestrator can route commands from multiple sources without context mixing.

**Delivers:**
- Telegram bot setup (Bot API token, webhook)
- Webhook endpoint (`/api/telegram` with signature verification)
- Command parser (text → structured command)
- Bot ↔ Orchestrator integration (reuse existing agents)
- Channel-aware message routing (session IDs per channel)
- Idempotency keys (prevent duplicate message processing)
- Rate limiting (30 msg/s global, 1/s per chat for Telegram compliance)

**Uses (from STACK.md):**
- Telegraf 4.16.3 (Telegram bot framework)
- Vercel Edge Functions (webhook endpoint)
- Firestore (cross-channel state synchronization)

**Implements (from ARCHITECTURE.md):**
- Telegram Bot component
- Multi-channel unified API pattern
- Channel-aware routing in AI orchestrator

**Avoids (from PITFALLS.md):**
- Pitfall #5: Multi-channel message chaos—async webhook processing, idempotency keys, per-user session isolation
- Telegram rate limit violations—implement queuing from start

**Research flags:**
- **May need research**: Telegram Bot API rate limit specifics, webhook timeout best practices
- **Standard patterns**: Telegraf setup, webhook signature verification

### Phase 4: Property-Customer Matching & Mobile PWA
**Rationale:** Core time-saving feature (matching) can now leverage full architecture (AI orchestrator, background jobs, multi-channel). PWA requires solid understanding of caching/state management—build after core features stable. Both are high-value for agents but complex.

**Delivers:**
- Property-customer matching algorithm (location, budget, type, features)
- Match scoring with AI explanations (Claude API)
- Auto-notification when new property matches customer
- Service worker (offline caching strategies)
- IndexedDB sync queue (queue mutations when offline)
- Background sync (sync queue when online)
- PWA manifest (installable, add-to-homescreen)

**Uses (from STACK.md):**
- next-pwa 5.6 (PWA transformation)
- Workbox (service worker toolkit)
- Zustand persistence middleware (offline state)

**Implements (from ARCHITECTURE.md):**
- PWA Layer component
- Offline-first pattern with sync queue

**Avoids (from PITFALLS.md):**
- Poor offline UX for rural property visits—offline-first architecture
- Non-technical users abandoning features—progressive disclosure, in-app tooltips

**Research flags:**
- **May need research**: PWA offline sync conflict resolution, next-pwa compatibility with Next.js 16
- **Standard patterns**: Service worker caching strategies

### Phase 5: Multi-Portal Publishing & AI Enhancements
**Rationale:** After scraping (read) works in Phase 2, add publishing (write). Complex state management (our data vs platform data divergence). AI enhancements (photo editing, descriptions) are valuable but non-critical—add when core solid. Legal guardrails for photo editing required.

**Delivers:**
- Multi-portal publishing (write to sahibinden/hepsiemlak/emlakjet)
- Bi-directional sync (platform → our system, our system → platform)
- Webhook handlers (platform events → our system)
- Conflict resolution (data divergence handling)
- AI-generated property descriptions (Turkish quality validated)
- Basic photo enhancement (brightness, contrast, straightening ONLY)
- Photo editing legal guardrails (disclosure labels, original storage, audit trail)

**Implements (from ARCHITECTURE.md):**
- Integration Service component (platform sync)

**Avoids (from PITFALLS.md):**
- Pitfall #6: AI photo editing legal liability—strict guardrails, no object removal/structural changes, mandatory disclosure, consult Turkish advertising law

**Research flags:**
- **Needs research**: Turkish advertising law for property photos, platform API documentation (if available), AI photo enhancement legal compliance
- **Standard patterns**: Webhook handling, conflict resolution

### Phase 6: Advanced Features & Polish
**Rationale:** Product-market fit proven, core features solid. Add nice-to-haves: intelligent lead scoring (needs usage data from earlier phases), smart valuation (market data integration), advanced analytics (simple metrics sufficient earlier).

**Delivers:**
- Intelligent lead scoring (behavioral analysis, engagement tracking)
- Smart property valuation (comparable sales, ML pricing model)
- Advanced analytics dashboard (beyond basic metrics)
- Automated listing translation (Turkish → English/Russian for foreign buyers)
- Performance optimization (Redis caching, query optimization)
- Monitoring & observability (Sentry, Firebase Performance)

**Research flags:**
- **May need research**: Turkish real estate market data sources for valuation, lead scoring ML models
- **Standard patterns**: Analytics dashboards, caching strategies

### Phase Ordering Rationale

**Dependencies drive order:**
1. **Phase 1 first**: All features depend on auth, data access, and AI integration—must be foundational
2. **Phase 2 before Phase 5**: Read (scraping) before write (publishing)—understand platform data structure first
3. **Phase 2 before Phase 3**: Background processing needed for Telegram webhook timeout handling
4. **Phase 3 before Phase 4**: Multi-channel architecture proven before complex PWA offline sync
5. **Phase 1-4 before Phase 5**: AI enhancements and publishing require stable core

**Avoids pitfalls:**
- Compliance (KVKK), cost optimization (caching), performance (cold starts) built in Phase 1—cannot retrofit
- Anti-bot scraping infrastructure in Phase 2—foundational for all scraping
- Multi-channel complexity handled in Phase 3 before PWA offline complexity in Phase 4
- Legal guardrails for photo editing in Phase 5 before launching feature

**Groupings match architecture:**
- Phase 1: Client Layer + API Gateway + basic AI Orchestrator
- Phase 2: Service Layer (scraping, images, text)
- Phase 3: Multi-channel Client Layer expansion
- Phase 4: Enhanced Client Layer (PWA) + matching logic
- Phase 5: Integration Service + AI enhancements
- Phase 6: Advanced features + optimization

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 1**: KVKK compliance specifics (Turkish lawyer consultation), Claude API Turkish quality validation
- **Phase 2**: sahibinden.com/hepsiemlak anti-bot measures, residential proxy providers, Camoufox configuration
- **Phase 3**: Telegram Bot API rate limit edge cases, webhook timeout handling patterns
- **Phase 5**: Turkish advertising law for property photos, platform API documentation (may not exist)

**Phases with standard patterns (skip research-phase):**
- **Phase 1**: Firebase Auth, Firestore CRUD, Next.js API routes—well-documented
- **Phase 2**: Cloud Functions setup, job queue pattern—established patterns
- **Phase 3**: Telegraf bot setup—good documentation
- **Phase 4**: Service worker caching, PWA manifest—standard patterns
- **Phase 6**: Analytics, monitoring, caching—mature ecosystem

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified via npm registry and official docs. Version compatibility confirmed (Next.js 16 requires React 19). next-pwa compatibility with Next.js 16 needs testing (may require community fork). |
| Features | MEDIUM-HIGH | Global real estate CRM features well-documented (HIGH). Turkish market specifics (WhatsApp, Telegram, portal integrations) based on portal analysis and local competitor research (MEDIUM). AI capabilities based on 2026 industry trends (MEDIUM-HIGH). |
| Architecture | HIGH | Multi-channel patterns, AI orchestration, serverless event-driven architecture verified with official Microsoft/Firebase/Anthropic docs and recent 2026 sources. Subagents pattern confirmed in multiple AI architecture sources. |
| Pitfalls | MEDIUM-HIGH | Anti-bot detection, Claude API cost/limits, Firebase cold starts verified with 2026 sources and GitHub issue threads (HIGH). Turkish language NLP challenges based on academic research (MEDIUM-HIGH). KVKK compliance verified with Turkish legal sources (HIGH). AI photo editing legal issues based on California AB 723 and emerging patterns (MEDIUM—Turkish law specifics need lawyer verification). |

**Overall confidence:** HIGH

Research is comprehensive with official sources for technical stack, multiple real-world examples for architecture patterns, and 2026-specific sources for emerging technologies (Claude Sonnet 4.6, Next.js 16, React 19). Turkish market specifics have medium confidence due to limited English-language sources but cross-verified across multiple Turkish platforms.

### Gaps to Address

**Turkish market specifics:**
- **sahibinden.com/hepsiemlak official API availability**: Research shows scraping is required, but official APIs may exist—contact platforms directly during Phase 2 planning
- **KVKK compliance verification**: High-level requirements identified but Turkish data protection lawyer consultation required before processing personal data (Phase 1)
- **Turkish advertising law for AI-edited photos**: California AB 723 (Jan 2026) creates precedent, but Turkish law specifics unclear—legal consultation required (Phase 5)

**Technical validation needed:**
- **next-pwa compatibility with Next.js 16**: GitHub issues suggest community fork @ducanh2912/next-pwa may be required—test in Phase 1
- **Claude Sonnet 4.6 Turkish language quality**: Research indicates Claude outperforms GPT-4 on Turkish, but validate with real estate text generation test before committing (Phase 1)
- **Firebase europe-west1 latency to Turkey**: Closest region is Belgium—validate latency acceptable for real-time features (Phase 1)

**Architecture decisions to validate:**
- **Firebase vs Postgres for complex queries**: Firestore meets project requirements, but Postgres would be better for relational analytics—consider migration path post-PMF if hitting Firestore query limits
- **Residential proxy provider for Turkish sites**: Multiple providers exist (Bright Data, ScrapingBee)—evaluate cost/reliability in Phase 2

**How to handle:**
- Phase 1: Test Firebase latency, validate Claude Turkish quality, confirm next-pwa fork if needed, consult Turkish lawyer for KVKK
- Phase 2: Contact sahibinden/hepsiemlak for API access, select residential proxy provider, test anti-bot measures
- Phase 5: Consult Turkish advertising lawyer for photo editing legal compliance
- Post-PMF: Evaluate Firestore → Postgres migration if analytics needs exceed NoSQL capabilities

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-15) - Next.js 15/16 features, React 19 requirement
- [Next.js Official Docs](https://nextjs.org/docs) - App Router, API Routes, SSR patterns
- [Firebase Release Notes](https://firebase.google.com/support/release-notes/js) - Version 12.9.0 confirmed
- [Firebase Official Docs](https://firebase.google.com/docs/functions) - Cloud Functions, Firestore, Auth patterns
- [Anthropic Claude API Docs](https://platform.claude.com/docs/en/api/rate-limits) - Rate limits, prompt caching, pricing
- [Anthropic Release Notes](https://platform.claude.com/docs/en/release-notes/overview) - Sonnet 4.6, Opus 4.6 capabilities
- npm registry verification - All package versions confirmed via `npm view`

**Architecture & Patterns:**
- [Microsoft: AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) - Subagents pattern
- [CloudZero: AI-Native SaaS Architecture](https://www.cloudzero.com/blog/ai-native-saas-architecture/) - AI-first architectural approaches
- [Firebase: Integrate Next.js](https://firebase.google.com/docs/hosting/frameworks/nextjs) - Official Next.js + Firebase integration guide
- [Anthropic: Claude API Rate Limits](https://docs.claude.com/en/api/rate-limits) - Tier structure, ITPM limits

### Secondary (MEDIUM confidence)

**Real Estate Features & Market:**
- [HousingWire: Best Real Estate CRM 2026](https://www.housingwire.com/articles/best-real-estate-crm/) - Feature landscape
- [Smarter Suite: Real Estate CRM Systems Guide](https://smarterpsuite.com/blog/real-estate-crm-systems-2026-guide/) - CRM patterns
- [Close: 10 Best Real Estate CRMs](https://www.close.com/blog/real-estate-crms) - Competitive analysis
- [LimeUp: Real Estate SaaS Benefits, Types & Costs](https://limeup.io/blog/real-estate-saas/) - SaaS architecture
- Turkish CRM Solutions: RE-OS.com, Emlapp (yapisoft.com), Revy.com.tr - Local competitor analysis

**Technical Implementations:**
- [ZenRows: JavaScript Web Scraping Libraries 2026](https://www.zenrows.com/blog/javascript-nodejs-web-scraping-libraries) - Puppeteer + Cheerio
- [Syncfusion: React State Management Tools 2026](https://www.syncfusion.com/blogs/post/react-state-management-libraries) - Zustand growth trends
- [freeCodeCamp: React Hook Form + Zod Guide](https://www.freecodecamp.org/news/react-form-validation-zod-react-hook-form/) - Form validation patterns
- [Medium: Firebase 2026 Advanced Features](https://medium.com/@alisha00/firebase-in-2026-advanced-features-patterns-and-best-practices-for-scalable-apps-c0cbf084e6a4) - Firebase scaling patterns
- [LogRocket: Next.js 16 PWA with Offline Support](https://blog.logrocket.com/nextjs-16-pwa-offline-support/) - PWA implementation

**Pitfalls & Best Practices:**
- [Medium: Web Scraping 2025 - Bypassing Bot Detection](https://medium.com/@sohail_saifii/web-scraping-in-2025-bypassing-modern-bot-detection-fcab286b117d) - Anti-bot strategies
- [ZenRows: Bypass Bot Detection Methods](https://www.zenrows.com/blog/bypass-bot-detection) - Scraping best practices
- [HashBuilds: Claude API Rate Limits Production Scaling](https://www.hashbuilds.com/articles/claude-api-rate-limits-production-scaling-guide-for-saas) - Cost optimization
- [Northflank: Claude Rate Limits & Pricing](https://northflank.com/blog/claude-rate-limits-claude-code-pricing-cost) - Prompt caching benefits
- [GitHub Issue: NextJS Cloud Functions Latency](https://github.com/firebase/firebase-tools/issues/6349) - Next.js 13.4.12+ memory issues
- [GitHub Discussion: Firebase Functions for Next.js](https://github.com/vercel/next.js/discussions/11848) - Performance considerations

**Turkish Language & Market:**
- [ScienceDirect: How do LLMs perform on Turkish?](https://www.sciencedirect.com/science/article/abs/pii/S0957417425010437) - Turkish NLP challenges
- [arXiv: TR-MMLU - Turkish NLP Standards](https://arxiv.org/html/2501.00593v2) - Turkish language AI evaluation
- [GitHub: turkish-nlp-resources](https://github.com/agmmnn/turkish-nlp-resources) - Turkish model landscape
- [Kumru AI](https://kumruai.online/) - Turkish-specific model (300B Turkish tokens)
- Turkish.AI - Turkish language AI initiatives

**Legal & Compliance:**
- [CookieYes: Turkey KVKK Guide](https://www.cookieyes.com/blog/turkey-data-protection-law-kvkk/) - KVKK compliance overview
- [Cookie-Script: KVKK Compliance Guide](https://cookie-script.com/guides/practical-guide-to-kvkk-compliance) - Practical implementation
- [SearchInform: KVKK 2026 Updates](https://searchinform.com/blog/2026/1/28/kvkk-2026-updates-what-turkish-businesses-must-know/) - Recent amendments
- [AZKAN GROUP: Turkey 2026 KVKK Fines](https://www.azkangroup.com/turkeys-2026-kvkk-administrative-fines) - Fine structure
- [Barnes Walker: California AI Photo Legal Compliance 2026](https://barneswalker.com/starting-january-1-2026-california-turns-ai-edited-listing-photos-into-a-legal-compliance-issue-not-just-an-mls-issue-is-florida-next/) - AB 723 precedent

### Tertiary (LOW confidence - needs validation)

- **sahibinden.com scraping**: No official API confirmed, community GitHub repos exist (github.com/anilken/scraper) but legal/TOS unclear—validate with platform contact and Turkish legal team
- **Firebase vs Postgres for SaaS**: General consensus that Postgres better for relational data, but Firebase meets project requirements—consider migration only if hitting limits
- **next-pwa compatibility**: May need @ducanh2912/next-pwa community fork for Next.js 16—test before production
- **Turkish advertising law for AI photos**: California AB 723 creates precedent, but Turkish law specifics need lawyer verification—defer to Phase 5 planning

---
*Research completed: 2026-02-19*
*Ready for roadmap: YES*
