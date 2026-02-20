# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Emlakçının zamanını geri ver — AI manuel işleri yapar, emlakçı satışa odaklanır
**Current focus:** Phase 3 — Background Processing & Scraping (6 of 6 plans complete)

## Current Position

Phase: 3 of 7 (Background Processing & Scraping)
Plan: 6 of 6 in current phase
Status: Complete
Last activity: 2026-02-20 — Completed 03-06: Search Results Scraping

Progress: [████████░░] 38%

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 10 min
- Total execution time: 2.1 hours

**By Phase:**

| Phase | Plans | Total  | Avg/Plan |
|-------|-------|--------|----------|
| 01    | 3     | 35 min | 12 min   |
| 02    | 5     | 52 min | 10 min   |
| 03    | 4     | 40 min | 10 min   |

**Recent Trend:**
- Last 5 plans: 03-05 (8 min), 03-04 (12 min), 03-02 (15 min), 03-03 (19 min), 03-06 (6 min)
- Trend: Stable

*Updated after each plan completion*
| Phase 03-background-processing-scraping P03 | 19 | 3 tasks | 10 files |
| Phase 03 P05 | 8 | 3 tasks | 10 files |
| Phase 03-background-processing-scraping P04 | 12 | 3 tasks | 9 files |
| Phase 03-background-processing-scraping P02 | 921 | 3 tasks | 7 files |
| Phase 03 P06 | 6 | 2 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- AI-first natural language interface (core value prop)
- Firebase backend for rapid development with KVKK-compliant regional deployment
- Claude API for Turkish language AI with prompt caching from day one
- KVKK compliance built into Phase 1 foundation (cannot retrofit)
- Telegram bot prioritized over WhatsApp for easier API access
- Use Tailwind CSS v4 with @tailwindcss/postcss plugin (01-01)
- Separate useAuth context and useAuthActions hook for better separation (01-01)
- Turkish error messages for all Firebase auth errors (01-01)
- Scroll-to-enable pattern for KVKK consent (01-02)
- Store properties in users/{userId}/properties subcollection (01-02)
- Real-time listeners by default with option to disable (01-02)
- Quick status update on detail page via dropdown (01-02)
- Aggregate queries for dashboard metrics instead of real-time listeners (01-03)
- URL-persisted filters for shareable property search links (01-03)
- Client-side price filtering to avoid composite index complexity (01-03)
- Claude Sonnet 4.6 with prompt caching for 90% cost savings (01-03)
- 3 AI description variants with user selection pattern (01-03)
- Fixed suggestion chips for chat interface (02-02)
- Chat modal persists across route changes via context (02-02)
- Chat only visible when user is authenticated (02-02)
- Store customers in users/{userId}/customers subcollection (02-01)
- Store interactions in customers/{customerId}/interactions subcollection (02-01)
- Denormalize interactionCount for quick display (02-01)
- Multi-select for customer locations and property type preferences (02-01)
- Three-level urgency indicator with color coding (02-01)
- Inline note-adding on customer detail page (02-01)
- Use Claude Sonnet 4 with prompt caching from day one for AI commands (02-03)
- Confirmation-first pattern for all data mutations via AI (02-03)
- Turkish format normalization (2M -> 2000000, 3+1 rooms) (02-03)
- Embedded property/customer cards in chat messages (02-03)
- Pending confirmation state in useChat hook for multi-turn flows (02-03)
- Multi-factor scoring: location 30%, budget 30%, type 20%, rooms 20% (02-04)
- History penalty for past rejections (up to -20 points) (02-04)
- Template-based explanations for high matches, detailed for partial matches (02-04)
- Conversational Turkish explanations with 'ama' pattern for gaps (02-04)
- Store match outcomes in users/{userId}/match_outcomes collection (02-04)
- Europe-west1 region for all Cloud Functions (KVKK compliance) (03-01)
- Sharp for image processing (native performance) (03-01)
- 1GiB memory for image processor (prevents timeouts on large images) (03-01)
- Compress original in place (save storage costs) (03-01)
- Zustand for upload state (persists across navigation) (03-01)
- Schedule: 9 AM and 9 PM Turkey time for competitor monitoring (03-04)
- Monitor both manual criteria AND customer preferences automatically (03-04)
- Real-time notification updates using Firestore onSnapshot (03-04)
- Notification badge shows '9+' for counts > 9 (03-04)
- One-click import directly from notification dropdown (03-04)
- Exponential decay after 14 days for lead scoring (exp(-0.05 * days)) (03-05)
- Temperature thresholds: hot (30+), warm (15-30), cold (<15) (03-05)
- Boost adds fixed +20 bonus for important customers (03-05)
- Score weights: interactions (2pts), likes (5pts), rejects (-1pt) (03-05)
- Automatic recalculation on every interaction (03-05)
- react-dropzone for drag-drop upload (03-02)
- Native HTML5 drag-and-drop for photo reordering (03-02)
- Star icon pattern for cover photo selection (03-02)
- Header upload indicator with count (03-02)

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-20
Stopped at: Completed 03-06: Search Results Scraping (Phase 3 Complete)
Resume file: .planning/phases/03-background-processing-scraping/03-06-SUMMARY.md
Next action: Begin Phase 4 with 04-01 (first plan in next phase)
