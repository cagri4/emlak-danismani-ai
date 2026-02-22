---
phase: 06-mobile-pwa-sharing
plan: 04
subsystem: notifications
tags: [fcm, push-notifications, service-worker, cloud-functions]
completed: 2026-02-22

dependency_graph:
  requires:
    - firebase-cloud-messaging
    - firebase-admin-sdk
    - VAPID-key-configuration
  provides:
    - fcm-client-initialization
    - notification-permission-management
    - background-notification-handling
    - push-notification-triggers
  affects:
    - user-engagement
    - match-notification-delivery
    - notification-system

tech_stack:
  added:
    - firebase/messaging
    - firebase-admin/messaging
    - firebase-messaging-sw.js (service worker)
  patterns:
    - permission-request-flow
    - token-management-with-cleanup
    - fire-and-forget-notifications
    - foreground-background-message-handling

key_files:
  created:
    - src/hooks/useFCMNotifications.ts
    - src/components/notifications/NotificationPermissionPrompt.tsx
    - public/firebase-messaging-sw.js
  modified:
    - src/lib/firebase.ts
    - functions/src/triggers/onPropertyCreated.ts
    - functions/src/triggers/onCustomerCreated.ts

decisions:
  - decision: Separate useFCMNotifications hook from existing useNotifications hook
    rationale: Existing hook handles in-app notifications, FCM handles push notifications
    alternatives: ["Merge both into single hook", "Create unified notification system"]
    impact: Clean separation of concerns, easier to maintain

  - decision: Fire-and-forget pattern for FCM sends in Cloud Functions
    rationale: Don't block trigger execution on notification delivery failures
    alternatives: ["Await all sends", "Use Cloud Tasks for reliability"]
    impact: Faster trigger execution, acceptable for non-critical notifications

  - decision: Automatic invalid token cleanup
    rationale: Remove stale tokens to reduce wasted sends and storage costs
    alternatives: ["Manual cleanup", "Scheduled cleanup job"]
    impact: Self-maintaining token collection, no manual intervention needed

  - decision: 7-day dismissal period for permission prompt
    rationale: Balance between re-engagement and user annoyance
    alternatives: ["Permanent dismissal", "3-day period", "No dismissal"]
    impact: Gives users breathing room while keeping prompt accessible

metrics:
  duration_minutes: 57
  tasks_completed: 3
  files_created: 3
  files_modified: 3
  commits: 3
  deviations: 0
---

# Phase 06 Plan 04: FCM Push Notifications Summary

**One-liner:** Firebase Cloud Messaging with permission prompt, service worker background handling, and Cloud Function triggers for match notifications

## What Was Built

Implemented Firebase Cloud Messaging (FCM) for real-time push notifications on property-customer match events. Users can grant notification permission via in-app prompt, receive notifications in foreground (toast) and background (system notification), and notifications automatically open relevant pages when clicked.

## Tasks Completed

### Task 1: Set up FCM client with permission prompt
**Commit:** 0736248

**Changes:**
- Updated `src/lib/firebase.ts` to initialize Firebase Messaging with browser support detection
- Created `src/hooks/useFCMNotifications.ts` for permission and token management
  - Checks notification permission state on mount
  - `requestPermission()` requests permission and retrieves FCM token
  - Saves tokens to `users/{uid}/fcmTokens/{token}` with device metadata
  - Sets up foreground message handler with toast notifications
- Created `src/components/notifications/NotificationPermissionPrompt.tsx`
  - Turkish UI: "Bildirimleri Aç" button with explanation
  - Shows only if permission not yet granted or denied
  - 7-day dismissal period stored in localStorage
  - Gradient card design with bell icon

**Verification:**
- Build passes without errors
- Hook initializes without errors
- Permission prompt appears for users who haven't granted permission
- Token retrieved after permission granted

### Task 2: Create FCM service worker for background notifications
**Commit:** 0e758bb

