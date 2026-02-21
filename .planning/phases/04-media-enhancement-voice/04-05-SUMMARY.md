---
phase: 04-media-enhancement-voice
plan: 05
subsystem: photo-enhancement
tags: [gap-closure, ui-integration, sky-replacement, perspective-correction]
requirements: [MULK-09, MULK-10]

dependency_graph:
  requires:
    - 04-03-PLAN.md (AdvancedPhotoEditor component implementation)
  provides:
    - UI access to sky replacement via Advanced Edit button
    - UI access to perspective correction via Advanced Edit button
    - Complete AdvancedPhotoEditor integration in PropertyDetail
  affects:
    - PhotoGrid component (new onAdvancedEdit prop)
    - PropertyDetail page (new modal and handlers)

tech_stack:
  added:
    - Wand2 icon from lucide-react
  patterns:
    - Modal state management pattern (follows PhotoEditor pattern)
    - Callback prop pattern for PhotoGrid actions
    - Gradient button styling for advanced features

key_files:
  created: []
  modified:
    - src/components/photos/PhotoGrid.tsx (added Advanced Edit button)
    - src/pages/PropertyDetail.tsx (wired AdvancedPhotoEditor with state and handlers)

decisions:
  - title: "Gradient button styling (purple-to-pink)"
    rationale: "Visually distinguishes advanced AI features from basic editing tools"
    alternatives: ["Solid color button", "Icon-only button"]

  - title: "Position between Pencil and PhotoEnhanceButton"
    rationale: "Logical grouping of transformation features in hover overlay"
    alternatives: ["First position", "Last position"]

  - title: "Follow PhotoEditor integration pattern exactly"
    rationale: "Consistency with existing code patterns, proven approach"
    alternatives: ["Custom integration pattern"]

metrics:
  duration_minutes: 7
  tasks_completed: 3
  files_modified: 2
  commits: 2
  build_time_seconds: 39
  completed_at: "2026-02-21T08:57:00Z"
---

# Phase 04 Plan 05: Wire AdvancedPhotoEditor to UI Summary

**One-liner:** Advanced Edit button with Wand2 icon enables user access to AI sky replacement and perspective correction features through PropertyDetail modal integration.

## Objective Achievement

**Goal:** Close verification gap - AdvancedPhotoEditor exists (371 lines) but is not accessible to users.

**Result:** ✅ COMPLETE
- Users can now click "Advanced Edit" button on property photos
- AdvancedPhotoEditor modal opens with selected photo
- Sky replacement (MULK-09) and perspective correction (MULK-10) accessible
- Integration follows PhotoEditor pattern for consistency

## Tasks Completed

### Task 1: Add "Advanced Edit" button to PhotoGrid hover overlay
**Commit:** 33762bf
**Duration:** ~3 minutes

**Changes:**
- Imported Wand2 icon from lucide-react
- Added `onAdvancedEdit?: (photo: PropertyPhoto) => void` prop to PhotoGridProps
- Rendered Advanced Edit button in hover overlay (lines 162-172)
- Gradient styling: `from-purple-500 to-pink-500` for visual distinction
- Button positioned between Pencil (edit) and PhotoEnhanceButton
- Title: "Gelişmiş düzenleyici (Gökyüzü değiştir, Perspektif düzelt)"
- Only renders when `onAdvancedEdit` prop provided

**Verification:**
```bash
✓ Build passed without TypeScript errors
✓ onAdvancedEdit prop found in PhotoGrid.tsx
✓ Wand2 icon imported
```

### Task 2: Wire AdvancedPhotoEditor to PropertyDetail with state and handlers
**Commit:** d2e57f7
**Duration:** ~3 minutes

**Changes:**
- Imported AdvancedPhotoEditor component
- Added `advancedEditingPhoto` state (line 36)
- Created `handleAdvancedEdit` handler (lines 205-207)
- Created `handleSaveAdvancedEdit` handler (lines 240-258)
  - Updates photo URL in Firestore with enhanced version
  - Closes modal after successful save
  - Error handling with user-friendly alert
- Passed `onAdvancedEdit={handleAdvancedEdit}` to PhotoGrid (line 530)
- Rendered AdvancedPhotoEditor modal conditionally (lines 590-598)

**Pattern consistency:**
```
PhotoEditor Pattern           → AdvancedPhotoEditor Pattern
editingPhoto                  → advancedEditingPhoto
handleEditPhoto               → handleAdvancedEdit
handleSaveCroppedPhoto        → handleSaveAdvancedEdit
{editingPhoto && <PhotoEditor />} → {advancedEditingPhoto && <AdvancedPhotoEditor />}
```

**Verification:**
```bash
✓ Build passed without TypeScript errors
✓ AdvancedPhotoEditor imported in PropertyDetail.tsx
✓ advancedEditingPhoto state found (7 occurrences)
✓ handleAdvancedEdit handler found
✓ handleSaveAdvancedEdit handler found
```

### Task 3: Verify integration and commit changes
**Duration:** ~1 minute

**Verification results:**
- ✅ Build passes without TypeScript errors (39s)
- ✅ AdvancedPhotoEditor component imported
- ✅ Button wiring verified: `onAdvancedEdit` prop in PhotoGrid
- ✅ Handler wiring verified: `onAdvancedEdit={handleAdvancedEdit}` in PropertyDetail
- ✅ State management verified: 7 occurrences of `advancedEditingPhoto`

**Integration chain verified:**
1. User hovers over photo → sees Wand2 button (purple-pink gradient)
2. User clicks Advanced Edit → `handleAdvancedEdit` sets `advancedEditingPhoto`
3. AdvancedPhotoEditor modal opens with selected photo
4. User applies sky replacement or perspective correction
5. User clicks Save → `handleSaveAdvancedEdit` updates Firestore
6. Modal closes, updated photo displays in PropertyDetail

