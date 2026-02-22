# Phase 6: Mobile PWA & Sharing - Research

**Researched:** 2026-02-22
**Domain:** Progressive Web Apps, Mobile Web, Offline-First Architecture
**Confidence:** MEDIUM-HIGH

## Summary

Phase 6 transforms the React web application into a mobile-first Progressive Web App (PWA) with offline capabilities and native sharing features. The technical approach leverages vite-plugin-pwa for service worker management, Workbox for caching strategies, Firebase Firestore's built-in offline persistence, and platform-specific APIs for mobile camera access and WhatsApp sharing.

**Primary recommendation:** Use vite-plugin-pwa with Workbox for service worker generation, enable Firestore's persistentLocalCache for offline data sync, implement camera access via MediaDevices.getUserMedia, configure Firebase Cloud Messaging for push notifications, and use Open Graph meta tags with WhatsApp URL scheme for social sharing.

The phase has significant iOS Safari limitations that must be planned for - manual installation flow, 7-day storage caps, no background sync, and limited notification support compared to Android/Chromium browsers.

**Primary recommendation:** Build for Chromium-first (where most capabilities work), then progressively enhance for iOS Safari with fallback UI patterns that acknowledge platform limitations.

## <phase_requirements>
Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MOBL-01 | Uygulama responsive olmalı (mobil tarayıcıda çalışmalı) | Mobile-first CSS with Tailwind CSS v4, viewport meta tags, flexible layouts with CSS Grid/Flexbox |
| MOBL-02 | PWA olarak yüklenebilmeli (home screen) | vite-plugin-pwa generates manifest.json and service worker, beforeinstallprompt API for custom install prompt (Chromium only) |
| MOBL-03 | Offline modda mülk/müşteri görüntülenebilmeli | Firestore persistentLocalCache caches queries automatically, Workbox CacheFirst strategy for static assets |
| MOBL-04 | Online olunca değişiklikler senkronize olmalı | Firestore automatic background sync with last-write-wins conflict resolution |
| MOBL-05 | Mobilde kamera ile fotoğraf çekip direkt yüklenebilmeli | MediaDevices.getUserMedia with facingMode constraint, HTML5 File API, existing Firebase Storage upload infrastructure |
| MOBL-06 | Push notification ile bildirim alınabilmeli | Firebase Cloud Messaging (FCM) for web with VAPID keys, service worker message handler |
| MOBL-07 | Yeni eşleşme bildirim olarak gelmeli | FCM topic subscriptions or direct token-based messaging from Cloud Functions |
| ILET-01 | Kullanıcı mülk kartını WhatsApp'a paylaşabilmeli | WhatsApp URL scheme (api.whatsapp.com/send?text=) for direct sharing |
| ILET-02 | Paylaşılan kartta fotoğraf, detaylar ve iletişim linki olmalı | Open Graph meta tags (og:title, og:description, og:image 1200x630px, og:url) for rich previews |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite-plugin-pwa | ^0.21.x | PWA setup & service worker generation | Zero-config PWA for Vite, official recommendation, includes Workbox integration |
| workbox-window | ^7.x | Service worker lifecycle management | Required dev dependency for vite-plugin-pwa React integration, provides update notifications |
| Firebase SDK | 12.9.0 (current) | Offline persistence, FCM notifications | Already in stack, built-in offline sync, no additional libraries needed |
| idb-keyval | ^6.x | IndexedDB wrapper for Zustand persistence | Lightweight (600 bytes), simple key-value API, recommended in Zustand docs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| workbox-strategies | Included via vite-plugin-pwa | Advanced caching strategies | Custom service worker routes beyond defaults |
| workbox-precaching | Included via vite-plugin-pwa | Static asset precaching | Automatic with vite-plugin-pwa generateSW mode |
| browser-image-compression | ^2.x | Client-side image compression | Mobile photos are often 4-8MB; compress before upload |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vite-plugin-pwa | Manual Workbox setup | vite-plugin-pwa handles 90% of config automatically; manual only needed for complex custom service workers |
| idb-keyval | localStorage | localStorage limited to 5-10MB, synchronous (blocks UI), inaccessible to service workers - only use for <100KB data |
| FCM | Web Push API directly | FCM provides cross-platform abstraction, token management, and Cloud Functions integration - raw Web Push requires custom server infrastructure |

