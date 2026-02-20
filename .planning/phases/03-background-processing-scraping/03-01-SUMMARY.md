# Phase 03 Plan 01: Cloud Functions & Upload Infrastructure Summary

**One-liner:** Firebase Cloud Functions v2 with sharp-based image processing (thumbnail generation, compression) and zustand-powered client upload state management

---

## Frontmatter

```yaml
phase: 03-background-processing-scraping
plan: 01
subsystem: background-processing
tags: [cloud-functions, image-processing, file-upload, state-management]
dependencies:
  requires:
    - firebase-functions: "^6.0.0"
    - firebase-admin: "^13.0.0"
    - sharp: "^0.33.0"
    - zustand: "^5.0.0"
  provides:
    - processPropertyPhoto: Cloud Function for automatic image processing
    - usePhotoUpload: Client hook for multi-file uploads with progress
    - useUploadStore: Zustand store for persistent upload state
  affects:
    - phase: 03
      plans: [02, 03, 04, 05]
      reason: Establishes Cloud Functions infrastructure for scrapers and schedulers
tech_stack:
  added:
    - Firebase Cloud Functions v2 (europe-west1)
    - sharp (image processing)
    - zustand (state management)
  patterns:
    - Storage triggers for automatic background processing
    - Zustand for cross-route state persistence
    - Error handling without retries on permanent failures
key_files:
  created:
    - functions/package.json: Cloud Functions dependencies
    - functions/tsconfig.json: TypeScript configuration for Functions
    - functions/src/config.ts: Firebase Admin initialization
    - functions/src/index.ts: Function exports
    - functions/src/jobs/imageProcessor.ts: Image processing Cloud Function
    - src/types/photo.ts: PhotoUpload and PropertyPhoto types
    - src/stores/uploadStore.ts: Zustand upload state store
    - src/hooks/usePhotoUpload.ts: Upload hook with progress tracking
  modified:
    - firebase.json: Added Cloud Functions configuration
    - .gitignore: Added functions/lib/ and functions/node_modules/
    - package.json: Added zustand dependency
decisions:
  - title: Europe-west1 region for KVKK compliance
    rationale: All Cloud Functions must run in EU region per Turkish data protection law
    alternatives: []
    impact: All future functions must specify europe-west1 region
  - title: Sharp for image processing
    rationale: Native performance, widely used, supports resize and compression
    alternatives: [jimp - slower, pure JS]
    impact: Requires native dependencies, may need deployment configuration
  - title: 1GiB memory for image processor
    rationale: Image processing needs memory, especially for large photos
    alternatives: [512MiB - may fail on large images]
    impact: Higher cost per invocation, but prevents timeouts
  - title: Compress original in place
    rationale: Save storage costs by replacing original with compressed version
    alternatives: [Keep original - wastes storage]
    impact: Original high-res image is lost, thumbnail preserved
  - title: Zustand for upload state
    rationale: Persists across navigation, simpler than Redux, no context provider needed
    alternatives: [React Context - lost on navigation, Redux - overkill]
    impact: Uploads continue in background when user navigates away
metrics:
  duration: 680
  completed_at: "2026-02-20T17:57:46Z"
  tasks_completed: 3
  files_created: 8
  files_modified: 2
  commits: 3
  deviations: 1
```

---

## What Was Built

### Infrastructure
- **Cloud Functions Project**: Initialized at `functions/` with TypeScript, firebase-functions v2, firebase-admin, and sharp
- **Firebase Configuration**: Updated `firebase.json` with Cloud Functions config, europe-west1 region, predeploy build script
- **TypeScript Setup**: Configured tsconfig.json for CommonJS (required by Cloud Functions), ES2022 target

### Image Processing
- **processPropertyPhoto Function**: Storage trigger on `properties/*` uploads
  - Generates 200x200 thumbnail (JPEG quality 80)
  - Compresses original to quality 85, overwrites original
  - Memory: 1GiB, Timeout: 120s
  - Region: europe-west1
  - Error handling prevents infinite retries

