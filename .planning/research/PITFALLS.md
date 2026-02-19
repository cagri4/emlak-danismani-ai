# Pitfalls Research

**Domain:** AI-powered Real Estate SaaS (Turkish Market)
**Researched:** 2026-02-19
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: Turkish Platform Anti-Bot Detection Breaking Production

**What goes wrong:**
Web scraping from sahibinden.com, hepsiemlak, and emlakjet breaks in production after working in development. Sites deploy sophisticated anti-bot systems (Cloudflare ML models, DataDome behavioral analysis, Akamai JA4 fingerprinting) that detect and block scrapers immediately, causing complete data pipeline failure.

**Why it happens:**
Developers test with small-scale scraping (2-3 requests) that passes undetected, then deploy to production where higher frequency triggers anti-bot systems. Turkish real estate sites specifically lack proper API access, forcing reliance on scraping without official support channels.

**How to avoid:**
- Use fortified headless browsers (Camoufox with Firefox-based C++ fingerprint modifications)
- Implement residential proxy rotation from day one
- Start at 2-5 requests per minute, never exceed site-specific thresholds
- Mimic human behavior: randomize scroll heights, mouse movements, click patterns
- Build retry logic with exponential backoff
- Consider commercial scraping APIs (ScraperAPI, ZenRows) for critical production paths
- Monitor success rates continuously, have fallback manual entry flows

**Warning signs:**
- 403 Forbidden responses appearing in logs
- CAPTCHA challenges increasing frequency
- Sudden drops in data collection success rate
- Cloudflare challenge pages in responses
- IP addresses getting blacklisted

**Phase to address:**
Phase 1 (Foundation/MVP) — Build anti-detection mechanisms from the start, not as retrofits.

---

### Pitfall 2: Claude API Cost Explosion Without Prompt Caching

**What goes wrong:**
Claude API costs spiral to $3,650+/month when generating property descriptions, social media posts, and customer responses for multiple realtors. The 200K token threshold trap hits hard: crossing from 199K to 201K tokens doubles input costs from $3 to $6 per request.

**Why it happens:**
Each property listing generation sends full context (property data, style guidelines, examples, Turkish language instructions) without caching. Real estate agents generate 50-100 listings per week, each requiring 150-300K tokens of context, causing immediate ITPM (Input Tokens Per Minute) limit hits and massive cost overruns.

**How to avoid:**
- Implement prompt caching from day one — mark style guidelines, examples, and instructions as cacheable
- With effective caching, cached content doesn't count toward ITPM limits, dramatically increasing throughput
- Keep input messages under 200K tokens when possible to avoid $3→$6 cost jump
- Optimize max_tokens parameter to match actual completion sizes
- Monitor token usage per request in real-time
- Consider Claude Max subscription ($200/month) for development — it's 18x cheaper than API for heavy usage
- Start at Tier 1 ($5 deposit) but plan upgrade path to Tier 4 ($400 deposit) for 80x higher rate limits

**Warning signs:**
- ITPM rate limit errors appearing frequently
- Monthly API bills exceeding $500 in first month
- Individual requests costing $4-8
- Users reporting "slow AI response" due to queuing
- Token counts consistently above 180K per request

**Phase to address:**
Phase 1 (MVP) — Caching architecture is foundational, impossible to retrofit without complete rewrite.

---

### Pitfall 3: Turkish Language AI Quality Below Acceptable Standards

**What goes wrong:**
AI-generated property descriptions in Turkish contain grammatical errors, unnatural phrasing, and fail to match real estate industry conventions. Turkish's agglutinative morphology (rich suffixes, complex word formation) causes AI models to produce text that immediately signals "machine-written" to agents and customers.

**Why it happens:**
Most LLMs tokenize Turkish inefficiently due to morphological complexity. Data scarcity for Turkish training data means models perform worse than English. Developers test with simple translations but don't validate against actual Turkish real estate listing conventions (specific terminology, cultural expectations, formal vs. informal register choices).

**How to avoid:**
- Test Claude API specifically with Turkish real estate text generation before committing
- Compare outputs from gemma2-9b-it, Qwen2.5-7B-Instruct, and Trendyol-8B-chat-v2.0 (top Turkish NLP models in 2026)
- Consider Kumru AI (VNGRS, trained on 300B Turkish tokens) for Turkish-specific tasks
- Build evaluation dataset of 50-100 real Turkish property listings from sahibinden/hepsiemlak
- Implement human-in-the-loop review for first 200 AI generations
- Create Turkish-specific prompt engineering guidelines (formal register, industry terms)
- Add post-processing validation for common morphological errors
- Have Turkish-speaking QA tester on team from day one

