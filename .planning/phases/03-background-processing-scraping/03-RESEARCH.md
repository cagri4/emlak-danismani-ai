# Phase 3: Background Processing & Scraping - Research

**Researched:** 2026-02-20
**Domain:** Background job processing, web scraping, file uploads, lead scoring
**Confidence:** HIGH

## Summary

This phase introduces async background processing infrastructure using Firebase Cloud Functions with Cloud Tasks, web scraping for Turkish real estate portals, batch photo uploads with Firebase Storage, and lead scoring algorithms. The technical stack leverages Firebase's serverless architecture for reliability and scalability.

Firebase provides first-class support for background jobs through Cloud Tasks (task queues), scheduled functions (Cloud Scheduler), and resumable uploads with progress tracking. Web scraping requires careful selection between static parsers (Cheerio) and browser automation (Playwright/Puppeteer) based on site complexity. Lead scoring uses time-decay algorithms with weighted signals.

The key architectural decision is using Firebase Cloud Functions for all background processing, which provides built-in retry logic, rate limiting, and monitoring without custom infrastructure management.

**Primary recommendation:** Use Firebase Cloud Functions v2 with Cloud Tasks for background jobs, Playwright for web scraping Turkish portals (handles JavaScript-heavy sites), react-dropzone for file upload UI, Sharp for image processing, and custom time-decay algorithm for lead scoring.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Photo Upload Experience:**
- Drag-drop zone that's also clickable to browse (both methods available)
- Photos stay in upload order, star icon to select cover photo
- Per-photo progress indicator showing individual upload percentage
- User can navigate away while uploading - uploads continue in background with small header indicator

**Portal Import Flow:**
- Trigger: Paste URL in AI chat, AI parses the listing
- Review: Show preview of parsed fields, user confirms before saving
- Duplicates: Warn if similar property exists, ask "update existing" or "create new"
- Photos: Show linked previews first, download and store only after user confirms import

**Competitor Monitoring:**
- Track both: manual region+price criteria AND properties matching customer preferences
- Check frequency: Twice daily (morning and evening)
- Notifications: In-app notification bell on dashboard (Telegram channel added in Phase 5)
- Actions: View details + one-click import, then matching engine automatically notifies relevant customers

**Lead Scoring:**
- Scoring signals: Last interaction date + interaction frequency + decisions (liked/rejected) - all weighted
- Decay: Lead starts cooling after 14 days without communication
- Manual control: Boost/pin feature to mark important customers (no full override)
- Display: Color/badge in customer list + "Hot Leads" card on dashboard

### Claude's Discretion

- Exact scoring weights for lead temperature calculation
- Photo compression and thumbnail generation approach
- Scraping implementation details (rate limiting, retry logic)
- Background job queue implementation (Firebase functions, etc.)
- Notification bell UI design and interaction patterns

### Deferred Ideas (OUT OF SCOPE)