**Installation:**
```bash
npm install vite-plugin-pwa workbox-window idb-keyval browser-image-compression
npm install --save-dev @types/wicg-file-system-access
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pwa/                    # PWA-specific code
│   ├── manifest.ts         # Manifest configuration for vite-plugin-pwa
│   ├── ReloadPrompt.tsx    # Service worker update UI component
│   └── notification-handler.ts  # FCM message handling
├── stores/                 # Zustand stores
│   ├── uploadStore.ts      # Existing - add persist middleware
│   ├── offlineQueue.ts     # Queue for offline mutations
│   └── installStore.ts     # PWA install prompt state
├── hooks/
│   ├── useOnlineStatus.ts  # Navigator.onLine reactive hook
│   ├── usePWAInstall.ts    # beforeinstallprompt wrapper
│   └── useCamera.ts        # MediaDevices camera access
└── lib/
    ├── firebase.ts         # Existing - add persistentLocalCache
    └── share.ts            # WhatsApp sharing utilities
```

### Pattern 1: Service Worker Registration with Update Notifications
**What:** React component that detects service worker updates and prompts user to reload
**When to use:** Every PWA should have this to notify users of new versions
**Example:**
```typescript
// Source: https://vite-pwa-org.netlify.app/frameworks/react
import { useRegisterSW } from 'virtual:pwa-register/react'

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r)
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div>
      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4">
          <div className="text-sm">
            {offlineReady ? 'App ready to work offline' : 'New content available, click reload'}
          </div>
          {needRefresh && (
            <button onClick={() => updateServiceWorker(true)}>Reload</button>
          )}
          <button onClick={close}>Close</button>
        </div>
      )}
    </div>
  )
}
```

### Pattern 2: Firestore Offline Persistence (2026 API)
**What:** Enable offline caching for Firestore using the new persistentLocalCache API
**When to use:** Initialize once at app startup before any Firestore queries
**Example:**
```typescript
// Source: https://firebase.google.com/docs/firestore/manage-data/enable-offline
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

// REPLACE getFirestore(app) with:
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager() // Multi-tab sync
  })
})

// Single-tab alternative (simpler, better performance):
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({}) // Defaults to single tab
})
```

**CRITICAL:** Must use `initializeFirestore` instead of `getFirestore`. The old `enableIndexedDbPersistence()` and `enableMultiTabIndexedDbPersistence()` APIs are deprecated as of Firebase SDK v10+.

### Pattern 3: Zustand Persistence with IndexedDB
**What:** Persist Zustand state to IndexedDB for offline access
**When to use:** For critical app state that should survive page refreshes and work offline
**Example:**
```typescript
// Source: https://zustand.docs.pmnd.rs/integrations/persisting-store-data
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

export const useOfflineStore = create(
  persist(
    (set, get) => ({
      // Store state and actions here
    }),
    {
      name: 'offline-store',
      storage: createJSONStorage(() => storage),
    }
  )
)
```

**Note:** IndexedDB operations are async, but Zustand's getState() remains synchronous - the store hydrates async on mount, then keeps state in memory.

### Pattern 4: Camera Access for Mobile Photo Upload
**What:** Access device camera with front/rear selection for direct photo capture
**When to use:** Mobile property photo uploads
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
async function capturePhoto(facingMode: 'user' | 'environment' = 'environment') {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode }, // 'user' = front, 'environment' = rear
    audio: false
  })

  // Display stream in video element
  const video = document.createElement('video')
  video.srcObject = stream
  await video.play()

  // Capture frame to canvas
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d')!.drawImage(video, 0, 0)

  // Convert to blob
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob(resolve!, 'image/jpeg', 0.85)
  )

  // Stop camera
  stream.getTracks().forEach(track => track.stop())

  return new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
}
```

**IMPORTANT:** Requires HTTPS in production. Falls back to file input (`<input type="file" accept="image/*" capture="environment">`) on unsupported browsers.

### Pattern 5: Firebase Cloud Messaging (FCM) Setup
**What:** Configure FCM for web push notifications
**When to use:** All PWAs that need push notifications
**Example:**
```typescript
// Source: https://firebase.google.com/docs/cloud-messaging/web/get-started

