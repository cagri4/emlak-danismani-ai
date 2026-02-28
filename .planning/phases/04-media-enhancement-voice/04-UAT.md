---
status: diagnosed
phase: 04-media-enhancement-voice
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md
started: 2026-02-28T12:00:00Z
updated: 2026-02-28T12:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Photo Cropping
expected: Mülk detay sayfasında fotoğraf üzerine gelince kalem (edit) ikonu görünür. Tıklayınca PhotoEditor modal açılır. Fotoğrafı sürükleyerek kırpabilir, zoom (1-3x) ve döndürme (0-360°) kontrolleri çalışır. Kaydet'e basınca kırpılmış fotoğraf güncellenir.
result: issue
reported: "kaydet e kadar işlevler çalışıyor ama kaydet e basınca fotoğraf kırpılırken bir hata oluştu mesajı var"
severity: major

### 2. Photo Enhancement (One-Click)
expected: Fotoğraf üzerine gelince sparkles (iyileştir) ikonu görünür. Tıklayınca loading spinner gösterilir. İşlem tamamlanınca fotoğraf parlaklık/kontrast iyileştirilmiş olarak güncellenir ve toast bildirimi görünür. Zaten iyileştirilmiş fotoğrafta buton devre dışı olur.
result: issue
reported: "sparkles butonu resimler üzerinde görünmüyor, sadece 3 ikon görünüyor. tıklayınca gelişmiş düzenleyici açıldı. ayarlarla oynayınca kaydet butonu aktif olmuyor deaktif olarak duruyor"
severity: major