- Telegram/WhatsApp notifications for competitor alerts — Phase 5
- Email notifications — Phase 7
- Browser extension for easier portal import — not in current roadmap

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MULK-05 | Kullanıcı mülke 10-20 fotoğraf yükleyebilmeli (toplu) | Firebase Storage resumable uploads, react-dropzone for UI, batch upload patterns |
| MULK-06 | Kullanıcı fotoğrafları sürükle-bırak ile sıralayabilmeli | react-dropzone drag-drop, React state for ordering, star-to-select pattern |
| PORT-01 | Kullanıcı sahibinden.com'dan mülk içe aktarabilmeli | Playwright for JavaScript rendering, DOM parsing patterns |
| PORT-02 | Kullanıcı hepsiemlak'tan mülk içe aktarabilmeli | Playwright for JavaScript rendering, DOM parsing patterns |
| PORT-03 | Kullanıcı emlakjet'ten mülk içe aktarabilmeli | Playwright for JavaScript rendering, DOM parsing patterns |
| PORT-04 | Sistem içe aktarılan mülk detaylarını otomatik parse etmeli | Cloud Functions for parsing, structured data extraction |
| PORT-09 | Sistem rakip ilanları otomatik izleyebilmeli (scraping) | Scheduled Cloud Functions (Cloud Scheduler), Playwright scraping |
| PORT-10 | Sistem yeni rakip ilanlarını bildirebilmeli | Firestore for notification storage, in-app notification system |
| MUST-05 | AI müşterileri önceliklendirmeli (lead scoring) | Time-decay algorithm, weighted scoring calculation, Firestore queries |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase-functions | ^6.x | Cloud Functions runtime | Official Firebase serverless platform, built-in retry/scaling |
| firebase-admin | ^12.x | Backend Firebase SDK | Required for Cloud Functions, Firestore/Storage access |
| playwright | ^1.48+ | Web scraping | Best for JavaScript-heavy sites, multi-browser support, Microsoft-backed |
| react-dropzone | ^14.x | File upload UI | Industry standard for drag-drop uploads, 20K+ GitHub stars |
| sharp | ^0.33+ | Image processing | 4x faster than ImageMagick, official Firebase recommendation |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fuzzball | ^2.1.6+ | Fuzzy string matching | Duplicate property detection (address/title similarity) |
| exponential-backoff | ^3.x | Retry logic | Scraping failures, API rate limits |
| date-fns | ^4.1.0 | Date calculations | Lead scoring time decay (already in project) |
| zustand | ^5.x | Client state | Background upload state across navigation (lighter than Context) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright | Cheerio | Cheerio is faster but can't handle JavaScript-rendered content (Turkish portals use React/Next.js) |
| Playwright | Puppeteer | Puppeteer works but Chrome-only, Playwright supports multi-browser and better auto-waiting |
| react-dropzone | react-uploady | react-uploady has more features but more complex API, dropzone is simpler for this use case |
| Sharp | ImageMagick | ImageMagick comes built-in but Sharp is 4x faster and more modern API |
| zustand | React Context | Context works but can reset on navigation, zustand persists better |

**Installation:**
```bash
# Cloud Functions (in functions/ directory)
cd functions
npm install firebase-functions@latest firebase-admin@latest playwright sharp exponential-backoff fuzzball

# Client (in root directory)
npm install react-dropzone zustand
```

## Architecture Patterns

### Recommended Project Structure
```
functions/
├── src/
│   ├── scrapers/          # Portal scraping logic
│   │   ├── sahibinden.ts
│   │   ├── hepsiemlak.ts
│   │   ├── emlakjet.ts
│   │   └── common.ts      # Shared retry/rate-limit logic
│   ├── jobs/              # Background job handlers
│   │   ├── imageProcessor.ts
│   │   ├── competitorMonitor.ts
│   │   └── leadScorer.ts
│   ├── schedulers/        # Scheduled functions
│   │   └── dailyMonitor.ts
│   └── index.ts           # Function exports
src/
├── hooks/
│   ├── usePhotoUpload.ts   # Multi-file upload with progress
│   ├── useLeadScore.ts     # Lead scoring calculations
│   └── useNotifications.ts # Notification state management
├── stores/
│   └── uploadStore.ts      # Zustand store for background uploads
└── components/
    ├── PhotoUploader.tsx   # Drag-drop zone
    └── NotificationBell.tsx
```

### Pattern 1: Firebase Cloud Functions Task Queue

**What:** Enqueue background jobs that run asynchronously with retry logic
**When to use:** Processing imports, image compression, any work that shouldn't block user