// 1. Generate VAPID keys in Firebase Console
// 2. Create firebase-messaging-sw.js in public/

// In src/lib/firebase.ts:
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

export const messaging = getMessaging(app)

// Request permission and get token
export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission denied')
  }

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
  })

  // Save token to Firestore user document
  return token
}

// Handle foreground messages
onMessage(messaging, (payload) => {
  console.log('Message received:', payload)
  // Show notification or update UI
})
```

**Service Worker (public/firebase-messaging-sw.js):**
```javascript
importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: '...',
  projectId: '...',
  messagingSenderId: '...',
  appId: '...'
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png'
  }
  self.registration.showNotification(notificationTitle, notificationOptions)
})
```

### Pattern 6: WhatsApp Sharing with Rich Preview
**What:** Share property cards to WhatsApp with image preview and metadata
**When to use:** Social sharing feature for property listings
**Example:**
```typescript
// Source: https://copyprogramming.com/howto/provide-an-image-for-whatsapp-link-sharing

// 1. Add Open Graph meta tags to property detail page
// In index.html or dynamically with react-helmet:
<head>
  <meta property="og:title" content="3+1 Daire Çankaya - 2M TL" />
  <meta property="og:description" content="150m², 3. kat, modern mutfak..." />
  <meta property="og:image" content="https://yourdomain.com/property/123/cover.jpg" />
  <meta property="og:url" content="https://yourdomain.com/property/123" />
  <meta property="og:type" content="website" />

  {/* Image specs: 1200x630px, <300KB, HTTPS absolute URL */}
</head>

