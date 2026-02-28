---
phase: 04-media-enhancement-voice
plan: "06"
subsystem: ui
tags: [canvas, cors, firebase-storage, photo-editing, react]

# Dependency graph
requires:
  - phase: 04-media-enhancement-voice
    provides: getCroppedImg utility and PhotoGrid component from earlier photo editing plans

provides:
  - CORS-safe canvas crop using fetch+createObjectURL pattern
  - Storage path aligned to root properties/ upload path
  - flex-wrap layout preventing button overflow on narrow photo cards
  - Normalized Sparkles button icon sizes matching other action buttons

affects:
  - photo-editing
  - photo-grid-layout

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "fetch + createObjectURL to bypass CORS canvas taint for Firebase Storage images"
    - "URL.revokeObjectURL after toBlob to prevent memory leaks"
    - "flex-wrap on action button containers for narrow-card overflow safety"

key-files:
  created: []
  modified:
    - src/utils/imageHelpers.ts
    - src/pages/PropertyDetail.tsx
    - src/components/photos/PhotoGrid.tsx
    - src/components/photos/PhotoEnhanceButton.tsx

key-decisions:
  - "Use fetch + createObjectURL instead of crossOrigin='anonymous' to prevent Firebase Storage CORS canvas taint"
  - "Storage path for crop save uses root properties/${id}/ to match upload path in usePhotoUpload.ts"
  - "flex-wrap on action buttons allows wrapping to second row rather than clipping on narrow cards"

patterns-established:
  - "Fetch-as-blob pattern: when drawing remote images on canvas, fetch the URL as a blob and create an object URL to avoid cross-origin canvas taint"

requirements-completed: [MULK-07, MULK-08]

# Metrics
duration: 1min
completed: 2026-02-28
---

# Phase 04 Plan 06: Photo Crop CORS Fix and Button Overflow Fix Summary

**Photo crop save fixed via fetch+createObjectURL CORS bypass; all 5 action buttons now visible via flex-wrap on narrow photo cards**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-28T14:25:33Z
- **Completed:** 2026-02-28T14:26:40Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Fixed canvas taint error by replacing `crossOrigin='anonymous'` with `fetch + createObjectURL` — Firebase Storage does not serve CORS headers for the anonymous attribute pattern, causing `canvas.toBlob()` to silently return null
- Fixed storage path mismatch: crop save now writes to `properties/${id}/${photoId}.jpg` matching the root-level upload path used in `usePhotoUpload.ts` (was incorrectly using `users/${uid}/properties/...`)
- Added `flex-wrap` to photo action button container so all 5 buttons (Star, Pencil, Wand2, Sparkles, Trash) wrap gracefully on narrow `lg:grid-cols-4` cards instead of being clipped by `overflow-hidden`
- Normalized Sparkles and Loader2 icon sizes from `h-5 w-5` to `h-4 w-4 sm:h-5 sm:w-5` to match all other action button icons

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix photo crop CORS taint and storage path mismatch** - `fb16a89` (fix)
2. **Task 2: Fix sparkles button overflow — flex-wrap and normalized button sizes** - `09a28f1` (fix)

## Files Created/Modified
- `src/utils/imageHelpers.ts` - Replaced crossOrigin attribute approach with fetch+createObjectURL CORS bypass; revoke URL after toBlob
- `src/pages/PropertyDetail.tsx` - Fixed storage path from `users/${uid}/properties/${id}/photos/` to `properties/${id}/`
- `src/components/photos/PhotoGrid.tsx` - Added `flex-wrap` and reduced `gap-2` to `gap-1` on action button container
- `src/components/photos/PhotoEnhanceButton.tsx` - Normalized Sparkles/Loader2 icon sizes to `h-4 w-4 sm:h-5 sm:w-5`

## Decisions Made
- Use `fetch + createObjectURL` pattern rather than CORS headers because Firebase Storage serves download URLs with auth tokens that don't work with `crossOrigin='anonymous'` on canvas — the object URL approach avoids taint entirely since object URLs are same-origin
- Fixed storage path to `properties/${id}/` to match the upload hook's existing path structure rather than inventing a separate path hierarchy
- `flex-wrap` preferred over `overflow-visible` because the card's `overflow-hidden` is required for the `rounded-lg` aesthetic — wrapping to a second row is better UX than horizontal scrolling

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Photo crop functionality is unblocked — users can now crop photos without the "fotoğraf kırpılırken bir hata oluştu" error
- All 5 photo action buttons are visible on hover, including the Sparkles one-click enhancement button
- Ready to continue with plans 04-07 and 04-08

---
*Phase: 04-media-enhancement-voice*
*Completed: 2026-02-28*

## Self-Check: PASSED

All required files verified present:
- src/utils/imageHelpers.ts - FOUND
- src/pages/PropertyDetail.tsx - FOUND
- src/components/photos/PhotoGrid.tsx - FOUND
- src/components/photos/PhotoEnhanceButton.tsx - FOUND
- .planning/phases/04-media-enhancement-voice/04-06-SUMMARY.md - FOUND

All task commits verified:
- fb16a89 (Task 1: CORS fix + storage path) - FOUND
- 09a28f1 (Task 2: flex-wrap + icon sizes) - FOUND
