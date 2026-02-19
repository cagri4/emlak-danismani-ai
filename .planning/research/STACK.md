# Technology Stack

**Project:** AI-Powered Real Estate Agent SaaS (Turkey)
**Researched:** 2026-02-19
**Confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16.1.6 | Full-stack React framework | Industry standard for production SaaS. Built-in SSR, API routes, and optimizations. Turbopack bundler (10x faster). Native Vercel deployment. React 19 support with App Router. |
| React | 19.2.4 | UI library | Latest stable version with concurrent features, automatic optimizations via React Compiler (experimental), and improved performance. Required by Next.js 16. |
| TypeScript | ^5.7.x | Type safety | Mandatory for production SaaS. Catches bugs at compile time, improves DX with autocomplete, and ensures type-safe integration with Firebase, Claude API, and domain models. |

### Database & Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Firebase | 12.9.0 | Backend-as-a-Service | Project requirement. Provides Authentication, Firestore (NoSQL database), Cloud Storage (photos), Cloud Functions (background jobs), and Real-time Database. Zero server management. Turkish region support (europe-west1). |
| Firestore | (included) | Primary database | Document-based NoSQL fits real estate domain (properties are self-contained documents). Real-time sync for multi-device access. Automatic scaling. Offline support for mobile. |
| Firebase Authentication | (included) | User auth & sessions | Handles Turkish phone auth (+90), email/password, and social login. Built-in session management. Works seamlessly with Next.js SSR via cookies. |
| Firebase Storage | (included) | Image/file hosting | CDN-backed storage for property photos. Automatic image optimization. Secure upload with size/type validation. Turkish region hosting for low latency. |
| Firebase Cloud Functions | (included) | Background jobs | Serverless functions for portfolio scraping, AI batch processing, scheduled tasks (daily sync), and webhook handling. Scales automatically. |

### Infrastructure & Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | Latest | Hosting & edge functions | Project requirement. Zero-config Next.js deployment. Global CDN. Edge functions for low-latency AI streaming. Built-in preview deployments. Free SSL. European edge locations for Turkish users. |
| Vercel Edge Functions | (included) | AI streaming responses | Run Claude API calls at edge (closer to users). Streaming responses for chat interface. Reduced latency vs. serverless functions. |

### AI & Language Models

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Anthropic SDK | 0.77.0 | Claude API client | Official TypeScript SDK for Claude. Supports streaming, prompt caching (save 90% costs on repeated context), and structured outputs. Latest models: Sonnet 4.6 (fast, cost-effective), Opus 4.6 (complex reasoning), Haiku 4.5 (real-time). |
| Claude Sonnet 4.6 | API | Primary AI model | Best balance of intelligence, speed, and cost for SaaS. Excellent at Turkish language. Handles listing descriptions, customer queries, and natural language commands. 200K context (fits entire property portfolio). |
| LangChain.js | 1.2.25 | AI orchestration (optional) | TypeScript-first framework for complex AI workflows. Use if building multi-step AI agents (e.g., property search with multiple filters). Prompt templates for reusable AI patterns. Can defer if MVP keeps AI simple. |

### UI & Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.2.0 | Utility-first CSS | Industry standard for SaaS. Rapid UI development. Small bundle (tree-shaken). Responsive design out-of-the-box. RTL support for potential Turkish-first design. |
| shadcn/ui | Latest | Component library | Copy-paste React components (not npm dependency). Built on Radix UI (accessible). Tailwind-styled. Customizable. Includes forms, dialogs, tables perfect for real estate SaaS. |
| Radix UI | (via shadcn) | Headless components | Unstyled, accessible primitives. Handles keyboard nav, focus management, ARIA. shadcn/ui wraps these with Tailwind. |
| Lucide React | Latest | Icon library | Lightweight, tree-shakeable icons. Consistent design. 1000+ icons cover real estate needs (home, bed, bath, area, etc.). |

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 5.0.11 | Global state | Minimal boilerplate vs Redux. 30% YoY growth. Excellent TypeScript support. Only re-renders consuming components. Perfect for AI chat state, user preferences, and property filters. Persistence middleware for offline support. |
| React Server Components | (Next.js) | Server state | Default in Next.js App Router. Fetch data on server, reduce client JS. Use for property listings, user profiles. Client components only for interactive UI. |

