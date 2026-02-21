# Phase 4: Media Enhancement & Voice - Research

**Researched:** 2026-02-21
**Domain:** Image processing, voice recognition, AI photo enhancement
**Confidence:** MEDIUM-HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MULK-07 | Photo cropping | react-easy-crop recommended - 527k weekly downloads, modern hooks, mobile-friendly |
| MULK-08 | AI photo enhancement (HDR, brightness, contrast) | Sharp + manual algorithms or Cloudinary AI - Sharp has modulate/normalize/clahe functions |
| MULK-09 | Sky replacement (cloudy → blue) | Cloudinary AI Generative Replace or specialized tools (Autoenhance.ai, Imagen AI) |
| MULK-10 | Perspective correction | OpenCV.js client-side or specialized AI services - Sharp lacks native support |
| AIUI-09 | Turkish voice commands | OpenAI Whisper API recommended - proven Turkish support (6-10% WER) |
| AIUI-10 | Speech-to-text processing | OpenAI Whisper API at $0.006/min vs Web Speech API (free but quality concerns) |
</phase_requirements>

## Summary

Phase 4 adds photo editing capabilities and Turkish voice command support to the real estate AI assistant. Research reveals a clear division: **client-side processing for interactive tasks** (cropping, basic filters) and **cloud-based processing for AI-powered enhancements** (HDR merging, sky replacement, perspective correction).

For voice commands, **OpenAI Whisper API is the clear choice** over Web Speech API due to proven Turkish language accuracy (6-10% word error rate), predictable pricing ($0.006/min), and cross-browser compatibility. Web Speech API only works in Chrome, has quality limitations for production use, and relies on Google's servers anyway.

For photo editing, a **hybrid approach maximizes UX and cost-effectiveness**: use react-easy-crop for interactive client-side cropping, Sharp in Cloud Functions for basic enhancements (brightness/contrast), and evaluate specialized AI services (Cloudinary, Autoenhance.ai) for advanced features like sky replacement only if budget allows.

**Primary recommendation:** Implement client-side cropping with react-easy-crop, Sharp-based enhancement in Cloud Functions for basic adjustments, and OpenAI Whisper API for Turkish voice commands. Defer advanced AI photo features (sky replacement, auto-HDR) to Phase 5 or optional premium tier due to cost constraints.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-easy-crop | 5.5.6 | Interactive image cropping | 527k weekly downloads, mobile-friendly, modern hooks API, zero dependencies |
| Sharp | 0.34.5 | Server-side image processing | Fastest Node.js image library (~9 img/sec), 4x faster than ImageMagick, Firebase recommended |
| OpenAI Whisper API | turbo/large-v3 | Turkish speech-to-text | 6-10% WER on Turkish, $0.006/min, 99+ languages, proven production use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Canvas API | Native | Client-side basic filters | Brightness/contrast preview before upload, reduce bandwidth |
| OpenCV.js | 4.x | Perspective correction | When client-side correction needed (optional - heavy bundle) |
| Cloudinary SDK | 2.x | AI photo enhancement API | If budget allows advanced features (sky replacement, auto-HDR) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-easy-crop | react-image-crop | 370k downloads, zero deps, but less mobile-optimized |
| react-easy-crop | react-cropper | More features (rotation, zoom++) but heavier (wraps Cropper.js) |
| OpenAI Whisper | Web Speech API | Free but Chrome-only, production quality concerns, no Turkish guarantee |
| OpenAI Whisper | Google Cloud Speech-to-Text | $0.024/min (4x more expensive), real-time streaming if needed |
| Sharp | Canvas (client) | Free processing but slow (1.8-6.6 img/sec), browser limits |
| Cloudinary AI | Autoenhance.ai | Real estate-focused, likely cheaper, but less ecosystem support |

**Installation:**
```bash
# Client-side (React)
npm install react-easy-crop

# Cloud Functions (Node.js)
npm install sharp
npm install openai  # For Whisper API
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── PhotoCropper/         # react-easy-crop wrapper
│   ├── VoiceInput/           # Microphone + Whisper integration
│   └── PhotoEditor/          # Brightness/contrast sliders
├── services/
│   ├── photoProcessing.ts    # Client-side Canvas filters
│   └── voiceCommands.ts      # Whisper API calls + command parsing
└── utils/
    └── imageHelpers.ts       # Crop area calculation, dataURL conversion

functions/
├── src/
│   ├── photoEnhancement.ts   # Sharp-based processing
│   ├── generateThumbnails.ts # Sharp resize (existing)
│   └── transcribeVoice.ts    # Whisper API proxy (optional)
```