**Example:**
```typescript
// Source: https://firebase.google.com/docs/functions/task-functions
import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { onCall } from 'firebase-functions/v2/https';

// Worker function that processes the task
export const processPropertyImport = onTaskDispatched(
  {
    retryConfig: {
      maxAttempts: 5,
      maxBackoffSeconds: 600,
    },
    rateLimits: {
      maxConcurrentDispatches: 10,
    },
  },
  async (req) => {
    const { url, userId } = req.data;
    // Scrape property data
    // Save to Firestore
    // Trigger matching engine
  }
);

// Client-callable function that enqueues the task
export const importProperty = onCall(async (request) => {
  const queue = getFunctions().taskQueue('processPropertyImport');
  await queue.enqueue({ url: request.data.url, userId: request.auth.uid });
  return { status: 'queued' };
});
```

### Pattern 2: Scheduled Cloud Functions (Cron)

**What:** Functions that run on a schedule (e.g., twice daily for competitor monitoring)
**When to use:** Recurring tasks like scraping competitor listings, updating lead scores

**Example:**
```typescript
// Source: https://firebase.google.com/docs/functions/schedule-functions
import { onSchedule } from 'firebase-functions/v2/scheduler';

// Runs at 9 AM and 9 PM Turkey time every day
export const monitorCompetitors = onSchedule(
  {
    schedule: '0 9,21 * * *',
    timeZone: 'Europe/Istanbul',
  },
  async (event) => {
    // Fetch monitoring criteria from Firestore
    // Scrape each portal
    // Compare with existing properties
    // Create notifications for new matches
  }
);
```

### Pattern 3: Resumable Upload with Progress Tracking

**What:** Upload multiple files with per-file progress, continues in background
**When to use:** Batch photo uploads (10-20 files)

**Example:**
```typescript
// Source: https://firebase.google.com/docs/storage/web/upload-files
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const uploadPhotos = async (files: File[], propertyId: string) => {
  const uploads = files.map((file, index) => {
    const storageRef = ref(storage, `properties/${propertyId}/${index}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          // Update progress in zustand store
          updatePhotoProgress(index, progress);
        },
        reject,
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url, index });
        }
      );
    });
  });

  return Promise.all(uploads);
};
```

### Pattern 4: Image Processing in Cloud Functions

**What:** Automatically generate thumbnails and compress images on upload
**When to use:** When photos are uploaded to Storage, trigger background processing

**Example:**
```typescript
// Source: https://firebase.google.com/docs/storage/extend-with-functions
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import sharp from 'sharp';
import { getStorage } from 'firebase-admin/storage';