## Deviations from Plan

None - plan executed exactly as written.

## Requirements Completed

- **MULK-09**: Sky replacement feature accessible via UI ✅
- **MULK-10**: Perspective correction feature accessible via UI ✅

## Verification Evidence

### Build Output
```
✓ 2836 modules transformed
✓ built in 38.82s
Exit code: 0
```

### Code Integration Points

**PhotoGrid.tsx:**
```typescript
// Line 2: Import
import { Star, Trash2, GripVertical, Pencil, Wand2 } from 'lucide-react';

// Line 12: Prop interface
onAdvancedEdit?: (photo: PropertyPhoto) => void;

// Lines 162-172: Button render
{onAdvancedEdit && (
  <button
    onClick={() => onAdvancedEdit(photo)}
    className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:from-purple-600 hover:to-pink-600 transition-colors"
    title="Gelişmiş düzenleyici (Gökyüzü değiştir, Perspektif düzelt)"
  >
    <Wand2 className="h-5 w-5 text-white" />
  </button>
)}
```

**PropertyDetail.tsx:**
```typescript
// Line 14: Import
import { AdvancedPhotoEditor } from '@/components/photos/AdvancedPhotoEditor'

// Line 36: State
const [advancedEditingPhoto, setAdvancedEditingPhoto] = useState<PropertyPhoto | null>(null)

// Lines 205-207: Handler
const handleAdvancedEdit = (photo: PropertyPhoto) => {
  setAdvancedEditingPhoto(photo)
}

// Lines 240-258: Save handler
const handleSaveAdvancedEdit = async (enhancedUrl: string) => {
  if (!id || !user || !advancedEditingPhoto || !property?.photos) return
  try {
    const updatedPhotos = property.photos.map((photo) =>
      photo.id === advancedEditingPhoto.id
        ? { ...photo, url: enhancedUrl }
        : photo
    )
    const propertyRef = doc(db, `users/${user.uid}/properties`, id)
    await updateDoc(propertyRef, { photos: updatedPhotos })
    setProperty({ ...property, photos: updatedPhotos })
    setAdvancedEditingPhoto(null)
  } catch (err) {
    console.error('Error saving advanced edit:', err)
    alert('Fotoğraf kaydedilemedi')
  }
}

// Line 530: PhotoGrid prop
onAdvancedEdit={handleAdvancedEdit}

// Lines 590-598: Modal
{advancedEditingPhoto && (
  <AdvancedPhotoEditor
    isOpen={!!advancedEditingPhoto}
    onClose={() => setAdvancedEditingPhoto(null)}
    imageUrl={advancedEditingPhoto.url}
    propertyId={id!}
    photoIndex={advancedEditingPhoto.order}
    onSave={handleSaveAdvancedEdit}
  />
)}
```

## Gap Closure Verification

**Gap identified:** AdvancedPhotoEditor component implemented (371 lines) but not accessible to users.

**Gap closed:** ✅
- Advanced Edit button visible in PhotoGrid hover overlay
- Click handler wired to open AdvancedPhotoEditor modal
- Save handler updates Firestore with enhanced photo URL
- Users can access sky replacement (MULK-09) and perspective correction (MULK-10)

## Success Criteria Met

- [x] AdvancedPhotoEditor component imported in PropertyDetail
- [x] advancedEditingPhoto state added
- [x] handleAdvancedEdit and handleSaveAdvancedEdit handlers created
- [x] PhotoGrid receives onAdvancedEdit prop
- [x] "Advanced Edit" button (Wand2 icon) renders in PhotoGrid hover overlay
- [x] AdvancedPhotoEditor modal conditionally rendered
- [x] Build passes without errors
- [x] Changes committed to git (2 atomic commits)
- [x] Requirements MULK-09 and MULK-10 unblocked
- [x] Verification gap closed: Users can access advanced photo features

## Technical Notes

### Pattern Consistency
This integration follows the exact same pattern as PhotoEditor modal:
1. State variable for currently editing photo
2. Handler to set state (opens modal)
3. Save handler to update Firestore and close modal
4. Conditional modal rendering based on state
5. PhotoGrid callback prop pattern

This consistency:
- Makes code easier to understand for future developers
- Reduces cognitive load when maintaining the codebase
- Follows established patterns already proven to work

### Button Styling Choice
The gradient button (`from-purple-500 to-pink-500`) was chosen to:
- Visually distinguish advanced AI features from basic editing
- Match the gradient used in AdvancedPhotoEditor component buttons
- Create visual hierarchy in the hover overlay

### Future Considerations
- Consider adding keyboard shortcuts for power users (e.g., 'A' for advanced edit)
- Could add tooltips showing example before/after for sky replacement
- May want to disable Advanced Edit button on photos already enhanced (prevent double-processing)

## Self-Check

### Files Created
None - this was pure integration of existing components.

### Files Modified
- [x] src/components/photos/PhotoGrid.tsx - EXISTS
- [x] src/pages/PropertyDetail.tsx - EXISTS

### Commits Verified
```bash
$ git log --oneline -3
d2e57f7 feat(04-05): wire AdvancedPhotoEditor to PropertyDetail with state and handlers
33762bf feat(04-05): add Advanced Edit button to PhotoGrid hover overlay
c9bc105 docs(04): create gap closure plan to wire AdvancedPhotoEditor to UI
```

- [x] Commit 33762bf exists (task 1)
- [x] Commit d2e57f7 exists (task 2)

### Build Verification
```bash
$ npm run build
✓ 2836 modules transformed
✓ built in 38.82s
Exit code: 0
```

- [x] Build successful
- [x] No TypeScript errors
- [x] No linting errors

## Self-Check: PASSED ✅

All files exist, all commits verified, build successful.