**Warning signs:**
- Agents manually rewriting 70%+ of AI-generated content
- Customer complaints about "strange wording"
- Low AI feature adoption despite availability
- Feedback like "it doesn't sound professional"
- Word choice that's technically correct but culturally off

**Phase to address:**
Phase 1 (MVP) — Turkish quality is a make-or-break feature, not an enhancement.

---

### Pitfall 4: Firebase + Vercel Serverless Cold Starts Killing UX

**What goes wrong:**
First visits to the SaaS take 5-10 seconds to load. API responses from Next.js Cloud Run functions take 1-3 seconds minimum. Users assume the site is broken and leave. Real estate agents (target users) have low patience for slow tools — they're comparing against instant-loading competitors.

**Why it happens:**
Firebase Cloud Functions suffer from cold starts when there aren't enough active users. After Next.js 13.4.12+, memory issues cause frequent out-of-memory crashes unless memory is set to 1GiB+, increasing costs. Vercel is frontend-focused; complex backend operations on serverless create latency. Turkish real estate agents expect desktop-app-like speed from web SaaS.

**How to avoid:**
- Keep Cloud Functions lightweight, minimize dependencies
- Use Firebase scheduled functions to "keep warm" — invoke critical functions every 5 minutes
- For Next.js on Firebase, test specifically with version 13.4.12 (known stable version)
- Allocate 1GiB+ memory to Cloud Functions to prevent OOM crashes
- Implement optimistic UI updates — show instant feedback while background processes run
- Pre-render static content with ISR (Incremental Static Regeneration)
- Consider hybrid approach: Vercel for frontend, dedicated backend service for heavy operations
- Add loading states that feel intentional, not broken (skeleton screens, progress indicators)
- Cache aggressively at CDN level for static assets
- Measure P95 latency, not just averages — 95% of users should see <2s loads

**Warning signs:**
- First-time user bounce rate >60%
- Console logs showing "function timeout" errors
- Cloud Functions consistently taking >3s to respond
- Out-of-memory errors in Firebase logs
- Users reporting "nothing happens when I click"
- P95 response time >5 seconds

**Phase to address:**
Phase 1 (MVP) — Performance architecture must be correct from start, optimization later won't fix architectural bottlenecks.

---

### Pitfall 5: Multi-Channel Complexity Causing Message Ordering Chaos

**What goes wrong:**
Users interact with the AI assistant simultaneously via web app, mobile app, and Telegram bot. Messages arrive out of order, contexts get mixed, and the AI responds to web questions via Telegram or vice versa. The user sees conflicting responses and loses trust in the system.

**Why it happens:**
Telegram bot webhooks timeout when processing takes >30 seconds (Claude API calls). When timeout occurs, Telegram re-sends the message, creating duplicates. With 100 concurrent users, queue-based architectures create artificial serialization where users block each other. Different channels (web/mobile/Telegram) have different message IDs and session management, causing context switching failures.

**How to avoid:**
- Implement channel-aware message routing with unique session IDs per channel
- Use Firebase Realtime Database or Firestore for cross-channel state synchronization
- For Telegram: return immediate acknowledgment (200 OK), process asynchronously, send response via sendMessage API
- Implement idempotency keys to prevent duplicate message processing
- Use separate Lambda/Cloud Function instances per user session to prevent blocking
- Rate limit per channel: Telegram (30 messages/second global, 1/second per chat, 20/minute in groups)
- Build message queue with priority: user-initiated messages > system notifications
- Add "typing indicator" state synchronized across channels
- Test specifically with 50+ concurrent users across all three channels simultaneously

**Warning signs:**
- Users reporting "I asked on web but got answer on Telegram"
- Duplicate responses being sent
- Messages appearing in wrong order in conversation history
- Webhook timeout errors in Telegram bot logs
- Users in queue waiting >5 minutes for responses
- Database showing multiple active sessions for same user

**Phase to address:**
Phase 2 (Multi-Channel Foundation) — Architecture must handle this before launching additional channels.

---

### Pitfall 6: AI-Edited Property Photos Creating Legal Liability

**What goes wrong:**
AI enhances property photos by removing power lines, changing sky, brightening interiors, virtually staging empty rooms. Buyer visits property and sees damaged walls, smaller windows, and missing features. Under California AB 723 (effective Jan 1, 2026) and similar emerging Turkish regulations, this creates legal liability for false advertising. Realtor faces fines, loses license, destroys reputation.