### 3. Advanced Photo Editor Access
expected: Fotoğraf üzerine gelince mor-pembe gradient'li Wand2 (sihirli değnek) ikonu görünür. Tıklayınca AdvancedPhotoEditor modal açılır. Modal'da iki tab var: "Enhance" (parlaklık/doygunluk slider'ları) ve "Advanced" (Gökyüzü Değiştir, Perspektif Düzelt butonları).
result: issue
reported: "önceki testteki buton bu editörü açtı. editör açılıyor ama ne ayar değişikliği yaparsan yap kaydet butonu aktif olmuyor, hep deaktif kalıyor"
severity: major

### 4. AI Sky Replacement
expected: AdvancedPhotoEditor > Advanced tab'da "Gökyüzü Değiştir" butonuna tıklayınca loading overlay görünür. İşlem 10-30 saniye sürer. Tamamlanınca bulutlu/gri gökyüzü mavi gökyüzüne dönüşür. Before/after karşılaştırma toggle butonu ile önce/sonra görülebilir. (Cloudinary yapılandırması gerektirir)
result: issue
reported: "çalışmıyor. herhangi bir edit olduğuna dair bir belirti yok. kaydet butonu aktif olmuyor"
severity: major

### 5. AI Perspective Correction
expected: AdvancedPhotoEditor > Advanced tab'da "Perspektif Düzelt" butonuna tıklayınca loading overlay görünür. İşlem tamamlanınca eğik çizgiler düzeltilir. Before/after toggle ile karşılaştırma yapılabilir. (Cloudinary yapılandırması gerektirir)
result: issue
reported: "loading overlay görünmedi. çalışmıyor"
severity: major

### 6. Voice Command Input
expected: Chat arayüzünde mikrofon butonu görünür. Basılı tutunca kayıt başlar — nabız efekti ve zamanlayıcı gösterilir. Bırakınca Türkçe konuşma metne çevrilir ve chat input alanında görünür. Kullanıcı metni düzenleyip gönderebilir. (OpenAI API key gerektirir)
result: issue
reported: "mikrofon butonu var ama basılı tutunca bir şey olmuyor"
severity: major

## Summary

total: 6
passed: 0
issues: 6
pending: 0
skipped: 0

## Gaps

- truth: "Kaydet'e basınca kırpılmış fotoğraf güncellenir"
  status: failed
  reason: "User reported: kaydet e kadar işlevler çalışıyor ama kaydet e basınca fotoğraf kırpılırken bir hata oluştu mesajı var"
  severity: major
  test: 1
  root_cause: "Canvas taint from missing Firebase Storage CORS config. createImage() sets crossOrigin='anonymous' but bucket has no CORS headers → canvas.toBlob() returns null → reject('Canvas is empty'). Secondary: storage path mismatch between upload (properties/{id}/...) and crop save (users/{uid}/properties/{id}/photos/...)"
  artifacts:
    - path: "src/utils/imageHelpers.ts"
      issue: "canvas.toBlob() returns null on tainted canvas (lines 71-83)"
    - path: "src/pages/PropertyDetail.tsx"
      issue: "handleSaveCroppedPhoto uses wrong storage path (line 241)"
  missing:
    - "Firebase Storage CORS configuration (gsutil cors set)"
    - "Use blob URL or fetch-then-createObjectURL to bypass CORS"
    - "Fix storage path to match upload path in usePhotoUpload.ts"
  debug_session: ".planning/debug/photo-crop-save-error.md"
- truth: "Sparkles ikonu fotoğraflarda görünür ve one-click iyileştirme çalışır"
  status: failed
  reason: "User reported: sparkles butonu resimler üzerinde görünmüyor, sadece 3 ikon var. ayarlarla oynayınca kaydet butonu aktif olmuyor"
  severity: major
  test: 2
  root_cause: "CSS overflow-hidden on photo card clips 4th/5th buttons in 5-button flex row. PhotoGrid line 117 has overflow-hidden, line 144 has 5 buttons (Star, Pencil, Wand2, Sparkles, Trash) with justify-center gap-2. At lg:grid-cols-4 widths, Sparkles and Trash overflow and get clipped."
  artifacts:
    - path: "src/components/photos/PhotoGrid.tsx"
      issue: "overflow-hidden on card (line 117) clips 4th/5th buttons in flex row (line 144)"
    - path: "src/components/photos/PhotoEnhanceButton.tsx"
      issue: "Uses h-5 w-5 fixed size (line 79) unlike other buttons that use h-4 w-4 sm:h-5 sm:w-5"
  missing:
    - "Reduce button count or use flex-wrap/overflow-x-auto"
    - "Normalize button sizes across all action buttons"
  debug_session: ""
- truth: "AdvancedPhotoEditor'da ayar değiştirince Kaydet butonu aktif olur ve değişiklikler kaydedilir"
  status: failed
  reason: "User reported: ne ayar değişikliği yaparsan yap kaydet butonu aktif olmuyor, hep deaktif kalıyor"
  severity: major
  test: 3
  root_cause: "Save button disabled condition is `!enhancedUrl` (line 361). enhancedUrl starts null (line 38) and only gets set inside Cloud Function success callback (lines 62-63). Slider onChange handlers only update local brightness/saturation state — they never call setEnhancedUrl. Cloud Function calls likely fail due to auth or URL parsing issues, so enhancedUrl never gets set."
  artifacts:
    - path: "src/components/photos/AdvancedPhotoEditor.tsx"
      issue: "Save disabled on !enhancedUrl (line 361); sliders don't set enhancedUrl; enhancedUrl only set in CF success callback (lines 62-63)"
    - path: "functions/src/jobs/photoEnhancement.ts"
      issue: "URL parsing assumes Firebase Storage format with /o/ (lines 100-104); auth check at line 57-59"
  missing:
    - "Track 'dirty' state from slider changes to enable Save independently"
    - "Or apply client-side preview with Canvas before Cloud Function call"
  debug_session: ""
- truth: "Gökyüzü Değiştir butonuna tıklayınca AI sky replacement çalışır ve sonuç görünür"
  status: failed
  reason: "User reported: çalışmıyor. herhangi bir edit olduğuna dair belirti yok. kaydet butonu aktif olmuyor"
  severity: major
  test: 4
  root_cause: "Cloudinary env vars (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) not configured. isCloudinaryConfigured() returns false (cloudinaryService.ts:73-79), Cloud Function throws failed-precondition immediately (photoEnhancement.ts:108-114). enhancedUrl never set → Save stays disabled."
  artifacts:
    - path: "functions/src/services/cloudinaryService.ts"
      issue: "isCloudinaryConfigured() requires 3 env vars that are not set (lines 73-79)"
    - path: "functions/src/jobs/photoEnhancement.ts"
      issue: "Throws failed-precondition when Cloudinary not configured (lines 108-114)"
  missing:
    - "Set Cloudinary env vars via firebase functions:config:set"
    - "Show clearer error message to user when Cloudinary not configured"
  debug_session: ""
- truth: "Perspektif Düzelt butonuna tıklayınca loading overlay görünür ve perspektif düzeltilir"
  status: failed
  reason: "User reported: loading overlay görünmedi. çalışmıyor"
  severity: major
  test: 5
  root_cause: "Same as Test 4 — Cloudinary not configured. isCloudinaryConfigured() returns false, Cloud Function throws immediately. No loading overlay appears because the error is thrown before processing starts."
  artifacts:
    - path: "functions/src/services/cloudinaryService.ts"
      issue: "isCloudinaryConfigured() requires 3 env vars that are not set (lines 73-79)"
    - path: "functions/src/jobs/photoEnhancement.ts"
      issue: "Throws failed-precondition when Cloudinary not configured (lines 108-114)"
  missing:
    - "Set Cloudinary env vars via firebase functions:config:set"
    - "Show loading overlay immediately on button click, before CF call resolves"
  debug_session: ""
- truth: "Mikrofon butonuna basılı tutunca kayıt başlar, nabız efekti ve zamanlayıcı gösterilir"
  status: failed
  reason: "User reported: mikrofon butonu var ama basılı tutunca bir şey olmuyor"
  severity: major
  test: 6
  root_cause: "Three compounding bugs: (1) Hardcoded audio/webm;codecs=opus MIME type crashes on Safari/some Firefox (useVoiceCommand.ts:43-44). (2) Generic catch block shows wrong error message 'Mikrofon izni reddedildi' for all failures (useVoiceCommand.ts:68-70). (3) Error tooltip positioned below button with top-full, renders off-screen since button is at bottom of viewport (VoiceCommandInput.tsx:121-126)."
  artifacts:
    - path: "src/hooks/useVoiceCommand.ts"
      issue: "Hardcoded unsupported MIME type (line 43-44); generic catch swallows real error (line 68-70)"
    - path: "src/components/voice/VoiceCommandInput.tsx"
      issue: "Error tooltip positioned off-screen with top-full (lines 121-126)"
  missing:
    - "Use MediaRecorder.isTypeSupported() to pick MIME type at runtime"
    - "Distinguish error types in catch block (NotAllowedError vs NotSupportedError)"
    - "Change error tooltip position from top-full to bottom-full"
  debug_session: ".planning/debug/microphone-button-does-nothing.md"