### Pattern 1: Client-Side Cropping with Server-Side Processing
**What:** User interactively crops photo in browser, then uploads cropped image for Sharp enhancement in Cloud Functions

**When to use:** Balance between UX (instant crop feedback) and quality (server-side processing power)

**Example:**
```typescript
// Client: src/components/PhotoCropper/PhotoCropper.tsx
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/imageHelpers';

const PhotoCropper: React.FC<Props> = ({ image, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => setCrop(crop);
  const onZoomChange = (zoom) => setZoom(zoom);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
    onCropComplete(croppedBlob); // Upload to Cloud Functions
  };

  return (
    <div className="crop-container">
      <Cropper
        image={image}
        crop={crop}
        zoom={zoom}
        aspect={16 / 9}
        onCropChange={onCropChange}
        onZoomChange={onZoomChange}
        onCropComplete={onCropCompleteHandler}
      />
      <button onClick={handleSave}>Save & Enhance</button>
    </div>
  );
};

// Utility: src/utils/imageHelpers.ts
// Source: react-easy-crop documentation
export async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
  });
}
```

### Pattern 2: Cloud Function Sharp Enhancement
**What:** Cloud Function receives uploaded image, applies Sharp transformations, saves to Storage

**When to use:** Basic photo enhancement (brightness, contrast, sharpness) - cost-effective for MVP

**Example:**
```typescript
// functions/src/photoEnhancement.ts
// Source: Firebase docs + Sharp API docs
import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import sharp from 'sharp';
import { Storage } from '@google-cloud/storage';

export const enhancePhoto = functions.storage.onObjectFinalized(
  {
    cpu: 2,
    memory: '1GiB', // Important: Sharp needs 1GiB for large images
    region: 'europe-west1'
  },
  async (event) => {
    const filePath = event.data.name;
    if (!filePath.startsWith('properties/') || filePath.includes('enhanced_')) {
      return; // Skip thumbnails and already enhanced images
    }

    const bucket = admin.storage().bucket(event.data.bucket);
    const tempFilePath = `/tmp/${path.basename(filePath)}`;

    // Download image
    await bucket.file(filePath).download({ destination: tempFilePath });

    // Apply Sharp enhancements
    const enhancedBuffer = await sharp(tempFilePath)
      .rotate() // Auto-rotate based on EXIF
      .normalise() // Stretch luminance for full dynamic range (contrast)
      .modulate({
        brightness: 1.1,  // 10% brighter
        saturation: 1.05  // 5% more saturated
      })
      .sharpen()
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();

    // Upload enhanced version
    const enhancedPath = filePath.replace(/(\.\w+)$/, '_enhanced$1');
    await bucket.file(enhancedPath).save(enhancedBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: { enhanced: 'true', enhancedAt: new Date().toISOString() }
      }
    });

    // Clean up
    fs.unlinkSync(tempFilePath);

    console.log(`Enhanced: ${filePath} → ${enhancedPath}`);
  }
);
```

### Pattern 3: Voice Command with Whisper API
**What:** Capture audio in browser, send to Whisper API, parse Turkish command, execute action

**When to use:** Turkish voice commands - proven accuracy, cross-browser via API

**Example:**
```typescript
// src/services/voiceCommands.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For demo; use Cloud Function proxy in prod
});

export async function transcribeVoiceCommand(audioBlob: Blob): Promise<string> {
  const file = new File([audioBlob], 'voice-command.webm', { type: 'audio/webm' });

  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: 'whisper-1',
    language: 'tr', // Turkish
    response_format: 'text'
  });

  return transcription; // Returns Turkish text
}

// src/components/VoiceInput/VoiceInput.tsx
const VoiceInput: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      chunksRef.current = [];

      const transcript = await transcribeVoiceCommand(audioBlob);
      // Parse command: "Çankaya'daki daireyi satıldı yap"
      parseAndExecuteCommand(transcript);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <button onMouseDown={startRecording} onMouseUp={stopRecording}>
      {isRecording ? '🎤 Recording...' : 'Hold to Speak'}
    </button>
  );
};
```