**Why it happens:**
AI image editing tools make it trivially easy to enhance photos. Developers think "beautification" helps sales. Turkish real estate market has existing trust issues (sahibinden.com lacks advertiser verification). AI hallucinations add non-existent windows, create stairways to nowhere, change room dimensions. No one reviews AI edits for accuracy before publishing.

**How to avoid:**
- Provide ONLY basic adjustments: brightness, contrast, straightening, color correction
- Explicitly block AI features that: remove objects, change structure, add virtual staging, modify architecture
- Store original unedited photos alongside any edited versions
- Implement mandatory disclosure labels: "This photo has been digitally enhanced" on every edited image
- Build two-photo display: original + edited side-by-side
- Add legal warning in UI: "Removing permanent features (power lines, damage, etc.) may violate advertising laws"
- Review Turkish KVKK implications for photo storage and usage rights
- Consult Turkish advertising law regarding property photo manipulation
- Default to NO enhancement unless agent explicitly opts in per photo
- Log all edits with before/after for legal audit trail

**Warning signs:**
- Agents uploading obviously AI-generated images with artifacts
- Complaints about photos not matching property
- AI adding non-existent features (detected in QA review)
- Photos showing impossible furniture placement
- Demonic figures or other hallucinations appearing in mirrors/reflections
- Inconsistent editing styles across listing photos

**Phase to address:**
Phase 3 (Image Processing) — Must have strict legal guardrails BEFORE launching image features.

---

### Pitfall 7: Non-Technical Users Abandoning AI Features Due to Complexity

**What goes wrong:**
Real estate agents (average age 54, 30% report poor technology literacy) sign up for the SaaS but only use basic features. AI capabilities go unused because agents don't understand how to activate them, interpret results, or fix errors. Adoption dies, churn increases, value proposition fails.

**Why it happens:**
Developers design AI features for themselves (tech-savvy users) rather than target users (non-technical realtors). "AI magic" feels opaque and untrustworthy. Errors happen without clear explanation or recovery path. Agents fear AI mistakes will damage their professional reputation. Onboarding assumes digital literacy that 1/3 of users lack.

**How to avoid:**
- Follow "AI assistance, not AI takeover" principle — users stay in control, can override everything
- Make AI interactions obvious, not magical: show what AI is doing, why, and how to change it
- Implement graceful error handling: when AI fails, explain in plain language, offer 3 alternative actions
- Build progressive disclosure: start with simple AI features, gradually introduce advanced capabilities
- Add in-app tooltips and embedded performance support (not separate manual)
- Create 3-minute video walkthrough showing exact clicks for each AI feature
- Design for accessibility: clear language, high contrast, keyboard navigation
- Show AI confidence levels: "High confidence (95%)" vs "Review recommended (60%)"
- Implement mandatory review step before AI publishes anything
- Avoid over-automation: let users click "Generate" rather than auto-generating
- Test with actual Turkish real estate agents (not tech-savvy friends) before launch

**Warning signs:**
- Feature usage analytics showing <20% AI feature activation
- Support tickets: "How do I make the AI work?"
- Agents manually doing tasks that AI could automate
- High initial signup but low Week 2 retention
- Feedback: "Too complicated" or "I don't trust it"
- Users disabling AI features after trying once

**Phase to address:**
Phase 1 (MVP) — UX simplicity is architectural, cannot be added later.

---

### Pitfall 8: KVKK Compliance Violations Causing Massive Fines

**What goes wrong:**
SaaS collects personal data (agent info, customer contacts, property owner details) without proper consent, stores it on US servers (Firebase default), and fails to notify authorities of breaches within 72 hours. Turkish Data Protection Authority audits, discovers violations, and levies fines of 341,809₺ to 17,092,242₺ ($12K-$615K USD). Company faces registration requirements they didn't know existed.

**Why it happens:**
Developers treat KVKK as "GDPR-like, we'll handle it later." Turkish KVKK has specific requirements beyond GDPR: VERBIS registration (Data Controllers Registry), 72-hour breach notification, stricter cross-border data transfer rules. Firebase stores Authentication and Analytics data in US by default. 2024 amendments expanded requirements significantly. Non-compliance fines increased for 2026.