### Client Upload Infrastructure
- **PhotoUpload Type**: Tracks file, propertyId, order, progress, status, url, thumbnailUrl, error
- **PropertyPhoto Type**: Stored in Firestore property documents
- **useUploadStore**: Zustand store with:
  - addUploads, updateProgress, setComplete, setError actions
  - getUploadsForProperty, hasActiveUploads selectors
  - State persists across navigation (key feature)
- **usePhotoUpload Hook**: Multi-file upload with:
  - Per-file progress tracking
  - Storage path: `properties/{propertyId}/{id}-{filename}`
  - Automatic property document update with photo URLs
  - Background uploads continue when user navigates

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - ESM Import Fix] Fixed sharp import syntax**
- **Found during:** Task 3 commit preparation
- **Issue:** TypeScript linter required `import sharp from 'sharp'` instead of `import * as sharp from 'sharp'`
- **Fix:** Changed to default import (ESM pattern)
- **Files modified:** functions/src/jobs/imageProcessor.ts
- **Commit:** 40596de (included in Task 3 commit)

---

## Testing & Verification

### Build Verification
- ✅ `npm run build` passes (client TypeScript compilation)
- ✅ functions/tsconfig.json valid configuration
- ✅ useUploadStore exports correctly
- ✅ usePhotoUpload exports with correct return type

### Type Safety
- ✅ PhotoUpload interface defines upload state
- ✅ PropertyPhoto interface matches Firestore schema
- ✅ Zustand store types enforced

### Not Verified (requires deployment)
- ⏭️ Cloud Function deployment (requires `npm install` in functions/, firebase deploy)
- ⏭️ Image processor trigger on Storage upload
- ⏭️ Thumbnail generation and compression
- ⏭️ Client upload with progress tracking

---

## Impact on System

### Enables Future Work
- **Phase 03-02**: Portal scraper can use Cloud Functions infrastructure
- **Phase 03-03**: Competitor monitoring can use scheduled functions
- **Phase 03-04**: Import property from URL can use callable functions
- **Phase 03-05**: Telegram bot can use Cloud Functions for webhooks

### Architecture Changes
- Introduced Cloud Functions as background processing layer
- Established zustand as client state management pattern
- Created separation: client (React) → Storage → Cloud Functions → processing

### Performance Considerations
- Image processor runs in background (no client wait)
- Thumbnail generation enables fast loading in property lists
- Compression reduces storage costs
- 1GiB memory prevents timeouts on large images

---

## Known Issues & Limitations

### Deployment Required
- Cloud Functions code written but not deployed
- Requires `cd functions && npm install` before deployment
- Requires Firebase project with Cloud Functions enabled

### Storage Path Pattern
- Assumes `properties/{propertyId}/{filename}` path
- Other paths (user avatars, etc.) not handled
- Future: May need path pattern matching or separate functions

### Thumbnail Pattern
- Uses `-thumb.jpg` suffix (hardcoded)
- Must match pattern in useUploadStore.setComplete()
- Consider: Make pattern configurable

---

## Next Steps

1. **Deployment**: Run `cd functions && npm install && firebase deploy --only functions`
2. **Testing**: Upload a property photo, verify thumbnail generation
3. **UI Integration**: Create photo upload component using usePhotoUpload hook
4. **Monitoring**: Add Cloud Logging for image processor errors

---

## Self-Check

### Files Created
- ✅ FOUND: functions/package.json
- ✅ FOUND: functions/tsconfig.json
- ✅ FOUND: functions/src/config.ts
- ✅ FOUND: functions/src/index.ts
- ✅ FOUND: functions/src/jobs/imageProcessor.ts
- ✅ FOUND: src/types/photo.ts
- ✅ FOUND: src/stores/uploadStore.ts
- ✅ FOUND: src/hooks/usePhotoUpload.ts

### Commits Exist
- ✅ FOUND: 16ab09a (Task 1: Initialize Cloud Functions)
- ✅ FOUND: 32b5720 (Task 2: Image processor function)
- ✅ FOUND: 40596de (Task 3: Client upload infrastructure)

### Exports Verified
- ✅ useUploadStore exported from src/stores/uploadStore.ts
- ✅ usePhotoUpload exported from src/hooks/usePhotoUpload.ts
- ✅ processPropertyPhoto exported from functions/src/index.ts

## Self-Check: PASSED