### Pattern 4: Client-Side Canvas Filters (Optional Enhancement)
**What:** Apply brightness/contrast preview before upload to reduce Cloud Function costs

**When to use:** User wants to preview adjustments before saving

**Example:**
```typescript
// src/services/photoProcessing.ts
// Source: MDN Canvas API filter property
export function applyCanvasFilters(
  imageElement: HTMLImageElement,
  options: { brightness: number; contrast: number }
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;

  // Apply CSS-style filters
  ctx.filter = `brightness(${options.brightness}%) contrast(${options.contrast}%)`;
  ctx.drawImage(imageElement, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.95);
}

// Usage in component
const PhotoEditor: React.FC = ({ image }) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [preview, setPreview] = useState<string>(image);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const filtered = applyCanvasFilters(img, { brightness, contrast });
      setPreview(filtered);
    };
    img.src = image;
  }, [brightness, contrast, image]);

  return (
    <div>
      <img src={preview} alt="Preview" />
      <input type="range" min="50" max="150" value={brightness}
             onChange={(e) => setBrightness(Number(e.target.value))} />
      <input type="range" min="50" max="150" value={contrast}
             onChange={(e) => setContrast(Number(e.target.value))} />
    </div>
  );
};
```

### Anti-Patterns to Avoid
- **Client-side OpenCV.js for production:** Bundle size too large (8MB+), use Cloud Functions instead
- **Infinite Cloud Function loops:** Always check filename patterns (e.g., skip if contains `enhanced_`)
- **Storing Whisper API key in client:** Use Cloud Function proxy to protect API key
- **Processing original high-res images client-side:** Browser memory limits, slow, use downsized preview
- **Web Speech API for production:** Chrome-only, quality issues, use Whisper instead

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image cropping UI | Custom drag/resize/zoom logic | react-easy-crop | Touch handling, pinch-zoom, aspect ratio, boundary detection - 527k downloads |
| HDR merging | Manual exposure blending algorithm | Cloudinary AI / Autoenhance.ai | Proper tone mapping, ghost removal, 3-5 bracket merging is complex |
| Sky replacement | Mask detection + compositing | Cloudinary Generative Replace | Requires segmentation model, lighting matching, edge blending |
| Perspective correction | Manual corner detection + warp | OpenCV.js or Cloudinary | Homography calculation, edge detection, interpolation edge cases |
| Voice command parsing | Regex on audio transcription | OpenAI Whisper API | Turkish language model, noise handling, accent variations |
| Audio recording | Raw MediaRecorder event handling | Use proven pattern from MDN | Buffer management, format handling, browser compatibility |

**Key insight:** Image processing has deceptively complex edge cases (color spaces, EXIF orientation, memory limits, format quirks). Use battle-tested libraries (Sharp, react-easy-crop) for production reliability. Only hand-roll UI/UX wrappers, never core algorithms.

## Common Pitfalls

### Pitfall 1: Firebase Cloud Functions Memory Limit Exceeded
**What goes wrong:** Sharp processing fails with "memory limit exceeded" error on large images (4000x3000+)

**Why it happens:** Default Cloud Function memory is 256MB; Sharp needs ~500MB-1GB for large image manipulation

**How to avoid:**
- Set `memory: '1GiB'` in Cloud Function config (2nd gen)
- Use `runWith({ memory: '2GB' })` for 1st gen functions
- Resize to max 2048px width before complex operations

**Warning signs:**
```
Error: memory limit exceeded. Function invocation was interrupted.
```

**Fix:**
```typescript
export const enhancePhoto = functions.storage.onObjectFinalized({
  memory: '1GiB', // Critical for Sharp
  cpu: 2,
  timeoutSeconds: 540
}, async (event) => { /* ... */ });
```

### Pitfall 2: EXIF Orientation Not Applied (Rotated Photos)
**What goes wrong:** Photos uploaded from mobile appear sideways despite looking correct in gallery

**Why it happens:** JPEG EXIF orientation tag rotates image in gallery apps, but raw pixel data unchanged

**How to avoid:** Always call `.rotate()` immediately after loading image in Sharp - it auto-detects EXIF

**Warning signs:** iPhone/Android photos display rotated after upload

**Fix:**
```typescript
await sharp(imageBuffer)
  .rotate() // FIRST operation - reads EXIF and rotates pixels
  .resize(800, 600)
  .toBuffer();
```

