# Phase 03 Plan 02: Photo Upload UI Summary

**One-liner:** Drag-drop photo uploader with react-dropzone, native HTML5 drag-and-drop grid reordering, star-to-cover selection, and persistent upload state via zustand header indicator

---

## Frontmatter

```yaml
phase: 03-background-processing-scraping
plan: 02
subsystem: photo-management
tags: [photo-upload, drag-drop, ui, progress-tracking, file-management]
dependencies:
  requires:
    - react-dropzone: "^14.0.0"
    - 03-01: usePhotoUpload hook and upload state infrastructure
  provides:
    - PhotoUploader: Drag-drop upload component
    - PhotoGrid: Photo management grid with reordering and cover selection
    - UploadProgressIndicator: Per-file upload progress display
    - Header upload indicator: Background upload notification
  affects:
    - phase: 03
      plans: [04, 05]
      reason: Photo upload UI ready for portal scrapers and URL importers
tech_stack:
  added:
    - react-dropzone: Drag-drop file upload
  patterns:
    - Native HTML5 drag-and-drop for photo reordering
    - Star icon pattern for cover photo selection
    - Per-file progress bars with status icons
    - Header indicator for background uploads
key_files:
  created:
    - src/components/photos/PhotoUploader.tsx: Drag-drop upload component
    - src/components/photos/PhotoGrid.tsx: Photo grid with reordering and cover selection
    - src/components/photos/UploadProgressIndicator.tsx: Per-file progress display
  modified:
    - src/pages/PropertyDetail.tsx: Integrated photo upload and management
    - src/components/layout/Header.tsx: Added upload indicator
    - src/types/property.ts: Changed photos from string[] to PropertyPhoto[]
    - src/components/property/PropertyCard.tsx: Fixed to use PropertyPhoto.url
    - src/pages/Customers.tsx: Removed unused import (blocking fix)
    - package.json: Added react-dropzone dependency
decisions:
  - title: react-dropzone for drag-drop upload
    rationale: Industry standard, excellent browser support, handles edge cases
    alternatives: [Custom HTML5 file input - more work, less reliable]
    impact: Clean drag-drop UX with minimal code
  - title: Native HTML5 drag-and-drop for reordering
    rationale: Simple use case (single dimension), no library needed, lightweight
    alternatives: [@hello-pangea/dnd - overkill for simple reorder]
    impact: Zero dependencies, straightforward implementation
  - title: Star icon for cover photo selection
    rationale: Clear visual metaphor, one-click selection
    alternatives: [Right-click menu - hidden, Checkbox - less intuitive]
    impact: Intuitive UX, no explanation needed
  - title: Header upload indicator with count
    rationale: Non-intrusive notification that uploads continue in background
    alternatives: [Toast notifications - annoying, Modal - blocking]
    impact: User aware of background activity without disruption
metrics:
  duration: 921
  completed_at: "2026-02-20T18:24:26Z"
  tasks_completed: 3
  files_created: 3
  files_modified: 4
  commits: 3
  deviations: 1
```

---

## What Was Built

### Photo Upload Components
- **PhotoUploader**: Drag-drop zone with click-to-browse fallback
  - Accept: image/jpeg, image/png, image/webp
  - Max files: 20 (per MULK-05 requirement)
  - Visual feedback: Blue border and background on drag-active
  - Turkish text: "Fotoğrafları sürükleyin veya tıklayarak seçin"
  - Upload icon from lucide-react
  - Automatic upload on drop via usePhotoUpload hook

- **UploadProgressIndicator**: Per-file progress display
  - Filename (truncated if > 20 chars)
  - Progress bar (0-100%)
  - Status icons: Loader2 (uploading), CheckCircle (done), XCircle (error)
  - Error message display for failed uploads
  - Compact list format in gray background card

- **PhotoGrid**: Photo management with reordering and cover selection
  - Responsive grid: 2 columns (mobile), 3 (tablet), 4 (desktop)
  - Native HTML5 drag-and-drop for reordering
  - Visual feedback: opacity on drag, ring on drop target
  - Hover overlay with action buttons (when editable):
    - Star icon: Set as cover (filled yellow if current cover)
    - Trash icon: Delete photo
    - Grip handle: Visual drag indicator
  - Cover badge: "Kapak" in top-left corner of cover photo
  - Empty state: "Henüz fotoğraf eklenmemiş" with upload prompt

### Integration
- **PropertyDetail.tsx**: Photos section added
  - PhotoUploader component
  - UploadProgressIndicator (shown when uploads active)
  - PhotoGrid with full editing capabilities
  - Handlers:
    - handleReorderPhotos: Updates Firestore with new order
    - handleSetCover: Marks photo as cover (only one at a time)
    - handleDeletePhoto: Removes from Firestore and deletes from Storage
    - handleUploadComplete: Refreshes property to get new photos

- **Header.tsx**: Upload indicator
  - Shows when hasActiveUploads() returns true
  - Displays count of uploading photos
  - Spinning loader icon
  - Text: "3 fotoğraf yükleniyor" (example)
  - Positioned before notification bell

