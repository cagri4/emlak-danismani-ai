# Phase 3: Background Processing & Scraping - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can import properties from major Turkish real estate portals (sahibinden.com, hepsiemlak, emlakjet), upload photos in batch with async background processing, monitor competitor listings automatically, and see AI-scored lead temperatures. This phase builds the async job infrastructure and scraping capabilities.

</domain>

<decisions>
## Implementation Decisions

### Photo Upload Experience
- Drag-drop zone that's also clickable to browse (both methods available)
- Photos stay in upload order, star icon to select cover photo
- Per-photo progress indicator showing individual upload percentage
- User can navigate away while uploading - uploads continue in background with small header indicator

### Portal Import Flow
- Trigger: Paste URL in AI chat, AI parses the listing
- Review: Show preview of parsed fields, user confirms before saving
- Duplicates: Warn if similar property exists, ask "update existing" or "create new"
- Photos: Show linked previews first, download and store only after user confirms import

### Competitor Monitoring
- Track both: manual region+price criteria AND properties matching customer preferences
- Check frequency: Twice daily (morning and evening)
- Notifications: In-app notification bell on dashboard (Telegram channel added in Phase 5)
- Actions: View details + one-click import, then matching engine automatically notifies relevant customers

### Lead Scoring
- Scoring signals: Last interaction date + interaction frequency + decisions (liked/rejected) - all weighted
- Decay: Lead starts cooling after 14 days without communication
- Manual control: Boost/pin feature to mark important customers (no full override)
- Display: Color/badge in customer list + "Hot Leads" card on dashboard

### Claude's Discretion
- Exact scoring weights for lead temperature calculation
- Photo compression and thumbnail generation approach
- Scraping implementation details (rate limiting, retry logic)
- Background job queue implementation (Firebase functions, etc.)
- Notification bell UI design and interaction patterns

</decisions>

<specifics>
## Specific Ideas

- Portal import should feel instant - show preview quickly while photos load in background
- "Star as cover" pattern is simpler than drag-to-reorder for real estate agents
- Competitor monitoring should leverage existing matching engine - import first, then auto-match
- Phase 5 will add Telegram notifications to the same notification system built here

</specifics>

<deferred>
## Deferred Ideas

- Telegram/WhatsApp notifications for competitor alerts — Phase 5
- Email notifications — Phase 7
- Browser extension for easier portal import — not in current roadmap

</deferred>

---

*Phase: 03-background-processing-scraping*
*Context gathered: 2026-02-20*
