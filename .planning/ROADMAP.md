# Roadmap: Emlak Danismani AI Asistani

## Overview

This roadmap delivers an AI-first real estate CRM for Turkish agents in 7 phases. We start with auth and basic property management to prove Firebase + Vite + React works, then immediately add AI text generation to validate the core value prop. Phases 2-3 build the conversational AI interface and scraping infrastructure. Phases 4-5 add media processing, Telegram bot, and portal publishing. Phases 6-7 complete multi-channel access with PWA and email features. Each phase delivers verifiable user-facing capabilities, with KVKK compliance and prompt caching built into the foundation from day one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Compliance** - Auth, basic property CRUD, KVKK compliance, basic AI text generation ✅ **COMPLETE**
- [x] **Phase 2: AI Interface & Matching** - Natural language commands, customer management, property-customer matching ✅ **COMPLETE**
- [x] **Phase 3: Background Processing & Scraping** - Photo upload, portal import, competitor monitoring, async job processing ✅ **COMPLETE**
- [x] **Phase 4: Media Enhancement & Voice** - AI photo editing, voice commands (Turkce) ✅ **COMPLETE**
- [ ] **Phase 5: Telegram Bot & Publishing** - Telegram interface, portal publishing, advanced matching features
- [ ] **Phase 6: Mobile PWA & Sharing** - Progressive Web App, WhatsApp sharing, offline support
- [ ] **Phase 7: Email & Advanced Features** - Email communication, customer filtering, lead scoring polish

## Phase Details

### Phase 1: Foundation & Compliance
**Goal**: Users can securely access the system, manage properties manually, and generate basic AI descriptions
**Depends on**: Nothing (first phase)
**Requirements**: ALTI-01, ALTI-02, ALTI-03, ALTI-04, ALTI-05, MULK-01, MULK-02, MULK-03, MULK-04, AIUI-07
**Success Criteria** (what must be TRUE):
  1. User can register with email/password and log in with persistent session
  2. User can add, edit, delete, and change status of properties
  3. User can see dashboard with basic metrics (property count, status breakdown)
  4. User can generate Turkish property description from property attributes using AI
  5. System stores data in KVKK-compliant manner (Europe region, consent management)
**Plans**: 3 plans in 3 waves

Plans:
- [x] 01-01-PLAN.md - Project setup, Firebase config, auth system (email/password, Google OAuth, password reset) ✅ **COMPLETED** (17 min, 3 tasks, 29 files)
- [x] 01-02-PLAN.md - KVKK consent flow, property types/schemas, property CRUD operations ✅ **COMPLETED** (8 min, 3 tasks, 14 files)
- [x] 01-03-PLAN.md - Dashboard with metrics, property cards/grid, filters, AI description generation ✅ **COMPLETED** (10 min, 4 tasks, 30 files)

### Phase 2: AI Interface & Matching
**Goal**: Users can interact with the system using natural Turkish language and get intelligent property-customer matches
**Depends on**: Phase 1
**Requirements**: MUST-01, MUST-02, MUST-03, MUST-04, AIUI-01, AIUI-02, AIUI-03, AIUI-04, AIUI-05, AIUI-06, AIUI-08, ESLE-01, ESLE-02, ESLE-03
**Success Criteria** (what must be TRUE):
  1. User can add properties by typing "3+1 daire Ankara Cankaya 2M TL" in chat interface
  2. User can add customers and their preferences using natural language
  3. User can search properties using natural Turkish queries ("Bodrum'da 10-20M arasi villalar")
  4. User can update property status by saying "Cankaya daireyi satildi yap"
  5. User can type "Mehmet icin mulk bul" and see matching properties with match scores and reasons
  6. AI maintains conversation context across multi-step commands
**Plans**: 5 plans in 3 waves

