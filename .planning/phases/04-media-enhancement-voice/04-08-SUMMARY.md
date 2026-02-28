---
phase: 04-media-enhancement-voice
plan: "08"
subsystem: ui
tags: [voice, MediaRecorder, cross-browser, safari, error-handling, tooltip]

# Dependency graph
requires:
  - phase: 04-media-enhancement-voice
    provides: useVoiceCommand hook and VoiceCommandInput component (04-04)
provides:
  - Runtime MIME type detection via MediaRecorder.isTypeSupported() fallback chain
  - Error type discrimination for permission denied vs not found vs not supported
  - Error tooltip positioned above microphone button (bottom-full)
affects: [voice-command-input, cross-browser-audio]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "MIME type fallback chain: query isTypeSupported() at runtime instead of hardcoding"
    - "Error discrimination by err.name for MediaRecorder/getUserMedia failures"
    - "Tooltip above button: bottom-full mb-2 when button is at viewport bottom"

key-files:
  created: []
  modified:
    - src/hooks/useVoiceCommand.ts
    - src/components/voice/VoiceCommandInput.tsx

key-decisions:
  - "MIME_TYPES fallback chain: webm;codecs=opus -> webm -> ogg;codecs=opus -> ogg -> mp4 -> browser default"
  - "mimeTypeRef persists detected MIME type so stopRecording creates blob with correct type"
  - "Error tooltip uses bottom-full mb-2 (above button) instead of top-full mt-2 (below, off-screen)"

patterns-established:
  - "MediaRecorder MIME type: always use isTypeSupported() fallback chain, never hardcode"
  - "getUserMedia errors: discriminate by err.name (NotAllowedError, NotFoundError, NotSupportedError)"
  - "Tooltip positioning: use bottom-full when host element is near viewport bottom"

requirements-completed: [AIUI-09, AIUI-10]

# Metrics
duration: 2min
completed: 2026-02-28
---

# Phase 04 Plan 08: Voice Command Cross-Browser Fix Summary

**Runtime MIME type fallback chain via MediaRecorder.isTypeSupported() and error type discrimination fix Safari/Firefox voice recording crash, plus tooltip repositioned above button so it stays on-screen**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-28T14:25:30Z
- **Completed:** 2026-02-28T14:27:06Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed hardcoded `audio/webm;codecs=opus` crashing on Safari/Firefox with NotSupportedError — replaced with runtime detection across 5 MIME types with browser-default fallback
- Fixed generic "Mikrofon izni reddedildi" catch-all error — now discriminates by err.name for specific Turkish messages (permission denied, not found, not supported, generic retry)
- Fixed error tooltip rendering off-screen below the chat input bar — now appears above the button using `bottom-full mb-2`

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix MIME type detection and error classification** - `0ee7035` (fix)
2. **Task 2: Fix error tooltip position above button** - `48f5ed6` (fix)

## Files Created/Modified
- `src/hooks/useVoiceCommand.ts` - MIME_TYPES fallback chain, mimeTypeRef, error type discrimination in catch block, blob creation using detected MIME type
- `src/components/voice/VoiceCommandInput.tsx` - Error tooltip changed from `top-full mt-2` to `bottom-full mb-2`

## Decisions Made
- MIME_TYPES fallback chain order: webm;codecs=opus first (Chrome optimal), then webm, ogg variants, mp4 (Safari), empty string (browser default) — covers all major browsers
- `mimeTypeRef` stores the detected MIME type so the async `stopRecording` callback can access it without stale closure issues
- Error tooltip uses `bottom-full mb-2` — the microphone button lives in the chat input bar at the bottom of the viewport, so `top-full` was pushing the tooltip below the visible area

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Voice input now works cross-browser (Chrome, Safari, Firefox) without crashing on unsupported MIME types
- Error messages provide actionable guidance in Turkish for each failure type
- Error tooltip always visible regardless of button position in viewport

---
*Phase: 04-media-enhancement-voice*
*Completed: 2026-02-28*