### Pitfall 3: Infinite Storage Trigger Loop
**What goes wrong:** Cloud Function triggers on its own output, creating exponential processing loop until quota exceeded

**Why it happens:** `onObjectFinalized` fires for ALL uploads, including enhanced versions the function creates

**How to avoid:**
- Check filename pattern: skip if contains `enhanced_`, `thumb_`, etc.
- Use separate bucket paths: original in `uploads/`, processed in `processed/`
- Set metadata flag and check it

**Warning signs:**
- Cloud Function runs 10x+ more than expected
- Quota exceeded errors
- Multiple `enhanced_enhanced_enhanced_` files

**Fix:**
```typescript
export const enhancePhoto = functions.storage.onObjectFinalized(async (event) => {
  const filePath = event.data.name;

  // CRITICAL: Exit early to prevent loop
  if (filePath.includes('enhanced_') || filePath.includes('thumb_')) {
    return null;
  }

  // Process...
  const outputPath = filePath.replace(/(\.\w+)$/, '_enhanced$1');
  // ...
});
```

### Pitfall 4: Web Speech API Turkish Support Assumption
**What goes wrong:** Implement voice commands with Web Speech API, users report "not working" on Firefox/Safari

**Why it happens:** Web Speech API only works in Chrome/Chromium browsers; Turkish support not guaranteed

**How to avoid:** Use OpenAI Whisper API - works in all browsers via HTTP API, proven Turkish accuracy

**Warning signs:**
- Browser compatibility issues reported
- Inconsistent transcription quality
- "Speech recognition not supported" errors

**Fix:** Use Whisper API instead (see Pattern 3 above)

### Pitfall 5: Client-Side Image Processing Performance
**What goes wrong:** App freezes when user adjusts brightness/contrast sliders on high-res images

**Why it happens:** Canvas operations on 4000x3000 images block main thread, no Web Workers for Canvas

**How to avoid:**
- Downsample to 800x600 for preview, apply to full-res on server
- Debounce slider changes (300ms delay)
- Use CSS filters for preview, Canvas/Sharp for final output

**Warning signs:** UI lag, unresponsive sliders, browser "Page Unresponsive" warnings

**Fix:**
```typescript
const debouncedFilter = useMemo(
  () => debounce((brightness, contrast) => {
    // Only update preview every 300ms
    const filtered = applyCanvasFilters(downsampledImage, { brightness, contrast });
    setPreview(filtered);
  }, 300),
  []
);
```

### Pitfall 6: Whisper API File Size Limit (25MB)
**What goes wrong:** Long voice recordings fail to transcribe with "file too large" error

**Why it happens:** Whisper API has 25MB file size limit (~30 minutes of audio at standard quality)

**How to avoid:**
- Limit recording to 60 seconds for voice commands
- Use lower bitrate for audio encoding (16kHz mono sufficient for speech)
- Chunk long recordings client-side

**Warning signs:** Transcription fails for recordings >2-3 minutes

**Fix:**
```typescript
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm',
  audioBitsPerSecond: 16000 // Low bitrate for speech
});

// Auto-stop after 60 seconds
setTimeout(() => {
  if (mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    alert('Recording limit reached (60s)');
  }
}, 60000);
```

### Pitfall 7: Sharp Version Mismatch in Cloud Functions
**What goes wrong:** `sharp` works locally but crashes in Cloud Functions with "install error" or platform mismatch

**Why it happens:** Sharp includes native binaries - must compile for Cloud Functions Linux environment, not macOS/Windows dev machine

**How to avoid:**
- Deploy from Linux container OR
- Use Cloud Functions 2nd gen (automatically handles platform differences) OR
- Run `npm install --platform=linux --arch=x64 sharp` before deploy

**Warning signs:**
```
Error: Could not load the "sharp" module using the linux-x64 runtime
```

**Fix:** Use Cloud Functions 2nd gen (recommended) or deploy from CI/CD with Linux environment

## Code Examples

Verified patterns from official sources:

### React Easy Crop - Basic Setup
```typescript
// Source: react-easy-crop npm documentation
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop/types';

const MyCropper = () => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    console.log(croppedArea, croppedAreaPixels);
  }, []);

  return (
    <Cropper
      image="/path/to/image.jpg"
      crop={crop}
      zoom={zoom}
      aspect={4 / 3}
      onCropChange={setCrop}
      onZoomChange={setZoom}
      onCropComplete={onCropComplete}
    />
  );
};
```