Plans:
- [x] 02-01-PLAN.md — Customer types, Firestore hooks, customer CRUD pages (Wave 1) ✅ **COMPLETED** (9 min, 3 tasks, 10 files)
- [x] 02-02-PLAN.md — Chat UI shell: floating button, modal, messages, input, suggestion chips (Wave 1) ✅ **COMPLETED** (8 min, 3 tasks, 10 files)
- [x] 02-03-PLAN.md — AI command parser with Claude structured outputs, command handlers (Wave 2) ✅ **COMPLETED** (13 min)
- [x] 02-04-PLAN.md — Matching engine: scoring algorithm, feedback tracking, explanations (Wave 2) ✅ **COMPLETED** (7 min)
- [x] 02-05-PLAN.md — Integration: wire matching to chat, voice input, file attachments, verification (Wave 3) ✅ **COMPLETED** (15 min, bug fixes included)

### Phase 3: Background Processing & Scraping
**Goal**: Users can import properties from major Turkish portals and upload photos asynchronously
**Depends on**: Phase 2
**Requirements**: MULK-05, MULK-06, PORT-01, PORT-02, PORT-03, PORT-04, PORT-09, PORT-10, MUST-05
**Success Criteria** (what must be TRUE):
  1. User can upload 10-20 photos in batch and reorder them with drag-and-drop
  2. User can import property from sahibinden.com, hepsiemlak, or emlakjet URL and see parsed details
  3. System automatically monitors competitor listings and notifies user of new relevant properties
  4. Photo upload processes in background without blocking the interface
  5. AI automatically scores leads as hot/cold based on interaction history
**Plans**: 6 plans in 2 waves ✅ **COMPLETE**

Plans:
- [x] 03-01-PLAN.md — Cloud Functions setup, image processor, upload infrastructure (Wave 1) ✅ **COMPLETED** (11 min, 3 tasks, 10 files)
- [x] 03-02-PLAN.md — Photo upload UI: drag-drop, progress, reordering, cover selection (Wave 2) ✅ **COMPLETED** (15 min, 3 tasks, 7 files)
- [x] 03-03-PLAN.md — Portal scrapers: sahibinden, hepsiemlak, emlakjet with chat integration (Wave 1) ✅ **COMPLETED** (19 min, 3 tasks, 10 files)
- [x] 03-04-PLAN.md — Competitor monitoring: scheduled function, notifications, settings (Wave 2) ✅ **COMPLETED** (12 min, 3 tasks, 9 files)
- [x] 03-05-PLAN.md — Lead scoring: time-decay algorithm, badges, dashboard card (Wave 2) ✅ **COMPLETED** (8 min, 3 tasks, 10 files)
- [x] 03-06-PLAN.md — Gap closure: implement scrapeSearchResults for competitor monitoring (Wave 1) ✅ **COMPLETED** (6 min, 2 tasks, 1 files)

### Phase 4: Media Enhancement & Voice
**Goal**: Users can enhance property photos with AI and give voice commands in Turkish
**Depends on**: Phase 3
**Requirements**: MULK-07, MULK-08, MULK-09, MULK-10, AIUI-09, AIUI-10
**Success Criteria** (what must be TRUE):
  1. User can crop property photos within the interface
  2. AI automatically enhances photos (HDR, brightness, contrast adjustment)
  3. AI can replace cloudy skies with blue skies in property photos
  4. AI corrects perspective distortion in photos
  5. User can speak commands in Turkish and see them executed (e.g., "Yeni mulk ekle")
**Plans**: 5 plans in 2 waves ✅ **COMPLETE**

Plans:
- [x] 04-01-PLAN.md — Photo cropping with react-easy-crop, image utilities, PropertyEdit integration (Wave 1) ✅ **COMPLETED** (15 min, 3 tasks, 7 files)
- [x] 04-02-PLAN.md — Sharp-based photo enhancement Cloud Function, client service, enhance button (Wave 1) ✅ **COMPLETED** (17 min, 3 tasks, 7 files)
- [x] 04-03-PLAN.md — Cloudinary AI for sky replacement and perspective correction (Wave 2) ✅ **COMPLETED** (6 min, 3 tasks, 5 files)
- [x] 04-04-PLAN.md — Turkish voice commands with OpenAI Whisper API, recording UI (Wave 1) ✅ **COMPLETED** (7 min, 3 tasks, 10 files)
- [x] 04-05-PLAN.md — Wire AdvancedPhotoEditor to UI (Wave 2) ✅ **COMPLETED** (7 min, 3 tasks, 2 files)