export const processPhoto = onObjectFinalized(async (event) => {
  const filePath = event.data.name;
  if (!filePath.startsWith('properties/')) return;

  const bucket = getStorage().bucket();
  const file = bucket.file(filePath);

  const [imageBuffer] = await file.download();

  // Generate thumbnail
  const thumbnail = await sharp(imageBuffer)
    .resize({ width: 200, height: 200, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const thumbPath = filePath.replace(/(\.[^.]+)$/, '-thumb$1');
  await bucket.file(thumbPath).save(thumbnail);

  // Compress original
  const compressed = await sharp(imageBuffer)
    .jpeg({ quality: 85 })
    .toBuffer();

  await file.save(compressed);
});
```

### Pattern 5: Web Scraping with Playwright

**What:** Scrape JavaScript-rendered sites with retry logic and rate limiting
**When to use:** Importing from Turkish portals, competitor monitoring

**Example:**
```typescript
// Source: https://www.scrapingbee.com/blog/best-node-js-web-scrapers/
import { chromium } from 'playwright';
import { backOff } from 'exponential-backoff';

const scrapeSahibinden = async (url: string) => {
  return backOff(
    async () => {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      await page.goto(url, { waitUntil: 'networkidle' });

      const data = await page.evaluate(() => {
        // Extract property details from DOM
        return {
          title: document.querySelector('.classifiedDetailTitle')?.textContent,
          price: document.querySelector('.classifiedPrice')?.textContent,
          // ... more fields
        };
      });

      await browser.close();
      return data;
    },
    {
      numOfAttempts: 3,
      startingDelay: 1000,
      timeMultiple: 2,
      maxDelay: 10000,
    }
  );
};
```

### Pattern 6: Lead Scoring with Time Decay

**What:** Calculate lead temperature using weighted signals with exponential time decay
**When to use:** Display hot/cold leads, prioritize customer list

**Example:**
```typescript
// Source: https://medium.com/@filip.vozarevic/using-time-decay-in-predictive-lead-scoring-852de2052ea
import { differenceInDays } from 'date-fns';

interface ScoringSignal {
  lastInteraction: Date;
  interactionCount: number;
  likedProperties: number;
  rejectedProperties: number;
}

const calculateLeadScore = (signal: ScoringSignal): number => {
  const daysSinceContact = differenceInDays(new Date(), signal.lastInteraction);

  // Time decay: exponential decay after 14 days
  const timeFactor = daysSinceContact <= 14
    ? 1.0
    : Math.exp(-0.05 * (daysSinceContact - 14)); // ~60% at 30 days, ~36% at 45 days

  // Weighted signals
  const engagementScore = (
    signal.interactionCount * 2 +      // Each interaction: 2 points
    signal.likedProperties * 5 +        // Each like: 5 points
    signal.rejectedProperties * -1      // Each rejection: -1 point
  );

  // Final score with time decay
  const score = Math.max(0, engagementScore * timeFactor);

  // Classify: hot (>30), warm (15-30), cold (<15)
  return score;
};
```

### Pattern 7: Duplicate Detection with Fuzzy Matching

**What:** Find similar properties using fuzzy string matching
**When to use:** Warn user before creating duplicate property from import

**Example:**
```typescript
// Source: https://github.com/nol13/fuzzball.js
import { ratio } from 'fuzzball';

const findSimilarProperties = async (
  title: string,
  address: string,
  userId: string
): Promise<Property[]> => {
  // Get all properties for user
  const snapshot = await db
    .collection('properties')
    .where('userId', '==', userId)
    .get();

  const similar = snapshot.docs
    .map(doc => {
      const prop = doc.data() as Property;
      const titleScore = ratio(title.toLowerCase(), prop.title.toLowerCase());
      const addressScore = ratio(address.toLowerCase(), prop.address.toLowerCase());
      return { prop, score: (titleScore + addressScore) / 2 };
    })
    .filter(({ score }) => score > 75) // 75% similarity threshold
    .map(({ prop }) => prop);

  return similar;
};
```

### Pattern 8: Background Upload State with Zustand

**What:** Persist upload state across navigation using zustand
**When to use:** User navigates away while photos upload

**Example:**
```typescript
// Source: https://github.com/pmndrs/zustand
import { create } from 'zustand';

interface PhotoUpload {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  url?: string;
}

interface UploadStore {
  uploads: PhotoUpload[];
  addUpload: (file: File) => void;
  updateProgress: (id: string, progress: number) => void;
  setComplete: (id: string, url: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  uploads: [],
  addUpload: (file) =>
    set((state) => ({
      uploads: [...state.uploads, {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: 'pending',
      }],
    })),
  updateProgress: (id, progress) =>
    set((state) => ({
      uploads: state.uploads.map(u =>
        u.id === id ? { ...u, progress, status: 'uploading' } : u
      ),
    })),
  setComplete: (id, url) =>
    set((state) => ({
      uploads: state.uploads.map(u =>
        u.id === id ? { ...u, status: 'done', url, progress: 100 } : u
      ),
    })),
  clearCompleted: () =>
    set((state) => ({
      uploads: state.uploads.filter(u => u.status !== 'done'),
    })),
}));
```

### Anti-Patterns to Avoid

- **Blocking on uploads:** Don't wait for all photos to upload before allowing navigation - use background state
- **No retry logic on scraping:** Turkish portals may be slow/unreliable - always use exponential backoff
- **Storing images in Firestore:** Use Firebase Storage for images, Firestore only for metadata/URLs
- **Scraping in client-side code:** Web scraping must happen in Cloud Functions to avoid CORS and protect API keys
- **Hard-coding scraper selectors:** Portal sites change frequently - use flexible selectors and error handling
- **Ignoring cold starts:** Set minimum instances for latency-sensitive functions (importProperty)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Task queues | Custom job queue with Firestore | Cloud Tasks (onTaskDispatched) | Built-in retry, rate limiting, monitoring, scaling |
| Cron scheduling | setInterval or custom scheduler | Cloud Scheduler (onSchedule) | Reliable, no server management, audit logs |
| Image resizing | Canvas API or custom solution | Sharp library | 4x faster, handles edge cases, production-tested |
| Retry logic | Custom setTimeout loops | exponential-backoff package | Jitter, max attempts, proper backoff curve |
| Fuzzy matching | Levenshtein from scratch | fuzzball package | Optimized, multiple algorithms, well-tested |
| Drag-drop UI | Native HTML5 drag events | react-dropzone | Handles edge cases, mobile support, accessibility |

**Key insight:** Firebase and npm ecosystem already solved these problems. Custom solutions introduce bugs and maintenance burden.

## Common Pitfalls

### Pitfall 1: Firebase Functions Cold Starts

**What goes wrong:** First request after idle period takes 2-5 seconds, bad UX for imports
**Why it happens:** Functions shut down after inactivity, must restart runtime/dependencies
**How to avoid:**
- Set minimum instances for user-facing functions: `minInstances: 1` in function config
- Use concurrency in v2 functions: `maxConcurrency: 80` (default, can go up to 1000)
- Lazy-load heavy dependencies (Playwright) only when needed
- Keep function code small, minimize dependencies

**Warning signs:** User reports "import takes forever" on first use each day

### Pitfall 2: Download URLs Bypass Security Rules

**What goes wrong:** Storage security rules don't protect download URLs - anyone with URL can access
**Why it happens:** Download URLs are tokenized public URLs, rules only apply to getDownloadURL() call
**How to avoid:**
- Restrict who can call getDownloadURL() with Storage security rules
- For sensitive photos, use signed URLs with expiration (not needed for real estate listings)
- Never share download URLs publicly (e.g., in public API responses)

**Warning signs:** User uploads private document, URL leaks, rule doesn't block access

### Pitfall 3: Scraping Rate Limits and Anti-Bot

**What goes wrong:** IP gets blocked by portal sites, scrapers fail silently
**Why it happens:** Sites detect automated traffic patterns, rate limit or CAPTCHA
**How to avoid:**
- Add delays between requests: `await page.waitForTimeout(2000 + Math.random() * 1000)`
- Use exponential backoff on failures
- Set realistic user-agent: `userAgent: 'Mozilla/5.0 ...'`
- Respect robots.txt (check legally, even if technically possible)
- Run scrapers from Cloud Functions (rotating IPs better than local)

**Warning signs:** Scraper works locally but fails in production, mysterious 403/429 errors

### Pitfall 4: Context State Resets on Navigation

**What goes wrong:** Upload progress disappears when user navigates to another page
**Why it happens:** React Router may unmount components, Context doesn't persist across route changes
**How to avoid:**
- Use zustand or similar global state (not React Context) for background state
- Store upload state outside component lifecycle
- Consider persisting critical state to localStorage for refresh recovery

**Warning signs:** User reports "my uploads disappeared" after clicking a link

### Pitfall 5: Large Images Timeout Storage Upload

**What goes wrong:** 10MB+ photos timeout or consume excessive bandwidth
**Why it happens:** No client-side compression, uploading full-resolution images
**How to avoid:**
- Compress on client before upload using browser-image-compression library
- Or accept full upload and compress in Cloud Function (slower UX, but simpler)
- Set reasonable size limits: 5-10MB per photo
- Use resumable uploads for large files

**Warning signs:** "Upload failed" errors on large files, slow upload times

### Pitfall 6: Fuzzy Matching False Positives

**What goes wrong:** System warns about "duplicate" for different properties
**Why it happens:** Threshold too low, only comparing one field (e.g., street name matches)
**How to avoid:**
- Combine multiple fields: title + address + price range
- Use higher threshold: 75-85% similarity
- Show user the "similar" property, let them decide
- Weight exact matches higher (same city, same price)

**Warning signs:** Users frequently ignore duplicate warnings

### Pitfall 7: Scheduled Function Timezone Confusion

**What goes wrong:** Competitor monitor runs at wrong time (3 AM instead of 9 AM)
**Why it happens:** Cron schedule in UTC, forgot to specify timezone
**How to avoid:**
- Always set timezone explicitly: `timeZone: 'Europe/Istanbul'`
- Test scheduled functions with emulator
- Log execution time in function for debugging

**Warning signs:** Notifications arrive at odd hours

### Pitfall 8: Lead Score Doesn't Update

**What goes wrong:** Lead scores calculated once, never recalculated
**Why it happens:** Forgot to trigger recalculation on new interactions
**How to avoid:**
- Recalculate score on every interaction (lightweight operation)
- Or run scheduled function daily to update all scores
- Store lastCalculated timestamp, show if stale

**Warning signs:** Hot lead from last week still shows as hot despite no contact

## Code Examples

Verified patterns from official sources:

### Drag-Drop Photo Upload with react-dropzone

```typescript
// Source: https://react-dropzone.js.org/
import { useDropzone } from 'react-dropzone';

export function PhotoUploader({ onPhotosAdded }: { onPhotosAdded: (files: File[]) => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 20,
    onDrop: (acceptedFiles) => {
      onPhotosAdded(acceptedFiles);
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Fotoğrafları buraya bırakın...</p>
      ) : (
        <p>Fotoğrafları sürükleyin veya tıklayarak seçin (max 20)</p>
      )}
    </div>
  );
}
```

### Notification Bell with Badge

```typescript
// Source: https://mui.com/material-ui/react-badge/
import { Badge } from '@mui/material';
import { Bell } from 'lucide-react';

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <button className="relative p-2">
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      <Bell className="h-6 w-6" />
    </button>
  );
}
```

### Firebase Functions Setup with TypeScript

```bash
# Source: https://firebase.google.com/docs/functions/typescript
# Initialize Cloud Functions
firebase init functions