### Type Updates
- **Property type**: Changed `photos?: string[]` to `photos?: PropertyPhoto[]`
- **PropertyPhoto interface**: id, url, thumbnailUrl, order, isCover, uploadedAt
- **PropertyCard**: Fixed to use `photo.thumbnailUrl || photo.url` instead of direct string

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused Customer import from Customers.tsx**
- **Found during:** Task 2 build verification
- **Issue:** TypeScript build failed due to unused import `import { Customer } from '@/types/customer'`
- **Root cause:** Pre-existing code issue unrelated to current work
- **Fix:** Removed unused import to unblock build
- **Files modified:** src/pages/Customers.tsx
- **Commit:** dd5a213 (Task 2 commit)
- **Rationale:** Per Rule 3 (auto-fix blocking issues), pre-existing errors that prevent completing current task should be fixed automatically

**2. [Rule 1 - Bug Fix] Updated PropertyCard to use PropertyPhoto object**
- **Found during:** Task 3 build verification
- **Issue:** PropertyCard expected photos to be string[], but type changed to PropertyPhoto[]
- **Root cause:** Type change from string[] to PropertyPhoto[] in Task 3
- **Fix:** Changed `property.photos![0]` to `property.photos![0].thumbnailUrl || property.photos![0].url`
- **Files modified:** src/components/property/PropertyCard.tsx
- **Commit:** 0e2fde8 (Task 3 commit)
- **Rationale:** Code broke as direct result of current task changes (type modification)

---

## Testing & Verification

### Build Verification
- ✅ `npm run build` passes (all TypeScript compilation successful)
- ✅ react-dropzone added to package.json dependencies
- ✅ All photo components export correctly
- ✅ PropertyDetail integrates all components without errors
- ✅ Header upload indicator compiles

### Type Safety
- ✅ PhotoUploader props typed correctly
- ✅ PhotoGrid handlers typed with PropertyPhoto[]
- ✅ UploadProgressIndicator receives PhotoUpload[]
- ✅ Property type updated to PropertyPhoto[]

### Not Verified (requires runtime)
- ⏭️ Drag-drop file upload functionality
- ⏭️ Upload progress tracking
- ⏭️ Photo grid drag-and-drop reordering
- ⏭️ Cover photo selection persistence
- ⏭️ Photo deletion from Storage
- ⏭️ Header indicator appears during uploads
- ⏭️ Upload state persists across navigation

---

## Impact on System

### User Experience
- **Multi-file upload**: Drag 10-20 photos at once, no multiple clicks
- **Visual progress**: See each file's upload percentage in real-time
- **Background uploads**: Navigate away, uploads continue (zustand persistence)
- **Cover selection**: One-click star icon to set cover photo
- **Photo reordering**: Drag-and-drop to arrange photos
- **Non-blocking**: Header indicator keeps user informed without modal/toast spam

### Architecture
- **Type change**: photos field now structured (PropertyPhoto[]) instead of flat (string[])
- **Component structure**: Separation of concerns (uploader, grid, progress)
- **State management**: Upload state in zustand, photo data in Firestore
- **Storage integration**: Photos stored in Storage, metadata in Firestore

### Future Work Enablement
- **Phase 03-04**: Portal scraper can use same photo upload infrastructure
- **Phase 03-05**: URL import can leverage upload progress tracking
- **Phase 04**: Property portals can display photos with cover selection
- **Phase 05**: Telegram bot can receive photos and use same storage pattern

---

## Known Issues & Limitations

### Upload Limits
- Max 20 photos per property (enforced by react-dropzone)
- No file size limit (should add in future)
- No image dimension validation (accepts any size)

### Reordering
- Native HTML5 drag-and-drop is desktop-focused
- Mobile drag might be less smooth than library-based solution
- No drag preview customization

### Storage Deletion
- If Storage deletion fails, Firestore still updated (orphaned files)
- No retry logic for failed deletions
- No batch delete for multiple photos

### Cover Photo
- Only one cover allowed (enforced by UI logic)
- Cover photo not enforced on upload (first photo is cover by default in usePhotoUpload)
- No validation that cover photo exists if user deletes it

---

## Next Steps

1. **Runtime testing**: Upload photos to property, verify progress tracking
2. **Drag-drop testing**: Reorder photos, verify Firestore update
3. **Cover selection**: Star a photo, verify isCover flag persistence
4. **Mobile testing**: Test drag-and-drop on touch devices
5. **Error handling**: Test failed uploads, verify error display
6. **Navigation persistence**: Upload photos, navigate away, verify uploads continue
7. **Header indicator**: Verify shows during uploads, hides when complete

---

## Self-Check

### Files Created
- ✅ FOUND: src/components/photos/PhotoUploader.tsx
- ✅ FOUND: src/components/photos/PhotoGrid.tsx
- ✅ FOUND: src/components/photos/UploadProgressIndicator.tsx

### Files Modified
- ✅ FOUND: src/pages/PropertyDetail.tsx
- ✅ FOUND: src/components/layout/Header.tsx
- ✅ FOUND: src/types/property.ts
- ✅ FOUND: src/components/property/PropertyCard.tsx

### Commits Exist
- ✅ FOUND: 246b664 (Task 1: PhotoUploader and UploadProgressIndicator)
- ✅ FOUND: dd5a213 (Task 2: PhotoGrid with drag-drop reordering)
- ✅ FOUND: 0e2fde8 (Task 3: Integration into PropertyDetail and Header)

### Exports Verified
- ✅ PhotoUploader exported from src/components/photos/PhotoUploader.tsx
- ✅ PhotoGrid exported from src/components/photos/PhotoGrid.tsx
- ✅ UploadProgressIndicator exported from src/components/photos/UploadProgressIndicator.tsx

## Self-Check: PASSED