**How to avoid:**
- Register with VERBIS (Data Controllers Registry Information System) before processing any personal data
- Obtain explicit, freely given, specific consent for each data processing purpose
- Implement consent management system with granular controls (not single "accept all")
- Store explicit consent records with timestamps and IP addresses
- Configure Firebase to use EU data regions where available (Firestore regional deployments)
- For Firebase services without regional options, implement Standard Contractual Clauses (SCCs)
- Build 72-hour breach notification system: detect → assess → notify authority → notify users
- Encrypt personal data at rest and in transit
- Implement access controls: only authorized personnel can access personal data
- Conduct Data Protection Impact Assessment (DPIA) before launch
- Update privacy policy to explicitly mention KVKK compliance and user rights
- Provide data subject access request (DSAR) workflow: users can request data export/deletion
- Consult Turkish data protection lawyer for specific compliance verification
- Budget for ongoing compliance: annual VERBIS updates, consent refreshes, security audits

**Warning signs:**
- No VERBIS registration number obtained
- Privacy policy copied from US/EU template without Turkish customization
- Consent flow is single "Accept" button with no granularity
- Firebase using default US data regions
- No breach detection or notification system implemented
- Support team can't answer: "How do I export my data?"
- Cross-border data transfers happening without legal basis

**Phase to address:**
Phase 1 (MVP) — Compliance must be built in from day one, retrofitting is extremely expensive and legally risky.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip scraping anti-detection in MVP | Ship 2 weeks faster | Production scraping breaks completely, requires full pipeline rebuild | Never — anti-detection is foundational |
| Use default Firebase US data regions | Zero config effort | KVKK violations, potential 17M₺ fines, forced data migration | Never for Turkish market SaaS |
| No prompt caching in initial Claude integration | Simpler initial implementation | 5-10x API costs, ITPM limits prevent scaling, requires architecture rewrite | Never — caching is fundamental to cost structure |
| Single-channel MVP (web only), delay Telegram | Ship 4 weeks faster | Message routing architecture retrofit is 3x harder than building upfront | Acceptable if architected for multi-channel from day one |
| Use generic AI without Turkish quality testing | Skip 2-week validation phase | 70% of content requires manual rewrite, feature abandonment | Never — Turkish quality is core value prop |
| Manual image editing (no AI) in MVP | Avoid legal complexity | Competitive disadvantage if competitors ship AI editing | Acceptable — legal risk outweighs feature benefit initially |
| Copy-paste GDPR privacy policy for KVKK | Zero legal cost upfront | Regulatory fines, forced business shutdown | Never — Turkish law has specific unique requirements |
| Serverless architecture without cold start mitigation | Simple deployment | 5-10s load times, user abandonment, requires infrastructure rewrite | Never — UX speed is table stakes for realtor SaaS |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **sahibinden.com scraping** | Using datacenter proxies that get instantly blocked | Use residential proxies, rotate IPs, limit to 2-5 req/min, mimic human behavior with Camoufox browser |
| **Claude API** | Sending full context on every request without caching | Mark style guides, examples, Turkish instructions as cacheable, reducing ITPM by 70-90% |
| **Firebase Authentication** | Assuming EU data residency is default | Explicitly verify data region, use regional Firestore, implement SCCs for US-stored data |
| **Telegram Bot API** | Processing long-running tasks synchronously in webhook | Return 200 OK immediately, queue processing, send response via sendMessage API |
| **hepsiemlak data** | Scraping at consistent intervals (10 AM daily) | Randomize timing, vary request patterns, add jitter to avoid detection |
| **Turkish payment gateways (iyzico)** | Testing only with successful transactions | Test failure modes: declined cards, timeout scenarios, partial refunds, 3D Secure flows |
| **Firebase Cloud Functions** | Using Next.js >13.4.12 without testing | Pin to Next.js 13.4.12 or test extensively with 1GiB+ memory allocation |
| **Claude API max_tokens** | Setting to maximum (4096) for all requests | Optimize per use case: 150 tokens for titles, 800 for descriptions, 200 for social posts |
| **KVKK consent forms** | Single "I accept" checkbox for all processing | Granular checkboxes per purpose: marketing emails, data sharing, analytics, etc. |
| **Multi-channel messaging** | Sharing session state via cookies/localStorage | Use Firebase Realtime Database or Firestore with channel-aware session IDs |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Synchronous Claude API calls in request path** | First user: 2s response. 10 concurrent users: 30s+ timeouts | Queue Claude requests, return immediate UI feedback, stream results asynchronously | >10 concurrent AI requests |
| **No Firestore query limits** | Dev testing: instant. Production: 30s+ queries, $400 bills | Add .limit(20) to all queries, implement pagination, use composite indexes | >1000 documents in collection |
| **Sequential property image processing** | 3 images: 5s total. 30 images: 50s+ timeout | Parallel processing with Promise.all(), limit to 5 concurrent, use Cloud Tasks for large batches | >10 images per listing |
| **Client-side Turkish text generation** | Works in dev with fast internet. Field agents on 3G: timeouts | Server-side generation, send results to client, implement request deduplication | Mobile/rural network conditions |
| **In-memory session storage** | Single server instance: works. Horizontal scaling: sessions lost | Use Firebase Realtime Database or Firestore for session state, enable sticky sessions if needed | >1 server instance (scaling) |
| **Unthrottled web scraping** | First 100 requests: success. Request 101: permanent IP ban | Implement rate limiting from req #1, monitor success rates, back off exponentially on failures | Immediate if detected by anti-bot |
| **No image compression** | 5 photos per listing: works. 30 photos: 50MB page, mobile users can't load | Compress images to <200KB, use WebP format, lazy load, implement responsive images | >15 high-res photos |
| **Single Claude API tier (Tier 1)** | 10 users: works. 50 users: constant rate limits | Plan tier upgrade path to Tier 4, implement request queuing, show estimated wait times | >30 concurrent users |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Storing scraped property data without rate limiting access** | Competitor scrapes your entire database via API | Implement per-user API rate limits (100 req/hour), require authentication, add CAPTCHA for suspicious patterns |
| **No validation of AI-generated content before publication** | AI generates defamatory content about property/neighborhood, legal liability | Implement content moderation filter, block profanity/defamation, require human review for first 200 generations |
| **Sharing realtor API keys across agents in agency** | One agent's key leaked, entire agency's data compromised | One API key per user, implement key rotation, audit key usage, revoke on suspicious activity |
| **Exposing Firebase config in client code without security rules** | Anyone can read/write all Firestore data, delete listings, impersonate users | Implement strict Firestore security rules, test with Firebase emulator, audit rules before production |
| **No encryption of customer contact info (phone/email)** | Data breach exposes customer contacts, KVKK violation, 17M₺ fine | Encrypt PII fields at rest, use Firebase Cloud Functions for decryption, implement field-level access control |
| **Telegram bot token hardcoded in repo** | Token leaked on GitHub, attacker sends spam via your bot, reputation destroyed | Use environment variables, rotate tokens quarterly, enable Telegram bot IP whitelist, monitor unusual activity |
| **No KVKK-compliant data retention policy** | Storing deleted user data indefinitely, violation of data minimization principle | Implement automatic deletion: inactive accounts after 2 years, deleted data after 30 days, audit logs after 7 years |
| **Cross-tenant data leakage in multi-agency mode** | Agency A sees Agency B's listings/customers due to improper query filtering | Add agencyId to all Firestore documents, filter ALL queries by tenant, test with 2+ separate agencies |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **"AI magic" with no explanation** | Agent doesn't trust AI, manually rewrites everything, feature abandoned | Show AI reasoning: "Generated based on 3 bed, 2 bath, Istanbul location", allow edit before publish |
| **Over-automation: AI publishes without review** | AI makes mistake, listing goes live with error, agent's professional reputation damaged | Require explicit "Review & Publish" step, show preview, highlight AI-generated sections |
| **English-first UI with Turkish translation as afterthought** | Turkish text truncated, awkward phrasing, feels like foreign product | Design in Turkish first, ensure UI accommodates Turkish text length, use native Turkish speakers for UX copy |
| **Complex feature onboarding via documentation** | Agent reads 20-page manual, gets confused, gives up | In-app tooltips on first use, 30-second video per feature, progressive feature unlock |
| **No error recovery guidance** | "AI generation failed" error, no next step, agent stuck | "AI generation failed. Try: 1) Reduce description length, 2) Regenerate, 3) Write manually" |
| **Mixing formal/informal Turkish in UI** | Feels unprofessional, breaks trust with older agents | Use consistent formal register (siz, not sen), match real estate industry conventions |
| **Slow AI response with no feedback** | Agent clicks "Generate", sees nothing for 15s, thinks it's broken, clicks 3 more times, creates duplicates | Immediate "Generating..." state, progress indicator, show token streaming if possible |
| **Mobile-last design for field agents** | Desktop UI works great, mobile is unusable, but agents need mobile for property visits | Mobile-first design, test on older Android devices (Samsung J series), optimize for 3G networks |
| **Requiring manual data entry that could be scraped** | Agent spends 10 min entering property details available on sahibinden | Auto-fill from URL: agent pastes sahibinden link, system scrapes and pre-fills form |
| **No offline mode for rural property visits** | Agent at remote property with no internet, can't access app, can't record notes | Offline-first architecture with local storage, sync when connection returns |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **AI Text Generation:** Works in demo but missing Turkish morphology validation, AI output sounds unnatural to native speakers — verify with 10 Turkish realtors reviewing real outputs
- [ ] **Web Scraping:** Successfully scrapes 100 listings in dev but uses datacenter proxies that get banned in production — verify with residential proxies, rate limiting, and 7-day continuous operation test
- [ ] **Telegram Bot:** Receives and responds to messages but has no webhook timeout handling, duplicate message prevention, or rate limit compliance — verify with 100 concurrent users sending rapid messages
- [ ] **Image Upload:** Accepts images but has no compression, format validation, or size limits — verify mobile upload of 30x 5MB photos triggers proper handling
- [ ] **Multi-Channel Sync:** User sees same conversation on web and Telegram but messages arrive out of order under load — verify with 50 concurrent users switching channels mid-conversation
- [ ] **KVKK Compliance:** Has privacy policy but no VERBIS registration, consent management system, or 72-hour breach notification — verify with Turkish data protection lawyer review
- [ ] **Claude API Integration:** Generates text but has no prompt caching, cost monitoring, or rate limit handling — verify with sustained load generating 1000 requests/hour
- [ ] **Firebase Performance:** Works with 10 users but Cloud Functions timeout with 100 concurrent users — verify with load testing at 10x expected peak traffic
- [ ] **Payment Integration:** Processes successful transactions but doesn't handle declined cards, refunds, or 3D Secure edge cases — verify with payment testing suite covering all failure modes
- [ ] **Property Listing:** Displays on web but missing schema.org structured data, OG tags for social sharing, and mobile-responsive layout — verify with Google Rich Results Test and mobile device testing

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Anti-bot detection blocking scraper** | MEDIUM | 1) Switch to residential proxies immediately, 2) Reduce rate to 2 req/min, 3) Rotate user agents, 4) Add 3-7 day cool-off period, 5) Consider commercial scraping API as fallback |
| **Claude API cost explosion** | LOW | 1) Implement prompt caching within 1 sprint, 2) Analyze logs to find repeat context, 3) Reduce max_tokens to actual needs, 4) Add cost alerts at $100, $500, $1000 thresholds |
| **Poor Turkish AI quality** | HIGH | 1) Switch to Kumru AI or Turkish-optimized model, 2) Add human review layer, 3) Build post-processing rules for common errors, 4) Create feedback loop to improve prompts |
| **Firebase cold start performance** | MEDIUM | 1) Implement keep-warm scheduled functions immediately, 2) Add optimistic UI updates, 3) Downgrade Next.js to 13.4.12, 4) Increase Cloud Function memory to 1GiB |
| **Multi-channel message chaos** | HIGH | 1) Add idempotency keys to all message processing, 2) Implement channel-aware session IDs, 3) Rebuild message queue with per-user isolation, 4) Add async webhook processing |
| **AI photo editing legal issues** | HIGH | 1) Immediately disable AI editing features, 2) Replace edited photos with originals, 3) Add disclosure labels to all remaining edits, 4) Consult lawyer on liability, 5) Rebuild with legal guardrails |
| **Low user adoption of AI features** | MEDIUM | 1) User research with 10 real agents to identify UX barriers, 2) Add in-app walkthrough videos, 3) Simplify UI to 3 core features only, 4) Implement progressive disclosure |
| **KVKK compliance violation** | HIGH | 1) Stop processing personal data immediately, 2) Register with VERBIS emergency filing, 3) Hire Turkish data protection lawyer, 4) Conduct full compliance audit, 5) Implement corrections, 6) Prepare for potential fines |
| **Telegram rate limit violations** | LOW | 1) Implement exponential backoff on 429 errors, 2) Add request queue with rate limiting, 3) Batch notifications instead of individual sends, 4) Monitor Telegram API rate limits in real-time |
| **Firestore query performance degradation** | LOW | 1) Add query limits (.limit(20)) to all queries, 2) Create composite indexes, 3) Implement pagination, 4) Consider moving large collections to Cloud SQL |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| **Anti-bot detection breaking scraper** | Phase 1: MVP | 7-day continuous scraping test with residential proxies, success rate >95% |
| **Claude API cost explosion** | Phase 1: MVP | Cost per AI generation <$0.05, prompt caching hit rate >80% |
| **Turkish AI quality issues** | Phase 1: MVP | 10 Turkish realtor review panel, 90% rate outputs as "professional quality" |
| **Firebase cold start performance** | Phase 1: MVP | P95 page load <2s, Cloud Function warm starts >80% |
| **Multi-channel message chaos** | Phase 2: Multi-Channel | 100 concurrent users across 3 channels, zero out-of-order messages |
| **AI photo editing legal liability** | Phase 3: Image Processing | Turkish lawyer review, disclosure system tested, original photo storage verified |
| **Non-technical user abandonment** | Phase 1: MVP | Week 2 retention >60%, AI feature usage >40% of active users |
| **KVKK compliance violations** | Phase 1: MVP | VERBIS registration complete, Turkish lawyer sign-off, DPIA conducted |
| **Telegram rate limit violations** | Phase 2: Multi-Channel | 1000 message burst test, zero 429 errors, all messages delivered within 2 minutes |
| **Firestore performance degradation** | Phase 1: MVP | Load test with 10K documents, query times <500ms, cost <$50/month |