# Select TypeScript when prompted
# Install dependencies
cd functions
npm install

# Add deployment hook in firebase.json
{
  "functions": {
    "source": "functions",
    "predeploy": "npm --prefix functions run build"
  }
}

# Deploy
firebase deploy --only functions
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| firebase-functions v1 | firebase-functions v2 | 2022 | 80x more concurrency, fewer cold starts, better performance |
| Puppeteer | Playwright | 2020 | Multi-browser support, better async/await, Microsoft backing |
| ImageMagick | Sharp | ~2019 | 4x faster processing, modern API, active maintenance |
| Context for global state | Zustand/Jotai | 2021-2022 | Simpler API, no context resets, better persistence |
| Manual retry loops | exponential-backoff | Ongoing | Proper jitter, configurable, less bugs |

**Deprecated/outdated:**
- **firebase-queue:** Old queue library (pre-Cloud Tasks) - archived, use Cloud Tasks instead
- **Cloud Functions v1:** Still works but v2 has better performance and lower cold starts
- **Puppeteer for new projects:** Playwright is recommended (unless Chrome-only needed)

## Open Questions

1. **Portal scraping legality**
   - What we know: Technically possible, some commercial scrapers exist
   - What's unclear: Terms of service compliance, legal status in Turkey
   - Recommendation: Review each portal's ToS, consider API requests first (if available), implement respectful rate limiting