### Forms & Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Hook Form | 7.71.1 | Form state management | Uncontrolled inputs = minimal re-renders. Excellent performance for multi-field property forms. TypeScript support. Works seamlessly with Zod. |
| Zod | 4.3.6 | Schema validation | TypeScript-first validation. Define schema once, use on client + server (Next.js Server Actions). Type inference eliminates duplicate types. Reusable schemas for property listings, customer data. |
| @hookform/resolvers | Latest | RHF + Zod integration | Bridges React Hook Form with Zod schemas. One-line integration. |

### Web Scraping & Automation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Puppeteer | 24.37.4 | Headless browser automation | Required for sahibinden.com, hepsiemlak scraping (JavaScript-rendered sites). Handles Cloudflare protection with stealth plugins. Screenshot capabilities for portfolio imports. Use in Firebase Cloud Functions. |
| Cheerio | 1.2.0 | HTML parsing | jQuery-like API for parsing scraped HTML. Lightweight, fast. Use for static pages or Puppeteer-rendered HTML. Extract property data from Turkish real estate sites. |
| Axios | 1.13.5 | HTTP client | Pairs with Cheerio for simple requests. Retry logic with exponential backoff. Turkish proxy support. Use when sites don't require JavaScript execution. |

### Image Processing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Sharp | 0.34.5 | Server-side image processing | Fastest Node.js image library (libvips-based). Resize, crop, format conversion, watermarking. Use in Firebase Cloud Functions for batch photo optimization. Automatic orientation correction for mobile uploads. |
| react-image-crop | Latest | Client-side crop UI | Lightweight React component for cropping property photos before upload. Touch-friendly for mobile. Returns crop dimensions for Sharp processing. |

### Mobile & PWA

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| next-pwa | 5.6.0 | PWA support | Transforms Next.js into installable PWA. Service worker generation. Offline support for property viewing. Push notifications for new leads. Add-to-homescreen for Turkish agents (mobile-first users). |
| Workbox | (via next-pwa) | Service worker toolkit | Caching strategies (cache-first for images, network-first for listings). Background sync for offline actions. Precaching for shell UI. |

### Telegram Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Telegraf | 4.16.3 | Telegram bot framework | Most popular Node.js Telegram library. TypeScript-first. Middleware-based architecture. Supports inline keyboards (property browsing), webhooks (Vercel Edge Functions), and file uploads. Active development (2026 updates). |

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| ESLint | Latest | Code linting | Catch bugs, enforce style. Use Next.js config (@next/eslint-config) + TypeScript plugin. |
| Prettier | Latest | Code formatting | Auto-format on save. Integrates with Tailwind (class sorting plugin). |
| Vitest | Latest | Unit testing | Faster than Jest (Vite-powered). Native ESM support. TypeScript out-of-the-box. Test AI prompts, scraping logic, utilities. |
| Playwright | Latest | E2E testing | Multi-browser testing. Auto-wait (no flaky tests). Record videos of failures. Test critical flows (property creation, AI chat). |

## Installation

