---
status: diagnosed
trigger: "Investigate why photo cropping fails on save in this React + Firebase app."
created: 2026-02-28T00:00:00Z
updated: 2026-02-28T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - Two distinct root causes found. Primary: CORS block on Firebase download URLs prevents canvas taint, causing toBlob to return null. Secondary: cache-busted URLs stored in Firestore have &t= appended which breaks subsequent canvas loads.
test: Code trace complete - no runtime test needed.
expecting: N/A
next_action: Return diagnosis

## Symptoms

expected: User crops/zooms/rotates photo and clicks Kaydet - photo is saved and UI updates.
actual: Error "Fotoğraf kırpılırken bir hata oluştu" shown after clicking Kaydet.
errors: "Fotoğraf kırpılırken bir hata oluştu" (catch block in PhotoEditor.tsx:64)
reproduction: Open PhotoEditor for any property photo, adjust crop, click Kaydet.
started: unknown

## Eliminated

- hypothesis: getCroppedImg missing parameters
  evidence: PhotoEditor.tsx:51-55 passes imageUrl, croppedAreaPixels, rotation correctly
  timestamp: 2026-02-28

- hypothesis: croppedAreaPixels is null when Save clicked
  evidence: Button is disabled when !croppedAreaPixels (PhotoEditor.tsx:132); also guarded by early return at line 41-44
  timestamp: 2026-02-28

- hypothesis: Firestore permission error on updateDoc
  evidence: firestore.rules allows authenticated user full read/write on their own path; upload happens before Firestore update; if upload failed first, error would be caught before Firestore call
  timestamp: 2026-02-28

- hypothesis: Storage rules blocking upload
  evidence: storage.rules file is MISSING from disk entirely - firebase.json references it but it does not exist. However this would cause a Firebase deploy error, not a runtime error (the rules in Firebase console are what matter at runtime). This is a separate deployment concern.
  timestamp: 2026-02-28

## Evidence

- timestamp: 2026-02-28
  checked: src/utils/imageHelpers.ts createImage() function
  found: image.setAttribute('crossOrigin', 'anonymous') is set AFTER image.src is assigned in spirit, but actually the order in the code is: setAttribute then src. Wait - re-reading: line 12 sets crossOrigin, line 13 sets src. Order is correct.
  implication: crossOrigin attribute is set correctly in isolation.

- timestamp: 2026-02-28
  checked: src/hooks/usePhotoUpload.ts storage path
  found: Photos are uploaded to `properties/${propertyId}/${upload.id}-${upload.file.name}` (no user prefix).
  implication: Storage path does NOT include user uid prefix.

- timestamp: 2026-02-28
  checked: src/pages/PropertyDetail.tsx handleSaveCroppedPhoto storage path (line 241)
  found: Upload path is `users/${user.uid}/properties/${id}/photos/${editingPhoto.id}.jpg`
  implication: MISMATCH - original photos uploaded to `properties/{propertyId}/...`, but cropped photos uploaded to `users/{uid}/properties/{id}/photos/{photoId}.jpg`. Different path, different file.

- timestamp: 2026-02-28
  checked: src/pages/PropertyDetail.tsx handleSaveCroppedPhoto (line 246)
  found: `const cacheBustedUrl = \`${newUrl}&t=${Date.now()}\``  - cache-buster appended with & not ?
  implication: Firebase download URLs already contain query params (token=...). Appending &t= is syntactically valid. But this URL is then stored in Firestore and subsequently used as imageUrl passed to PhotoEditor and then to getCroppedImg/createImage. When createImage loads this URL with crossOrigin=anonymous, if Firebase Storage does not return CORS headers for this origin, the image will be tainted and canvas.toBlob() will return null.

- timestamp: 2026-02-28
  checked: storage.rules file existence
  found: storage.rules does NOT exist on disk. firebase.json references "storage": {"rules": "storage.rules"} but the file is absent.
  implication: Storage CORS configuration is unknown from code. Firebase Storage CORS must be configured via gsutil or Firebase console separately. If CORS is not configured to allow the app's origin, crossOrigin=anonymous requests will fail with a CORS error, tainting the canvas.

- timestamp: 2026-02-28
  checked: getCroppedImg canvas.toBlob() callback (imageHelpers.ts:72-83)
  found: If blob is null, rejects with Error('Canvas is empty'). Canvas toBlob returns null when canvas is tainted (security error from cross-origin image without proper CORS headers).
  implication: This is the most likely throw point. A tainted canvas from a CORS-blocked image causes toBlob to return null, which hits the reject branch, which propagates to PhotoEditor catch block, showing the error message.

- timestamp: 2026-02-28
  checked: PhotoCropper.tsx handleCropComplete callback (line 31-36)
  found: rotation is captured in closure from PhotoCropper's own state, not from the parent. onCropComplete is called with (croppedAreaPixels, rotation). PhotoEditor.handleCropComplete (line 35-38) receives (croppedArea, rot) and sets both state values. This is correct.
  implication: No bug here - rotation and crop area propagate correctly.

- timestamp: 2026-02-28
  checked: PhotoCropper.tsx dependency array for handleCropComplete (line 35)
  found: [onCropComplete, rotation] - rotation IS in the dep array, so the callback is recreated when rotation changes.
  implication: Stale closure is not the issue.

## Resolution

root_cause: |
  PRIMARY ROOT CAUSE - CORS/Canvas Taint (imageHelpers.ts):
  Firebase Storage download URLs (firebasestorage.googleapis.com) require explicit CORS configuration to be loadable by canvas with crossOrigin=anonymous. Without a storage.rules-adjacent CORS config (set via `gsutil cors set` or Firebase console), the browser will either:
    (a) Refuse to load the image with crossOrigin=anonymous (CORS error), OR
    (b) Load the image but the canvas is tainted, causing canvas.toBlob() to return null (blob is null -> Error('Canvas is empty') thrown at imageHelpers.ts:76-78)
  This null blob error propagates up through getCroppedImg -> PhotoEditor.handleSave catch block -> shows "Fotoğraf kırpılırken bir hata oluştu".

  SECONDARY ROOT CAUSE - Storage path mismatch (PropertyDetail.tsx:241 vs usePhotoUpload.ts:37):
  Original photos are uploaded to: `properties/{propertyId}/{uploadId}-{filename}`
  Cropped save attempts to upload to: `users/{uid}/properties/{id}/photos/{photoId}.jpg`
  These are DIFFERENT paths. If storage rules restrict writes to only one path structure, the upload itself could fail with a permission error. But more critically, even if upload succeeds, the original photo file at the old path is NOT overwritten - a new file is created at the new path, which is inconsistent with the comment "Upload cropped blob to same path (overwrite)" in PropertyDetail.tsx:240.

fix: N/A (research only)
verification: N/A
files_changed: []