### Phase 5: Telegram Bot & Publishing
**Goal**: Users can access the system via Telegram and publish listings to Turkish portals
**Depends on**: Phase 4
**Requirements**: ILET-03, ILET-04, ILET-05, PORT-05, PORT-06, PORT-07, PORT-08, ESLE-04, ESLE-05, ESLE-06, ESLE-07
**Success Criteria** (what must be TRUE):
  1. User can search properties via Telegram bot with natural language
  2. User can update property status from Telegram
  3. User receives Telegram notifications for new property matches
  4. User can publish listing from system to sahibinden.com, hepsiemlak, and emlakjet
  5. System automatically resizes photos to meet each portal's requirements
  6. New property triggers automatic notification to matching customers
  7. New customer sees suggested matching properties immediately
  8. User can view AI-generated price suggestion and valuation report for properties
**Plans**: 9 plans in 2 waves

Plans:
- [x] 05-01-PLAN.md — Telegram bot foundation with grammY, webhook setup, /start and /help commands (Wave 1) ✅ **COMPLETED**
- [x] 05-02-PLAN.md — Telegram search (/ara) and status update (/durum) commands with Claude AI (Wave 2) ✅ **COMPLETED**
- [x] 05-03-PLAN.md — Firestore triggers for automatic matching notifications (Wave 1) ✅ **COMPLETED**
- [x] 05-04-PLAN.md — Portal photo resizer and publishing infrastructure (Wave 1) ✅ **COMPLETED**
- [x] 05-05-PLAN.md — Portal publishers for sahibinden, hepsiemlak, emlakjet with Playwright (Wave 2) ✅ **COMPLETED**
- [x] 05-06-PLAN.md — AI price suggestions and valuation reports with Claude (Wave 1) ✅ **COMPLETED**
- [x] 05-07-PLAN.md — Gap closure: Wire Telegram notifications to matching triggers (Wave 1) ✅ **COMPLETED**
- [x] 05-08-PLAN.md — Gap closure: Complete portal publisher implementations (Wave 1) ✅ **COMPLETED**
- [x] 05-09-PLAN.md — Gap closure: Integrate ValuationCard in PropertyDetail (Wave 1) ✅ **COMPLETED**

### Phase 6: Mobile PWA & Sharing
**Goal**: Users can access the system as a mobile app with offline support and share properties via WhatsApp
**Depends on**: Phase 5
**Requirements**: MOBL-01, MOBL-02, MOBL-03, MOBL-04, MOBL-05, MOBL-06, MOBL-07, ILET-01, ILET-02
**Success Criteria** (what must be TRUE):
  1. User can install app on phone home screen and it works like native app
  2. User can view properties and customers while offline (in rural areas without signal)
  3. Changes made offline sync automatically when connection restored
  4. User can take photo with phone camera and upload directly to property
  5. User receives push notifications for new matches and updates
  6. User can share property card to WhatsApp with photos, details, and contact link
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

### Phase 7: Email & Advanced Features
**Goal**: Users can send email communications and filter customers effectively
**Depends on**: Phase 6
**Requirements**: ILET-06, ILET-07, MUST-06
**Success Criteria** (what must be TRUE):
  1. User can send property details to customer via email from system
  2. User can see email delivery status (sent/delivered/opened)
  3. User can filter customers by lead temperature (hot/cold) and view prioritized lists
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Compliance | 3/3 | Complete | 2026-02-19 |
| 2. AI Interface & Matching | 5/5 | Complete | 2026-02-20 |
| 3. Background Processing & Scraping | 6/6 | Complete | 2026-02-20 |
| 4. Media Enhancement & Voice | 5/5 | Complete | 2026-02-21 |
| 5. Telegram Bot & Publishing | 6/9 | Gap Closure | - |
| 6. Mobile PWA & Sharing | 0/3 | Not started | - |
| 7. Email & Advanced Features | 0/1 | Not started | - |