```bash
# Initialize Next.js with TypeScript
npx create-next-app@latest emlak-ai --typescript --tailwind --app --use-npm

cd emlak-ai

# Core dependencies
npm install firebase @anthropic-ai/sdk zustand react-hook-form zod @hookform/resolvers

# Scraping & automation
npm install puppeteer cheerio axios

# Image processing
npm install sharp react-image-crop

# Telegram bot
npm install telegraf

# PWA
npm install next-pwa

# UI components (shadcn)
npx shadcn@latest init
npx shadcn@latest add button input form dialog table

# Dev dependencies
npm install -D @types/node eslint prettier vitest @vitejs/plugin-react playwright @playwright/test
npm install -D eslint-config-prettier prettier-plugin-tailwindcss
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Database | Firebase Firestore | PostgreSQL (Supabase) | Project constraint specifies Firebase. However, Postgres would be better for complex relational queries (property relationships, analytics). Consider migration later if hitting Firestore query limits. |
| State Management | Zustand | Redux Toolkit | Zustand has less boilerplate, better DX. Redux adds complexity for no benefit in this project. Use Zustand unless team strongly prefers Redux. |
| Scraping | Puppeteer | Playwright | Both are excellent. Puppeteer has more Turkish real estate scraping examples (GitHub repos for sahibinden.com). Playwright has better multi-browser support but overkill for server-side scraping. |
| Image Processing | Sharp | Jimp | Sharp is 5-10x faster (native libvips vs pure JS). Essential for batch processing 100+ property photos. |
| AI SDK | Anthropic SDK | LangChain | Use native SDK for simplicity. Add LangChain only if building complex multi-step agents (e.g., AI property search with memory). |
| Form Validation | Zod | Yup | Zod is TypeScript-first with better type inference. Yup requires manual type definitions. Zod is the 2026 standard. |
| Telegram Library | Telegraf | grammY | Both are excellent. Telegraf has more examples and middleware ecosystem. grammY is newer with slightly better types. Choose Telegraf for maturity. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App | Deprecated. No SSR, no server components, slow bundler. | Next.js (already chosen) |
| Webpack (manual) | Next.js includes Turbopack (10x faster). Manual webpack is complexity for no benefit. | Next.js Turbopack |
| Redux (without toolkit) | Massive boilerplate, outdated patterns. | Zustand or Redux Toolkit |
| Firebase Admin SDK (client-side) | Security risk. Exposes service account. Use only in Cloud Functions/Server. | Firebase Client SDK |
| next-firebase-auth | Does not support Next.js App Router (deprecated for new projects). | Firebase Auth + cookies (manual) or next-firebase-auth-edge |
| OpenAI API (for Turkish) | Claude Sonnet 4.6 outperforms GPT-4o on Turkish language tasks and costs less. | Anthropic Claude API |
| react-imgpro | Unmaintained (last update 2018). | Sharp (server) + react-image-crop (client) |
| node-telegram-bot-api | Less TypeScript support, unmaintained. | Telegraf |

## Stack Patterns by Variant

**If building MVP (Phase 1-2):**
- Skip LangChain (use Anthropic SDK directly)
- Skip Vitest/Playwright (manual testing acceptable)
- Skip next-pwa (defer PWA to Phase 3)
- Use Firestore security rules instead of complex Cloud Functions

**If scaling beyond 1K agents:**
- Add Firebase Extensions (Resize Images, Algolia Search)
- Introduce Firestore composite indexes for complex queries
- Consider Vercel Pro for better Analytics and DDoS protection
- Add Sentry for error tracking

**If targeting non-Turkish markets:**
- Add i18n library (next-intl for App Router)
- Consider multi-region Firebase (US, EU, Asia)
- Ensure Claude prompts specify language explicitly

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 16.1.6 | React 19.2.4 | Next.js 16 requires React 19 (uses concurrent features) |
| next-pwa 5.6.0 | Next.js 16+ | Verify next-pwa supports Next.js 16. Check GitHub issues if build fails. May need @ducanh2912/next-pwa (community fork). |
| Firebase 12.9.0 | Node.js 18+ | Node.js 20+ recommended for Vercel Edge Functions |
| Puppeteer 24.37.4 | Firebase Cloud Functions Gen 2 | Requires 4GB RAM. Use Cloud Functions 2nd gen with memory setting. |
| Sharp 0.34.5 | Node.js 18.17.0+ | Native dependency. Works in Vercel Serverless Functions. |
| Telegraf 4.16.3 | Node.js 18+ | TypeScript 5.x recommended for best type inference |

## Firebase-Specific Considerations

**Firestore Data Model:**
```
/agents/{agentId} - Agent profile
/properties/{propertyId} - Property listings (owned by agent)
/customers/{customerId} - Customer leads
/conversations/{conversationId} - AI chat history
/scrapers/{scraperId} - Scraping job status
```

**Security Rules:**
- Agent can only read/write their own data (`request.auth.uid == resource.data.agentId`)
- Use Firebase App Check to block scrapers from abusing Firestore
- Enable Firestore TTL for temporary scraping data (auto-cleanup after 30 days)

**Firestore Indexes:**
- Composite index: `properties` collection on `agentId` (asc) + `createdAt` (desc)
- Composite index: `customers` collection on `agentId` (asc) + `status` (asc) + `updatedAt` (desc)

**Firebase Hosting + Vercel:**
- Deploy Next.js to Vercel (not Firebase Hosting) for edge functions and better Next.js support
- Use Firebase only for auth, database, storage, and cloud functions
- Firebase Hosting is optimized for static sites, not Next.js SSR

## Turkish Real Estate Integration Notes

**sahibinden.com scraping:**
- Requires residential Turkish proxies (Cloudflare blocks foreign IPs)
- Use Puppeteer with `puppeteer-extra-plugin-stealth`
- Implement rate limiting (1 request per 3 seconds to avoid bans)
- Respect robots.txt and terms of service
- Consider official API if available (contact sahibinden.com)

**hepsiemlak / emlakjet:**
- Similar Cloudflare protection as sahibinden.com
- May require session cookies and CAPTCHA solving (2captcha integration)
- Check if sites offer official API or RSS feeds (less fragile than scraping)

**Data localization:**
- Firebase europe-west1 (Belgium) is closest to Turkey
- Vercel has edge locations in Europe (fra1 - Frankfurt)
- No Vercel/Firebase data centers in Turkey as of 2026

## Sources

### HIGH Confidence (Official Docs + npm verification)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-15) - Next.js 15/16 features
- [Next.js Official Docs](https://nextjs.org/docs) - Version 16.1.6 confirmed
- [Firebase Release Notes](https://firebase.google.com/support/release-notes/js) - Version 12.9.0
- [Anthropic API Docs](https://platform.claude.com/docs/en/release-notes/overview) - Sonnet 4.6, Opus 4.6
- npm registry verification (all package versions confirmed via `npm view`)

### MEDIUM Confidence (WebSearch + Multiple Sources)
- [7 Best JavaScript & Node.js Web Scraping Libraries in 2026 - ZenRows](https://www.zenrows.com/blog/javascript-nodejs-web-scraping-libraries) - Puppeteer + Cheerio recommendation
- [Top 5 React State Management Tools 2026 - Syncfusion](https://www.syncfusion.com/blogs/post/react-state-management-libraries) - Zustand growth trends
- [React Hook Form + Zod Guide - freeCodeCamp](https://www.freecodecamp.org/news/react-form-validation-zod-react-hook-form/) - Validation best practices
- [Telegram Bot Libraries Comparison - Latenode](https://community.latenode.com/t/which-telegram-bot-library-should-i-choose-telegraf-or-telebot/17407) - Telegraf vs alternatives
- [PWA Best Practices 2026 - Wire Future](https://wirefuture.com/post/progressive-web-apps-pwa-best-practices-for-2026) - PWA patterns

### LOW Confidence (Needs Validation)
- sahibinden.com scraping - No official API confirmed. Community GitHub repos exist but legal/TOS unclear. Validate with legal team.
- Firebase vs Postgres for SaaS - Postgres generally better for relational data, but Firebase meets project requirements. Consider later migration.
- next-pwa compatibility with Next.js 16 - May need community fork @ducanh2912/next-pwa. Test before production.

---

*Stack research for: AI-Powered Real Estate Agent SaaS (Turkey)*
*Researched: 2026-02-19*
*Next steps: Validate Turkish real estate site APIs, confirm Firebase europe-west1 latency, test next-pwa with Next.js 16*