2. **Lead scoring weights**
   - What we know: Time decay formula (exponential after 14 days), signals to track
   - What's unclear: Optimal weights for Turkish real estate market
   - Recommendation: Start with reasonable defaults (interaction=2, like=5, reject=-1), iterate based on user feedback

3. **Photo storage costs at scale**
   - What we know: Firebase Storage pricing, compression reduces costs
   - What's unclear: Average photos per property, storage costs per user
   - Recommendation: Monitor costs in first month, implement aggressive compression (85% quality), consider cleanup policy for deleted properties

4. **Scraping reliability with portal updates**
   - What we know: Sites change DOM structure occasionally
   - What's unclear: How often Turkish portals redesign, how to detect breakage
   - Recommendation: Implement scraper health checks (scheduled function that validates selectors), alert on failures, version scrapers

## Sources

### Primary (HIGH confidence)

- [Firebase Cloud Functions Task Queue](https://firebase.google.com/docs/functions/task-functions) - Official docs on background jobs
- [Firebase Storage Upload Files](https://firebase.google.com/docs/storage/web/upload-files) - Resumable uploads documentation
- [Firebase Schedule Functions](https://firebase.google.com/docs/functions/schedule-functions) - Cloud Scheduler documentation (updated 2026-02)
- [Firebase Storage Extend with Functions](https://firebase.google.com/docs/storage/extend-with-functions) - Image processing triggers
- [Firebase Functions TypeScript](https://firebase.google.com/docs/functions/typescript) - TypeScript setup guide
- [Firebase Functions Tips & Tricks](https://firebase.google.com/docs/functions/tips) - Cold start optimization (updated 2026-02)
- [react-dropzone GitHub](https://github.com/react-dropzone/react-dropzone) - Official repository
- [Sharp GitHub](https://github.com/lovell/sharp) - Image processing library
- [Playwright Documentation](https://playwright.dev/) - Web scraping automation
- [fuzzball.js GitHub](https://github.com/nol13/fuzzball.js) - Fuzzy string matching
- [zustand GitHub](https://github.com/pmndrs/zustand) - State management

### Secondary (MEDIUM confidence)

- [Best Node.js Web Scrapers 2026](https://www.scrapingbee.com/blog/best-node-js-web-scrapers/) - Playwright vs Puppeteer vs Cheerio comparison
- [Firebase Cloud Functions Cold Start Solution](https://www.ayrshare.com/a-firebase-cloud-functions-cold-start-solution/) - Performance optimization strategies
- [Using Time Decay in Predictive Lead Scoring](https://medium.com/@filip.vozarevic/using-time-decay-in-predictive-lead-scoring-852de2052ea) - Lead scoring algorithm
- [React State Management 2026](https://www.developerway.com/posts/react-state-management-2025) - Zustand vs Context
- [Firebase Storage Download URLs and Tokens](https://www.sentinelstand.com/article/guide-to-firebase-storage-download-urls-tokens) - Security best practices
- [How to Handle API Rate Limits 2026](https://apistatuscheck.com/blog/how-to-handle-api-rate-limits) - Retry logic patterns
- [Exponential Backoff in JavaScript](https://advancedweb.hu/how-to-implement-an-exponential-backoff-retry-strategy-in-javascript/) - Implementation guide

### Tertiary (LOW confidence)

- [Sahibinden.com Scraper](https://apify.com/evohaus/sahibinden-scraper-puppeteer-js/api) - Commercial scraper example (ToS implications unclear)
- [Turkish Real Estate Websites](https://foreignbuyerswatch.com/2019/02/13/top-turkey-real-estate-websites/) - Portal overview (dated 2019)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Firebase official docs updated Feb 2026, established libraries
- Architecture: HIGH - Patterns from official Firebase examples and documentation
- Pitfalls: MEDIUM - Mix of documented issues and community experience
- Lead scoring: MEDIUM - General algorithms documented, specific weights need validation
- Scraping legality: LOW - Technical approach clear, legal/ToS aspects need review

**Research date:** 2026-02-20
**Valid until:** ~2026-04-20 (60 days - Firebase ecosystem relatively stable, but monitor for portal changes and library updates)