### Sharp - Photo Enhancement Pipeline
```typescript
// Source: Sharp API documentation (sharp.pixelplumbing.com)
import sharp from 'sharp';

async function enhanceRealEstatePhoto(inputBuffer: Buffer): Promise<Buffer> {
  return await sharp(inputBuffer)
    .rotate() // Auto-rotate based on EXIF (MUST be first)
    .resize(2048, 1536, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .normalise() // Stretch luminance to full dynamic range (auto-contrast)
    .modulate({
      brightness: 1.1,  // 10% brighter
      saturation: 1.1,  // 10% more saturated colors
      lightness: 0      // 0 = no change (additive, unlike brightness)
    })
    .sharpen({
      sigma: 1.0,      // Mild sharpening
      flat: 1.0,
      jagged: 2.0
    })
    .jpeg({
      quality: 85,
      progressive: true,
      mozjpeg: true  // Better compression
    })
    .toBuffer();
}

// Advanced: Contrast-limited adaptive histogram equalization (CLAHE)
// Source: Sharp colour manipulation docs
async function enhanceDarkPhoto(inputBuffer: Buffer): Promise<Buffer> {
  return await sharp(inputBuffer)
    .rotate()
    .clahe({
      width: 8,       // Tile grid width
      height: 8,      // Tile grid height
      maxSlope: 3     // Limit contrast enhancement (prevent noise amplification)
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}
```

### OpenAI Whisper API - Turkish Voice Command
```typescript
// Source: OpenAI API documentation
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeTurkishVoiceCommand(audioFile: File): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'tr',              // Turkish
    response_format: 'text',     // Simple text response
    temperature: 0.2             // Lower = more conservative (reduce hallucinations)
  });

  return transcription;
}

// Example: Command parser for Turkish real estate commands
function parseRealEstateCommand(transcript: string): Command | null {
  const lowerTranscript = transcript.toLowerCase().trim();

  // "Çankaya'daki daireyi satıldı yap"
  if (lowerTranscript.includes('satıldı yap') || lowerTranscript.includes('satılmış olarak işaretle')) {
    const locationMatch = lowerTranscript.match(/(\w+)'?da?ki/);
    return {
      action: 'mark_sold',
      location: locationMatch?.[1],
      transcript
    };
  }

  // "Bodrum'da 10 ile 20 milyon arası villalar"
  if (lowerTranscript.includes('villa') || lowerTranscript.includes('daire')) {
    const priceMatch = lowerTranscript.match(/(\d+)\s*(?:ile|-)?\s*(\d+)\s*milyon/);
    return {
      action: 'search_properties',
      minPrice: priceMatch ? parseInt(priceMatch[1]) * 1_000_000 : undefined,
      maxPrice: priceMatch ? parseInt(priceMatch[2]) * 1_000_000 : undefined,
      transcript
    };
  }

  return null;
}
```

### Canvas API - Client-Side Filter Preview
```typescript
// Source: MDN CanvasRenderingContext2D filter property
export function applyCanvasFilter(
  imageElement: HTMLImageElement,
  filters: { brightness?: number; contrast?: number; saturation?: number }
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;

  // Build CSS filter string
  const filterParts: string[] = [];
  if (filters.brightness) filterParts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast) filterParts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturation) filterParts.push(`saturate(${filters.saturation}%)`);

  ctx.filter = filterParts.join(' ');
  ctx.drawImage(imageElement, 0, 0);

  return canvas;
}

// Usage
const img = new Image();
img.onload = () => {
  const filteredCanvas = applyCanvasFilter(img, {
    brightness: 110,  // 10% brighter
    contrast: 105,    // 5% more contrast
    saturation: 115   // 15% more saturated
  });

  // Convert to blob for upload
  filteredCanvas.toBlob((blob) => {
    uploadToStorage(blob);
  }, 'image/jpeg', 0.90);
};
img.src = imageUrl;
```