## Sources

**Web Scraping & Anti-Bot Detection:**
- [Medium: Web Scraping in 2025: Bypassing Modern Bot Detection](https://medium.com/@sohail_saifii/web-scraping-in-2025-bypassing-modern-bot-detection-fcab286b117d)
- [ZenRows: Bypass Bot Detection: 5 Best Methods](https://www.zenrows.com/blog/bypass-bot-detection)
- [RoundProxies: How to bypass Anti-Bots in 2026](https://roundproxies.com/blog/how-to-bypass-anti-bots/)
- [ScrapingBee: Web Scraping without getting blocked (2026 Solutions)](https://www.scrapingbee.com/blog/web-scraping-without-getting-blocked/)
- [GitHub: anilken/scraper - Turkish sites scraper](https://github.com/anilken/scraper)
- [Scrappey: Sahibinden.com Scraper](https://scrappey.com/scrapers/real%20estate/sahibinden.com-scraper)

**Claude API Rate Limits & Cost Optimization:**
- [Northflank: Claude Code: Rate limits, pricing, and alternatives](https://northflank.com/blog/claude-rate-limits-claude-code-pricing-cost)
- [Claude API Docs: Rate limits](https://platform.claude.com/docs/en/api/rate-limits)
- [GLB GPT: Claude AI Pricing 2026 Guide](https://www.glbgpt.com/hub/claude-ai-pricing-2026-the-ultimate-guide-to-plans-api-costs-and-limits/)
- [AI Free API: Claude API Quota Tiers and Limits Explained 2026](https://www.aifreeapi.com/en/posts/claude-api-quota-tiers-limits)
- [Claude API Docs: Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

**Turkish Language NLP Challenges:**
- [arXiv: From Perceptions to Evidence: Detecting AI-Generated Content in Turkish News Media](https://arxiv.org/html/2602.13504)
- [ScienceDirect: How do LLMs perform on Turkish?](https://www.sciencedirect.com/science/article/abs/pii/S0957417425010437)
- [GitHub: turkish-nlp-resources](https://github.com/agmmnn/turkish-nlp-resources)
- [Kumru AI](https://kumruai.online/)
- [arXiv: Setting Standards in Turkish NLP: TR-MMLU](https://arxiv.org/html/2501.00593v2)
- [Turkish.AI - AI FOR TURKISH](https://turkish.ai/)

**AI SaaS UX for Non-Technical Users:**
- [Orbix: 10 AI-Driven UX Patterns Transforming SaaS in 2026](https://www.orbix.studio/blogs/ai-driven-ux-patterns-saas-2026)
- [Eleken: AI in SaaS: How to Integrate, Implement, and Win](https://www.eleken.co/blog-posts/ai-in-saas)
- [Onething Design: B2B SaaS UX Design in 2026](https://www.onething.design/post/b2b-saas-ux-design)
- [IT IDOL: SaaS Roadmaps 2026: Prioritising AI Features](https://itidoltechnologies.com/blog/saas-roadmaps-2026-prioritising-ai-features-without-breaking-product/)

**Firebase & Vercel Performance:**
- [Emergent: 5 Best Firebase Studio Alternatives 2026](https://emergent.sh/learn/best-firebase-alternatives-and-competitors)
- [UI Bakery: Vercel vs Firebase in 2025](https://uibakery.io/blog/vercel-vs-firebase)
- [Firebase Docs: Understand real-time queries at scale](https://firebase.google.com/docs/firestore/real-time_queries_at_scale)
- [GitHub Issue: NextJS - Extreme latency and out of memory cloud functions](https://github.com/firebase/firebase-tools/issues/6349)
- [GitHub Discussion: Using Firebase functions for hosting NEXT.js is a very bad idea](https://github.com/vercel/next.js/discussions/11848)

**Telegram Bot Architecture:**
- [Medium: Architecting highly scalable serverless Telegram bots](https://medium.com/@erdavtyan/architecting-highly-scalable-serverless-telegram-bots-5da2bb8fab61)
- [Telegram Bots FAQ](https://core.telegram.org/bots/faq)
- [GitHub Issue: Message Processing Bottleneck with Multiple Telegram Bots](https://github.com/openclaw/openclaw/issues/16055)

**Real Estate Image Processing AI:**
- [PetaPixel: Real Estate Agents Are Using AI Images Instead of Actual Photos](https://petapixel.com/2025/10/27/real-estate-agents-are-using-ai-images-instead-of-actual-photos/)
- [Barnes Walker: California AI edited listing photos legal compliance 2026](https://barneswalker.com/starting-january-1-2026-california-turns-ai-edited-listing-photos-into-a-legal-compliance-issue-not-just-an-mls-issue-is-florida-next/)
- [PhotoUp: The Limitations of AI for Real Estate Photo Editing](https://www.photoup.net/learn/the-limitations-of-ai-for-real-estate-photo-editing)
- [Green Room RE: The 2026 Real Estate Photography Shift](https://www.greenroomre.com/post/the-2026-real-estate-photography-shift-new-rules-ai-warnings-and-how-to-stay-compliant-and-profi)
- [Fstoppers: Hidden Legal Risks of Using AI in Real Estate Photography](https://fstoppers.com/artificial-intelligence/hidden-legal-risks-using-ai-real-estate-photography-713650)

**Turkey KVKK Data Privacy:**
- [CookieYes: Guide to Turkey Personal Data Protection Law (KVKK)](https://www.cookieyes.com/blog/turkey-data-protection-law-kvkk/)
- [Cookie-Script: Practical Guide to KVKK Compliance](https://cookie-script.com/guides/practical-guide-to-kvkk-compliance)
- [SearchInform: KVKK 2026 Updates: What Turkish Businesses Must Know](https://searchinform.com/blog/2026/1/28/kvkk-2026-updates-what-turkish-businesses-must-know/)
- [AZKAN GROUP: Turkey's 2026 KVKK Administrative Fines](https://www.azkangroup.com/turkeys-2026-kvkk-administrative-fines)

**Firebase GDPR/Data Residency:**
- [Firebase: Privacy and Security](https://firebase.google.com/support/privacy)
- [Simple Analytics: Is Firebase GDPR Compliant?](https://www.simpleanalytics.com/is-gdpr-compliant/firebase)
- [iubenda: Firebase Cloud and the GDPR](https://www.iubenda.com/en/help/23040-firebase-cloud-gdpr-how-to-be-compliant/)

**Turkish Real Estate Market & Digital Adoption:**
- [Clockwise: Digital Transformation in Real Estate](https://clockwise.software/blog/real-estate-digital-transformation-guide/)
- [Whatfix: Digital Transformation in Real Estate](https://whatfix.com/blog/real-estate-digital-transformation/)
- [Tracxn: Real Estate SaaS in Istanbul, Turkey](https://tracxn.com/d/explore/real-estate-saas-startups-in-istanbul-turkey/__rCq7gLrwqkI78vhdQAGdhptxddV1lyt1rOyOqujn0nY)
- [Form Simplicity: What New Real Estate Agents Expect from Digital Tools in 2026](https://www.formsimplicity.com/blog/what-new-real-estate-agents-expect-from-digital-tools-in-2026/)

**Turkish Payment Integration:**
- [Subscription Flow: List of Top Payment Gateway in Turkey 2026](https://www.subscriptionflow.com/2023/05/payment-gateway-in-turkey/)
- [Stripe: How to accept payments in Turkey](https://stripe.com/resources/more/payments-in-turkey)

---
*Pitfalls research for: AI-powered Real Estate SaaS (Turkish Market)*
*Researched: 2026-02-19*
*Confidence: MEDIUM-HIGH (verified with 2026 sources, Turkish market specifics confirmed, some items based on general SaaS patterns applied to domain)*
