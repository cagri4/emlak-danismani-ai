# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Emlakçının zamanını geri ver — AI manuel işleri yapar, emlakçı satışa odaklanır
**Current focus:** Phase 5 — Telegram Bot & Publishing (8 of 9 plans complete)

## Current Position

Phase: 5 of 7 (Telegram Bot & Publishing)
Plan: 8 of 9 in current phase
Status: In Progress
Last activity: 2026-02-21 — Completed 05-09: ValuationCard Integration (Gap Closure)

Progress: [█████████░] 66%

## Performance Metrics

**Velocity:**
- Total plans completed: 22
- Average duration: 7 min
- Total execution time: 3.5 hours

**By Phase:**

| Phase | Plans | Total  | Avg/Plan |
|-------|-------|--------|----------|
| 01    | 3     | 35 min | 12 min   |
| 02    | 5     | 52 min | 10 min   |
| 03    | 4     | 40 min | 10 min   |
| 04    | 5     | 52 min | 10 min   |
| 05    | 7     | 35 min | 5 min    |

**Recent Trend:**
- Last 5 plans: 05-03 (8 min), 05-04 (8 min), 05-01 (9 min), 05-02 (7 min), 05-07 (3 min)
- Trend: Improving

*Updated after each plan completion*
| Phase 05 P09 | 5 | 2 tasks | 1 files |
| Phase 05 P02 | 7 | 3 tasks | 5 files |
| Phase 03 P05 | 8 | 3 tasks | 10 files |
| Phase 03-background-processing-scraping P04 | 12 | 3 tasks | 9 files |
| Phase 03-background-processing-scraping P02 | 921 | 3 tasks | 7 files |
| Phase 03 P06 | 6 | 2 tasks | 1 files |
| Phase 04 P04 | 7 | 3 tasks | 10 files |
| Phase 04 P01 | 15 | 3 tasks | 7 files |
| Phase 04 P02 | 17 | 3 tasks | 7 files |
| Phase 04 P03 | 6 | 3 tasks | 5 files |
| Phase 04 P03 | 6 | 3 tasks | 5 files |
| Phase 04-media-enhancement-voice P05 | 7 | 3 tasks | 2 files |
| Phase 05 P03 | 8 | 3 tasks | 4 files |
| Phase 05 P04 | 8 | 3 tasks | 4 files |
| Phase 05 P06 | 8 | 3 tasks | 6 files |
| Phase 05 P01 | 9 | 3 tasks | 7 files |
| Phase 05 P02 | 7 | 3 tasks | 5 files |
| Phase 05 P07 | 193 | 2 tasks | 2 files |
| Phase 05 P09 | 5 | 2 tasks | 1 files |

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
- OpenAI Whisper API chosen for accurate Turkish speech recognition over Web Speech API (04-04)
- Hold-to-speak pattern for voice input (press and hold microphone button) (04-04)
- Base64 encoding for audio blob transmission to Cloud Function (04-04)
- 60-second recording limit (Whisper API maximum) (04-04)
- Transcribed text appears in input field for user confirmation before sending (04-04)
- europe-west1 region for Cloud Function (KVKK compliance) (04-04)
- react-easy-crop for interactive photo cropping (mobile-friendly with pinch-to-zoom) (04-01)
- Canvas API for client-side crop extraction (no server processing needed) (04-01)
- Overwrite original photo in Storage (save storage costs, simpler UX) (04-01)
- Cache-buster query param to force browser refresh after crop (04-01)
- JPEG output at 0.95 quality for good balance of quality/size (04-01)
- Auto enhancement preset used by default (brightness 1.1, saturation 1.1) (04-02)
- Enhanced photos marked with _enhanced suffix in filename (04-02)
- Sharp pipeline: rotate → normalise → modulate → sharpen (04-02)
- 1GiB memory allocation for enhancement Cloud Function (handles large images) (04-02)
- Toast notifications via sonner for user feedback (04-02)
- [Phase 04-03]: Cloudinary gen_background_replace for AI sky replacement (04-03)
- [Phase 04-03]: Download Cloudinary images back to Firebase Storage for consistent ownership (04-03)
- [Phase 04-05]: Gradient button styling (purple-to-pink) for Advanced Edit button to distinguish AI features
- [Phase 04-05]: Follow PhotoEditor integration pattern for AdvancedPhotoEditor modal consistency
- [Phase 05]: Duplicate scoring logic in Cloud Functions for isolation (avoid importing client code)
- [Phase 05]: 60% score threshold for matching notifications (balances relevance with discovery)
- [Phase 05]: Top 5 matches limit to prevent notification spam
- [Phase 05-04]: Portal specs based on research: sahibinden 800x600, hepsiemlak/emlakjet 1024x768
- [Phase 05-04]: Quality reduction loop (85 -> 60) prevents oversized photos
- [Phase 05-04]: Concurrency limit of 3 for parallel processing
- [Phase 05-04]: Progressive JPEG with mozjpeg optimization for best compression
- [Phase 05-01]: grammY framework chosen for TypeScript-first Telegram bot with webhook support
- [Phase 05-01]: Webhook deployment pattern for serverless Cloud Functions (vs long polling)
- [Phase 05-06]: Claude Sonnet 4 for accurate Turkish market analysis
- [Phase 05-06]: Two-function approach (quick price vs full report)
- [Phase 05-06]: Progressive disclosure UI pattern (price first, then full report)
- [Phase 05]: Claude Sonnet 4 for Turkish NLP query parsing in /ara command
- [Phase 05-02]: Fuzzy matching with 60% threshold for property identification
- [Phase 05-02]: Placeholder userId from Telegram chat ID for testing before user linking
- [Phase 05]: Fire-and-forget Telegram notifications prevent blocking triggers

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-21
Stopped at: Completed 05-09: ValuationCard Integration (Gap Closure)
Resume file: .planning/phases/05-telegram-bot-publishing/05-09-SUMMARY.md
Next action: Continue Phase 5 - proceed to plan 05-08 (last remaining plan)