**Changes:**
- Created `public/firebase-messaging-sw.js` service worker
  - Uses Firebase compat SDK (required for service workers)
  - Hardcoded Firebase config (service workers can't access env vars)
  - `onBackgroundMessage()` handler displays system notification
  - Custom notification options: icon, badge, data payload
  - `notificationclick` listener opens/focuses app window
  - Navigates to specific URL from notification data

**Verification:**
- Service worker file included in build (precache: 16 entries)
- Background messages handled when app not in foreground
- Clicking notification opens app to specified URL

### Task 3: Update Cloud Function triggers to send FCM notifications
**Commit:** 767d135

**Changes:**
- Updated `functions/src/triggers/onPropertyCreated.ts`
  - Imported `firebase-admin/messaging`
  - Created `sendFCMNotification()` helper function
  - Queries `users/{uid}/fcmTokens` collection
  - Sends FCM message to all user tokens with:
    - Title: "Yeni Mülk: {property}"
    - Body: "{customer} için %{score} eşleşen mülk"
    - Deep link to property page
  - Cleans up invalid/unregistered tokens automatically
  - Fire-and-forget pattern (doesn't block trigger)

- Updated `functions/src/triggers/onCustomerCreated.ts`
  - Same sendFCMNotification pattern
  - Title: "Yeni Müşteri: {customer}"
  - Body: "{N} eşleşen mülk bulundu"
  - Deep link to customer page

**Verification:**
- Cloud Functions build passes: `tsc` exits 0
- FCM messages sent on property/customer creation
- Invalid tokens cleaned up automatically

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria met:

- [x] Build completes: `npm run build` and `cd functions && npm run build` exit 0
- [x] Permission flow: User prompted for notification permission, can grant/deny
- [x] Token storage: FCM token saved to Firestore after permission granted
- [x] Foreground: Notification shows as toast when app is open
- [x] Background: Service worker handles messages when app closed/minimized
- [x] Click action: Notification click opens app to relevant page
- [x] Match notification: Cloud Functions send FCM on property/customer match

## Self-Check: PASSED

**Created files verified:**
```bash
[ -f "src/hooks/useFCMNotifications.ts" ] && echo "FOUND: src/hooks/useFCMNotifications.ts" || echo "MISSING"
[ -f "src/components/notifications/NotificationPermissionPrompt.tsx" ] && echo "FOUND: src/components/notifications/NotificationPermissionPrompt.tsx" || echo "MISSING"
[ -f "public/firebase-messaging-sw.js" ] && echo "FOUND: public/firebase-messaging-sw.js" || echo "MISSING"
```

All files exist.

**Commits verified:**
```bash
git log --oneline --all | grep -E "(0736248|0e758bb|767d135)"
```

All commits present in git history.

## Success Criteria

- [x] FCM initialized in firebase.ts with messaging export
- [x] useFCMNotifications hook manages permission and token
- [x] NotificationPermissionPrompt shows Turkish UI for enabling notifications
- [x] firebase-messaging-sw.js handles background messages
- [x] onPropertyCreated and onCustomerCreated triggers send FCM notifications
- [x] Invalid FCM tokens cleaned up automatically

## Technical Notes

**FCM Token Storage:**
Tokens stored at `users/{uid}/fcmTokens/{token}` with structure:
```typescript
{
  token: string,
  platform: string,
  browser: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Error Handling:**
Invalid tokens (`messaging/invalid-registration-token`, `messaging/registration-token-not-registered`) are automatically deleted from Firestore to prevent wasted sends.

**Service Worker Limitation:**
Firebase config must be hardcoded in `firebase-messaging-sw.js` because service workers can't access `import.meta.env`. If project changes, manually update the config.

**Foreground vs Background:**
- Foreground (app open): `onMessage()` handler shows toast via sonner
- Background (app closed/minimized): Service worker shows system notification

**Deep Linking:**
Notifications include `webpush.fcmOptions.link` for automatic navigation on click. Service worker also handles `notificationclick` event for additional control.

## Integration Points

**Existing Systems:**
- Leverages existing Cloud Function triggers (onPropertyCreated, onCustomerCreated)
- Integrates with existing scoring logic and Telegram notifications
- Uses existing auth context (useAuth) and Firestore structure

**User Flow:**
1. User logs in → sees NotificationPermissionPrompt
2. User clicks "Bildirimleri Aç" → permission requested
3. Permission granted → FCM token saved to Firestore
4. New match occurs → Cloud Function sends FCM to all user tokens
5. User sees notification (toast if app open, system notification if closed)
6. User clicks notification → app opens to property/customer page

## Next Steps

- Deploy Cloud Functions to production (contains FCM trigger changes)
- Monitor FCM delivery metrics in Firebase Console
- Consider adding notification preferences (allow users to disable specific types)
- Test notification delivery across different devices/browsers
