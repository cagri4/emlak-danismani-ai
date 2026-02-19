# Roadmap: Emlak Danışmanı AI Asistanı

## Overview

This roadmap delivers an AI-first real estate CRM for Turkish agents in 7 phases. We start with auth and basic property management to prove Firebase + Next.js works, then immediately add AI text generation to validate the core value prop. Phases 2-3 build the conversational AI interface and scraping infrastructure. Phases 4-5 add media processing, Telegram bot, and portal publishing. Phases 6-7 complete multi-channel access with PWA and email features. Each phase delivers verifiable user-facing capabilities, with KVKK compliance and prompt caching built into the foundation from day one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Compliance** - Auth, basic property CRUD, KVKK compliance, basic AI text generation
- [ ] **Phase 2: AI Interface & Matching** - Natural language commands, customer management, property-customer matching
- [ ] **Phase 3: Background Processing & Scraping** - Photo upload, portal import, competitor monitoring, async job processing
- [ ] **Phase 4: Media Enhancement & Voice** - AI photo editing, voice commands (Türkçe)
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
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD
- [ ] 01-03: TBD

### Phase 2: AI Interface & Matching
**Goal**: Users can interact with the system using natural Turkish language and get intelligent property-customer matches
**Depends on**: Phase 1
**Requirements**: MUST-01, MUST-02, MUST-03, MUST-04, AIUI-01, AIUI-02, AIUI-03, AIUI-04, AIUI-05, AIUI-06, AIUI-08, ESLE-01, ESLE-02, ESLE-03
**Success Criteria** (what must be TRUE):
  1. User can add properties by typing "3+1 daire Ankara Çankaya 2M TL" in chat interface
  2. User can add customers and their preferences using natural language
  3. User can search properties using natural Turkish queries ("Bodrum'da 10-20M arası villalar")
  4. User can update property status by saying "Çankaya daireyi satıldı yap"
  5. User can type "Mehmet için mülk bul" and see matching properties with match scores and reasons
  6. AI maintains conversation context across multi-step commands
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

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
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Media Enhancement & Voice
**Goal**: Users can enhance property photos with AI and give voice commands in Turkish
**Depends on**: Phase 3
**Requirements**: MULK-07, MULK-08, MULK-09, MULK-10, AIUI-09, AIUI-10
**Success Criteria** (what must be TRUE):
  1. User can crop property photos within the interface
  2. AI automatically enhances photos (HDR, brightness, contrast adjustment)
  3. AI can replace cloudy skies with blue skies in property photos
  4. AI corrects perspective distortion in photos
  5. User can speak commands in Turkish and see them executed (e.g., "Yeni mülk ekle")
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

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
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

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
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Compliance | 0/3 | Not started | - |
| 2. AI Interface & Matching | 0/3 | Not started | - |
| 3. Background Processing & Scraping | 0/3 | Not started | - |
| 4. Media Enhancement & Voice | 0/2 | Not started | - |
| 5. Telegram Bot & Publishing | 0/3 | Not started | - |
| 6. Mobile PWA & Sharing | 0/3 | Not started | - |
| 7. Email & Advanced Features | 0/1 | Not started | - |