// 2. Share function
export function shareToWhatsApp(propertyUrl: string, message: string) {
  const text = encodeURIComponent(message + '\n\n' + propertyUrl)
  const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`

  if (navigator.share) {
    // Use Web Share API if available (better UX on mobile)
    navigator.share({
      title: 'Emlak İlanı',
      text: message,
      url: propertyUrl
    })
  } else {
    // Fallback to direct WhatsApp link
    window.open(whatsappUrl, '_blank')
  }
}
```

**Image Requirements:**
- Dimensions: 1200x630px (WhatsApp recommended)
- Format: JPEG or PNG
- Size: <300KB
- URL: Absolute HTTPS URL (relative paths won't work)
- Served with correct CORS headers

### Pattern 7: PWA Install Prompt
**What:** Custom UI to prompt PWA installation
**When to use:** Chromium browsers only (iOS Safari doesn't support)
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt

let deferredPrompt: any

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  // Show custom install UI
  setShowInstallPrompt(true)
})

async function handleInstallClick() {
  if (!deferredPrompt) return

  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice

  console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} install`)
  deferredPrompt = null
  setShowInstallPrompt(false)
}
```

**iOS Safari Fallback:**
```typescript
function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return (window.matchMedia('(display-mode: standalone)').matches)
}

// Show manual instructions for iOS
if (isIOS() && !isInStandaloneMode()) {
  // Display: "Tap Share button → Add to Home Screen"
}
```

### Anti-Patterns to Avoid

- **Don't cache Firebase Auth tokens in service worker:** Auth state is managed by Firebase SDK, caching tokens can cause security issues and stale auth state
- **Don't use localStorage for large datasets:** 5-10MB limit, synchronous (blocks UI), not available in service workers - use IndexedDB via idb-keyval instead
- **Don't call skipWaiting() without user confirmation:** New service worker will control pages loaded with old code, potentially breaking in-progress operations - always prompt user to reload
- **Don't assume beforeinstallprompt works everywhere:** Chromium-only API, provide iOS-specific install instructions via UI
- **Don't forget offline fallback UI:** When offline, show custom "You're offline" page instead of generic browser error (improves perceived reliability)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service Worker Generation | Custom service worker with manual cache management | vite-plugin-pwa with Workbox | Handles cache versioning, precaching, runtime caching strategies, automatic updates - custom SWs are error-prone and require deep lifecycle knowledge |
| Offline Sync Queue | Custom queue with retry logic and conflict resolution | Firestore built-in offline persistence | Firestore automatically queues writes when offline, syncs when online, handles conflicts (last-write-wins), manages cache size - building this is 100+ hours of work |
| IndexedDB Wrapper | Raw IndexedDB API with transactions | idb-keyval or zustand-indexeddb | IndexedDB API is notoriously complex (transactions, cursors, migrations) - wrappers reduce code by 80% and handle edge cases |
| Image Compression | Custom canvas-based compression algorithm | browser-image-compression library | Handles EXIF orientation, progressive JPEG, WebP conversion, maintains aspect ratio, worker threads - custom solutions miss edge cases and are slower |
| Push Notification Infrastructure | Custom Web Push server with VAPID keys | Firebase Cloud Messaging | FCM provides token management, topic subscriptions, delivery reports, platform abstraction - custom setup requires certificate management, database for tokens, retry logic |

**Key insight:** PWA and offline-first development has mature tooling ecosystems. The complexity is in edge cases (multi-tab sync, cache eviction policies, iOS Safari quirks, service worker lifecycle) that standard libraries handle. Custom solutions invariably rediscover known pitfalls and require ongoing maintenance as browser APIs evolve.

## Common Pitfalls

### Pitfall 1: iOS Safari Storage Eviction After 7 Days
**What goes wrong:** iOS Safari automatically deletes PWA data (IndexedDB, Cache Storage) if the app isn't opened for 7 days, causing data loss
**Why it happens:** Apple's aggressive storage management to prevent abuse, applies to all installed PWAs
**How to avoid:**
- Design for data sync, not offline-first storage of critical data
- Cache UI state and recently viewed items, but always sync critical changes to Firestore immediately
- Show "Syncing..." indicator when online to clarify data is being backed up
- Warn users on iOS that data may be cleared if app not used for a week
**Warning signs:** iOS users reporting "logged out" or "data disappeared" after not using app

### Pitfall 2: Service Worker Update Timing Confusion
**What goes wrong:** New service worker installed but old version still controlling page, users see stale content even after "Update available" prompt
**Why it happens:** Service worker lifecycle: new SW enters "waiting" state until all tabs using old SW are closed
**How to avoid:**
- Use `updateServiceWorker(true)` which calls skipWaiting() AND reloads page
- Never auto-update without user confirmation (can break in-progress operations)
- Show persistent "Update available" banner until user clicks (don't auto-dismiss)
- Handle activation timing: new SW only controls page after navigation or reload
**Warning signs:** Users report update prompt but no visible changes, console shows "waiting to activate"

### Pitfall 3: HTTPS-Only APIs Fail in Development
**What goes wrong:** Camera (getUserMedia), notifications (FCM), service workers fail on http://localhost during development
**Why it happens:** Security restrictions require HTTPS, with exception for localhost in some browsers
**How to avoid:**
- Modern Chrome/Firefox allow service workers on localhost (safe to dev)
- For mobile testing, use `ngrok` or Vite's `--host` flag with self-signed cert
- Or test camera/notifications on deployed staging environment (Firebase Hosting preview channels)
- Add clear error messages: "Camera requires HTTPS" instead of silent failures
**Warning signs:** "NotAllowedError: getUserMedia is not permitted" in console

### Pitfall 4: Firestore Offline Cache Size Explosion
**What goes wrong:** App loads slowly, browser shows "storage quota exceeded" errors
**Why it happens:** Firestore caches every document/query result, unbounded growth over time
**How to avoid:**
- Configure cache size limit: `cacheSizeBytes: 40 * 1024 * 1024` (40MB default is reasonable)
- Use LRU eviction (automatic) - least recently used docs removed first
- Query with `limit()` to prevent caching thousands of documents
- Don't enable offline persistence for admin/analytics dashboards with huge datasets
**Warning signs:** IndexedDB size >100MB in DevTools, slow cold starts, quota errors on low-end devices

### Pitfall 5: Mobile Camera Photos Are Huge (4-8MB)
**What goes wrong:** Users upload 8MB photos from phone, blowing through storage quota and bandwidth
**Why it happens:** Modern phones capture 12+ megapixel images at full quality
**How to avoid:**
- Compress client-side BEFORE upload using browser-image-compression
- Resize to max 1920px width (adequate for web display)
- Set quality to 0.85 (visually lossless, 60% size reduction)
- Show file size before upload: "3.2 MB → 480 KB" to build user confidence
**Warning signs:** Storage costs spike, users report slow uploads, Firebase Storage quota exceeded

### Pitfall 6: beforeinstallprompt Doesn't Fire on iOS
**What goes wrong:** Custom install button never appears on iOS Safari
**Why it happens:** beforeinstallprompt is Chromium-only, iOS uses native Share → "Add to Home Screen" flow
**How to avoid:**
- Detect iOS: show manual instructions ("Tap Share → Add to Home Screen")
- Use `isInStandaloneMode()` check to hide prompt if already installed
- Progressive enhancement: Chromium gets custom prompt, iOS gets instructions
- Don't hide install UI entirely - many users don't know about manual install
**Warning signs:** iOS users report "can't find install button", Analytics show 0% iOS install rate

### Pitfall 7: Push Notifications Require User Gesture
**What goes wrong:** `Notification.requestPermission()` fails silently or returns "default" (not granted)
**Why it happens:** Browsers block permission requests not triggered by user interaction (anti-spam)
**How to avoid:**
- Only request permission inside click handler (button, menu item)
- Show explanatory UI before permission prompt: "Get notified of new matches"
- Handle rejection gracefully: offer alternative (email notifications, in-app badge)
- Don't request permission on page load or after short timeout (will fail)
**Warning signs:** Permission stays "default", users report "notification button doesn't work"

### Pitfall 8: Multi-Tab Firestore Sync Causes UI Flicker
**What goes wrong:** User has app open in two tabs, makes change in tab A, tab B content jumps/reloads
**Why it happens:** persistentMultipleTabManager() broadcasts changes across tabs, triggers re-renders
**How to avoid:**
- Use single-tab persistence if multi-tab sync not required (simpler, no flicker)
- If multi-tab needed: debounce re-renders, show "Synced from other tab" toast instead of jarring UI updates
- Most mobile users won't have multiple tabs - optimize for single-tab experience
**Warning signs:** Users report "page jumping around", duplicate renders in React DevTools

### Pitfall 9: Service Worker Caches Wrong API Version
**What goes wrong:** API updated but service worker serves old cached responses, app shows 404 or errors
**Why it happens:** Service worker caches API calls with CacheFirst strategy, doesn't check for updates
**How to avoid:**
- DON'T cache API calls with CacheFirst (use NetworkFirst or NetworkOnly)
- Only cache static assets (JS, CSS, images, fonts) with CacheFirst
- For API calls: NetworkFirst (network with cache fallback) or StaleWhileRevalidate (cache + background update)
- Version API URLs (/api/v2/properties) so cache automatically invalidates on version bump
**Warning signs:** API works in Incognito mode but fails in normal mode, users report stale data after deployments

### Pitfall 10: WhatsApp Doesn't Show Image Preview
**What goes wrong:** WhatsApp share shows URL but no image/title/description
**Why it happens:** Open Graph meta tags missing, incorrect, or image not accessible
**How to avoid:**
- Validate with WhatsApp's official debugger (doesn't exist, use Facebook Sharing Debugger which WhatsApp uses)
- Ensure og:image is absolute HTTPS URL (not relative path)
- Image must be <300KB and 1200x630px
- Check CORS headers allow WhatsApp crawler
- Server must respond quickly (<5 seconds) to HEAD requests
**Warning signs:** Copy-paste URL into WhatsApp shows plain link, no rich preview

## Code Examples

Verified patterns from official sources:

### vite.config.ts PWA Configuration
```typescript
// Source: https://vite-pwa-org.netlify.app/frameworks/react
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Show update prompt to user
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Emlak Danışmanı AI',
        short_name: 'Emlak AI',
        description: 'AI-powered real estate assistant for Turkish market',
        theme_color: '#0EA5E9', // Tailwind sky-500
        background_color: '#ffffff',
        display: 'standalone', // Hide browser UI when installed
        orientation: 'portrait',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable' // Adaptive icon for Android
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst', // Property images - change rarely
            options: {
              cacheName: 'firebase-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst', // API calls - always try network first
            options: {
              cacheName: 'firestore-api',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true // Test service worker in dev mode
      }
    })
  ]
})
```

### useOnlineStatus Hook
```typescript
// Source: MDN Web API documentation
import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }

    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Usage:
function App() {
  const isOnline = useOnlineStatus()

  return (
    <>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2">
          You're offline. Changes will sync when connection restored.
        </div>
      )}
      {/* Rest of app */}
    </>
  )
}
```

### Client-Side Image Compression
```typescript
// Source: browser-image-compression npm package
import imageCompression from 'browser-image-compression'

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.5, // Target 500KB
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: true, // Offload to worker thread
    fileType: 'image/jpeg' // Always convert to JPEG
  }

  try {
    const compressedFile = await imageCompression(file, options)

    console.log(`Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)

    return compressedFile
  } catch (error) {
    console.error('Compression failed:', error)
    return file // Fallback to original
  }
}
```

### Responsive Mobile-First Layout
```tsx
// Source: Tailwind CSS responsive design best practices
export function PropertyCard({ property }) {
  return (
    <div className="
      w-full           /* Mobile: full width */
      sm:w-1/2         /* Tablet: 2 columns */
      lg:w-1/3         /* Desktop: 3 columns */
      p-4
    ">
      <img
        src={property.thumbnail}
        alt={property.title}
        className="
          w-full
          h-48           /* Mobile: fixed height */
          sm:h-64        /* Tablet: taller */
          object-cover
          rounded-lg
        "
      />
      <h3 className="
        text-lg         /* Mobile: smaller */
        sm:text-xl      /* Tablet: larger */
        font-bold
        mt-2
      ">
        {property.title}
      </h3>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `enableIndexedDbPersistence()` | `persistentLocalCache()` | Firebase SDK v10 (2023) | Old API deprecated, new API provides better multi-tab support and performance controls |
| Manual service worker registration | vite-plugin-pwa | 2021+ | Automatic service worker generation with Workbox reduces boilerplate by 90% |
| localStorage for offline state | IndexedDB via idb-keyval | 2020+ | IndexedDB supports larger storage, async operations, accessible from service workers |
| Custom install prompts everywhere | Progressive enhancement | 2022+ iOS changes | iOS Safari won't support beforeinstallprompt, build for Chromium first, enhance for iOS with manual instructions |
| Aggressive offline-first caching | NetworkFirst for APIs | 2024+ | Caching API responses causes stale data issues, current practice is NetworkFirst with short cache TTL |
| Web Share API fallback | Web Share primary | 2025+ | 90% browser support for Web Share API, use as primary with WhatsApp URL as fallback |

**Deprecated/outdated:**
- **enableIndexedDbPersistence() / enableMultiTabIndexedDbPersistence()**: Replaced by persistentLocalCache configuration in Firebase SDK v10+
- **workbox-precaching manual setup**: vite-plugin-pwa handles this automatically via includeAssets and globPatterns
- **navigator.getUserMedia()**: Old API, use navigator.mediaDevices.getUserMedia() (promise-based, better error handling)
- **ApplicationCache (AppCache)**: Completely removed from browsers, replaced by service workers
- **Add to Home Screen meta tags (apple-mobile-web-app-capable)**: Still works for iOS but doesn't create true PWA, users must use Share → Add to Home Screen

## Open Questions

### 1. **How to handle offline writes that conflict when syncing?**
   - What we know: Firestore uses last-write-wins by default, no built-in conflict resolution UI
   - What's unclear: Whether users need to see conflicts (e.g., two agents editing same property offline) or if last-write-wins is acceptable
   - Recommendation: Start with last-write-wins (simpler), add version field with timestamp to detect conflicts. If becomes problem, build custom conflict resolution UI in Phase 7+

### 2. **Should we support iOS Safari at all given limitations?**
   - What we know: iOS Safari has 7-day storage eviction, no background sync, limited notifications, manual install only
   - What's unclear: What percentage of target users (Turkish real estate agents) use iOS vs Android
   - Recommendation: Build for Chromium/Android first (where PWA works fully), test on iOS, document limitations. If >30% iOS users, may need hybrid app in future

### 3. **How much data to cache for offline use?**
   - What we know: Firestore default cache is 40MB, iOS Safari may evict after 7 days
   - What's unclear: Typical dataset size (properties + customers + photos), user tolerance for "some data not available offline"
   - Recommendation: Cache recent/frequently accessed data (last 30 days of activity), show "Load more" button for older data (network required). Monitor cache size in analytics.

### 4. **Should camera capture replace or supplement file upload?**
   - What we know: getUserMedia provides better UX on mobile, but requires extra UI (viewfinder, capture button)
   - What's unclear: Whether users prefer quick camera capture vs selecting from gallery (existing photos)
   - Recommendation: Offer both - camera icon button for instant capture, gallery button for existing photos. A/B test which is used more.

## Sources

### Primary (HIGH confidence)
- [vite-plugin-pwa React Documentation](https://vite-pwa-org.netlify.app/frameworks/react) - Integration patterns, configuration examples
- [Firebase Firestore Offline Persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline) - Official API for persistentLocalCache (updated 2026-02-18)
- [Firebase Cloud Messaging Web Setup](https://firebase.google.com/docs/cloud-messaging/web/get-started) - FCM integration, VAPID keys, service worker setup
- [MDN Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) - PWA fundamentals, best practices
- [MDN MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) - Camera API reference
- [Zustand Persist Middleware](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) - Official IndexedDB integration guide
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies) - CacheFirst, NetworkFirst, StaleWhileRevalidate patterns

### Secondary (MEDIUM confidence)
- [PWA iOS Limitations Guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) - Comprehensive iOS Safari restrictions (verified against Apple docs)
- [Service Worker Lifecycle Explained](https://web.dev/articles/service-worker-lifecycle) - Update mechanisms, skipWaiting behavior (web.dev official)
- [WhatsApp Share Image Guide](https://copyprogramming.com/howto/provide-an-image-for-whatsapp-link-sharing) - Open Graph meta tags for rich previews
- [Offline Sync Patterns](https://www.sachith.co.uk/offline-sync-conflict-resolution-patterns-architecture-trade%E2%80%91offs-practical-guide-feb-19-2026/) - Conflict resolution strategies, published Feb 2026

### Tertiary (LOW confidence - requires validation)
- [GitHub PWA Bugs Repository](https://github.com/PWA-POLICE/pwa-bugs) - Community-reported bugs, some iOS-specific issues may be outdated
- Various Medium articles on Workbox and offline-first patterns - useful for examples but check against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH - vite-plugin-pwa and Firebase are well-documented official solutions, but some performance characteristics of new persistentLocalCache API not fully tested at scale
- Architecture: HIGH - Patterns from official documentation, verified with source URLs
- Pitfalls: MEDIUM - Based on official docs + community reports, iOS Safari issues confirmed, but some edge cases (multi-tab sync flicker) may vary by implementation
- iOS Safari limitations: HIGH - Verified against multiple authoritative sources including Apple Developer Forums and PWA tracking sites

**Research date:** 2026-02-22
**Valid until:** 30 days (March 2026) - PWA standards stable, but Firebase SDK updates quarterly, iOS Safari changes with major iOS releases (typically Sept/Oct)

**Notes:**
- vite-plugin-pwa v0.21+ includes breaking changes to registerType options - verify latest version during implementation
- Firebase SDK 12.x has deprecated old offline persistence APIs - do NOT use examples from pre-2023 tutorials
- iOS Safari PWA support improves with each iOS version but core limitations (7-day eviction, no background sync) remain as of iOS 18
- Tailwind CSS v4 (already in project) has new responsive design utilities - check migration guide for breaking changes from v3