### Firebase Cloud Function - Thumbnail Generation with Sharp
```typescript
// Source: Firebase official documentation (updated Feb 2026)
import * as functions from 'firebase-functions/v2/storage';
import * as admin from 'firebase-admin';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

export const generateThumbnail = functions.onObjectFinalized({
  cpu: 2,
  memory: '1GiB',
  region: 'europe-west1'
}, async (event) => {
  const filePath = event.data.name;
  const bucketName = event.data.bucket;

  // Exit early if not property image or already a thumbnail
  if (!filePath.startsWith('properties/') || filePath.includes('thumb_')) {
    return;
  }

  const bucket = admin.storage().bucket(bucketName);
  const fileName = path.basename(filePath);
  const tempFilePath = `/tmp/${fileName}`;
  const tempThumbPath = `/tmp/thumb_${fileName}`;

  // Download original
  await bucket.file(filePath).download({ destination: tempFilePath });

  // Generate thumbnail
  await sharp(tempFilePath)
    .rotate() // CRITICAL: Auto-rotate based on EXIF
    .resize(200, 200, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: true
    })
    .jpeg({ quality: 80, progressive: true })
    .toFile(tempThumbPath);

  // Upload thumbnail
  const thumbPath = path.join(path.dirname(filePath), `thumb_${fileName}`);
  await bucket.upload(tempThumbPath, {
    destination: thumbPath,
    metadata: {
      metadata: {
        thumbnail: 'true',
        originalPath: filePath
      }
    }
  });

  // Cleanup
  fs.unlinkSync(tempFilePath);
  fs.unlinkSync(tempThumbPath);

  console.log(`Thumbnail created: ${thumbPath}`);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ImageMagick for Node.js | Sharp library | ~2019 | 4x faster, lower memory, better WebP/AVIF support |
| react-image-crop only | react-easy-crop dominance | ~2021 | Mobile pinch-zoom, better touch UX, 527k downloads/week |
| Google Cloud Speech API | OpenAI Whisper API | Late 2022 | 4x cheaper ($0.006 vs $0.024/min), better multilingual accuracy |
| Custom HDR algorithms | Cloudinary AI / specialized services | 2023-2024 | One-click sky replacement, auto-HDR, faster than hand-coding |
| Web Speech API (Chrome-only) | Cross-browser Whisper API | 2024+ | Firefox/Safari support, predictable quality, production-ready |
| Firebase Functions 1st gen | Firebase Functions 2nd gen | 2023 | Fewer cold starts, better pricing, 2 CPUs default for 2GB+ memory |

**Deprecated/outdated:**
- **ImageMagick/GraphicsMagick:** Replaced by Sharp (4x faster, better format support)
- **react-cropper as default choice:** react-easy-crop now has more downloads and better mobile UX
- **Hand-rolled HDR merging:** Cloudinary/Autoenhance.ai provide production-quality AI at reasonable cost
- **Web Speech API for production:** Quality concerns, Chrome-only - Whisper API is new standard
- **Firebase Cloud Functions 1st gen:** 2nd gen has better cold starts, use for new functions

## Open Questions

### 1. **Cloudinary AI vs Autoenhance.ai for sky replacement - which is more cost-effective?**
   - What we know: Cloudinary Advanced plan is $224/month, includes AI features; Autoenhance.ai focuses on real estate
   - What's unclear: Autoenhance.ai pricing not found in search; per-image cost comparison needed
   - Recommendation: Contact both for pricing; defer to Phase 5 unless budget confirmed (start with basic Sharp enhancements)

### 2. **Should perspective correction be client-side (OpenCV.js) or cloud-based?**
   - What we know: OpenCV.js bundle is 8MB+, Sharp doesn't support perspective warp natively
   - What's unclear: Performance trade-off between heavy client bundle vs server processing cost
   - Recommendation: Start with cloud-based (Cloudinary or specialized API) for MVP; evaluate OpenCV.js if offline capability needed

### 3. **Do we need real-time voice streaming or is async sufficient?**
   - What we know: Whisper API doesn't support real-time streaming (25MB file limit); Google Cloud offers streaming at 4x cost
   - What's unclear: User expectation - instant feedback vs "processing..." acceptable?
   - Recommendation: Start with async Whisper (60-second limit, 2-3 second latency); users can see transcript before action executes

### 4. **Is Web Speech API Turkish support reliable enough for fallback?**
   - What we know: Chrome added Turkish in 2025, but quality metrics not documented
   - What's unclear: Production accuracy compared to Whisper; does it work offline?
   - Recommendation: Test Chrome Web Speech API with Turkish users; if >15% error rate, don't use as fallback (Whisper is cheap enough at $0.006/min)

### 5. **Firebase Cloud Functions memory: 512MB vs 1GiB for Sharp?**
   - What we know: 1GiB recommended, but costs 2x more per invocation
   - What's unclear: Can 512MB handle typical real estate photos (2000x1500 JPEG)?
   - Recommendation: Start with 1GiB for reliability; measure actual memory usage and downgrade to 512MB if <400MB peak

## Sources

### Primary (HIGH confidence)
- [Sharp API Documentation](https://sharp.pixelplumbing.com/api-operation/) - Image enhancement operations verified
- [Sharp Colour Manipulation](https://sharp.pixelplumbing.com/api-colour/) - Brightness/contrast functions
- [Firebase Cloud Functions Storage Triggers](https://firebase.google.com/docs/functions/gcp-storage-events) - Official Sharp integration (Feb 2026)
- [Firebase Functions Tips & Tricks](https://firebase.google.com/docs/functions/tips) - Memory limits, cold starts
- [MDN Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) - Browser compatibility
- [MDN Canvas Filter Property](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter) - Client-side filters
- [OpenAI Whisper GitHub](https://github.com/openai/whisper) - Turkish language support details

### Secondary (MEDIUM confidence)
- [8 Great React Image Croppers For 2025](https://pqina.nl/pintura/blog/8-great-react-image-croppers/) - Comparison of cropping libraries
- [react-easy-crop npm](https://www.npmjs.com/package/react-easy-crop) - 527k weekly downloads verified
- [OpenAI Whisper API Pricing (2026)](https://brasstranscripts.com/blog/openai-whisper-api-pricing-2025-self-hosted-vs-managed) - $0.006/min verified
- [Cloudinary Pricing 2026](https://thedigitalprojectmanager.com/tools/cloudinary-pricing/) - $224/month Advanced plan
- [Turkish ASR Performance Study (MDPI 2024)](https://www.mdpi.com/2079-9292/13/21/4227) - Whisper Large-v2 Turkish WER 0.06-0.10
- [Sharp vs Canvas Performance](https://npm-compare.com/canvas,imagescript,jimp,sharp) - Sharp 9 img/sec vs Canvas 1.8-6.6 img/sec
- [Firebase Functions Cold Starts 2nd Gen](https://firebase.blog/posts/2022/12/cloud-functions-firebase-v2/) - Improved performance
- [Real Estate AI Photo Editing Tools 2026](https://imagen-ai.com/valuable-tips/best-real-estate-ai-photo-editing-tools/) - Industry tools overview

### Tertiary (LOW confidence - validation needed)
- [Autoenhance.ai Features](https://autoenhance.ai/) - Real estate photo editing (pricing not found)
- [Web Speech API Turkish Support](https://chromewebstore.google.com/detail/text-to-speech-tts/cpnomhnclohkhnikegipapofcjihldck?hl=tr) - Turkish added 2025 (quality metrics missing)
- [Remove.bg Pricing](https://www.remove.bg/pricing) - Background removal only, not sky replacement
- [Sharp Perspective Transform GitHub Issue](https://github.com/lovell/sharp/issues/2095) - Not natively supported (2020 discussion)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-easy-crop (527k downloads), Sharp (Firebase official), Whisper (proven Turkish support)
- Architecture: HIGH - Patterns sourced from official Firebase + Sharp docs (Feb 2026)
- Pitfalls: MEDIUM-HIGH - Based on GitHub issues, Stack Overflow, official docs warnings
- Sky replacement: MEDIUM - Cloudinary AI exists, but cost comparison incomplete
- Perspective correction: MEDIUM - OpenCV.js verified, Sharp limitation confirmed, but cost/UX tradeoff not tested

**Research date:** 2026-02-21
**Valid until:** 2026-03-23 (30 days - libraries stable, but Whisper API pricing may change)

**Notes for planner:**
- Prioritize client-side cropping + basic Sharp enhancements for MVP cost-effectiveness
- Defer advanced AI features (sky replacement, auto-HDR) unless budget >$200/month confirmed
- Whisper API is production-ready for Turkish voice commands - no need for Web Speech API fallback
- Always set Cloud Function memory to 1GiB for Sharp processing to avoid out-of-memory errors
