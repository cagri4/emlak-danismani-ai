---
phase: 05-telegram-bot-publishing
plan: 03
subsystem: backend/triggers
tags:
  - firestore-triggers
  - matching
  - notifications
  - automation
dependency_graph:
  requires:
    - scoring-engine (client-side matching logic)
    - notification system (in-app notifications)
  provides:
    - automated matching notifications
    - new property customer alerts
    - new customer property suggestions
  affects:
    - notification collection
    - property documents (matchNotificationsSent flag)
    - customer documents (suggestionsSent flag)
tech_stack:
  added:
    - firebase-functions/v2/firestore (onDocumentCreated triggers)
  patterns:
    - Firestore triggers for automation
    - Idempotency flags for duplicate prevention
    - Simplified scoring function isolation (duplicated from client)
    - Top-N match selection (top 5, score >= 60%)
key_files:
  created:
    - functions/src/triggers/onPropertyCreated.ts
    - functions/src/triggers/onCustomerCreated.ts
  modified:
    - functions/src/index.ts
    - src/types/customer.ts
decisions:
  - Duplicate scoring logic in Cloud Functions for isolation (avoid importing client code)
  - 60% score threshold for notifications (balances relevance with discovery)
  - Top 5 matches limit (prevents notification spam)
  - Idempotency flags prevent duplicate notifications on trigger re-runs
  - europe-west1 region for KVKK compliance
  - Single notification for customer suggestions, individual notifications for property matches
  - telegramChatId field added to Customer type for future Telegram integration
metrics:
  duration: 8
  tasks_completed: 3
  files_created: 2
  files_modified: 2
  commits: 3
  completed_at: "2026-02-21"
---

# Phase 05 Plan 03: Firestore Matching Triggers Summary

**One-liner:** Automated Firestore triggers for real-time property-customer matching notifications with scoring-based filtering.

## What We Built

Implemented two Firestore triggers that automatically create in-app notifications when new properties or customers are added:

1. **Property Created Trigger** - When agent adds a new property, system finds matching customers and creates notifications
2. **Customer Created Trigger** - When agent adds a new customer, system finds matching properties and creates suggestion notification
3. **Type Updates** - Added telegramChatId field to Customer type for future Telegram integration

## Tasks Completed

### Task 1: Create onPropertyCreated trigger for customer notifications
**Status:** ✅ Complete
**Commit:** a147fa6

Created Firestore trigger that:
- Listens on `users/{userId}/properties/{propertyId}` document creation
- Scores all customers against the new property using simplified scoring function
- Creates notifications for top 5 matches with score >= 60%
- Uses idempotency flag (`matchNotificationsSent`) to prevent duplicates
- Deployed to europe-west1 region for KVKK compliance

**Files:**
- Created: `functions/src/triggers/onPropertyCreated.ts`

### Task 2: Create onCustomerCreated trigger for property suggestions
**Status:** ✅ Complete
**Commit:** 18dbe5e

Created Firestore trigger that:
- Listens on `users/{userId}/customers/{customerId}` document creation
- Scores all active properties against the new customer
- Creates single notification with top 5 property suggestions (score >= 60%)
- Uses idempotency flag (`suggestionsSent`) to prevent duplicates
- Deployed to europe-west1 region for KVKK compliance

**Files:**
- Created: `functions/src/triggers/onCustomerCreated.ts`

### Task 3: Export triggers and add telegramChatId field
**Status:** ✅ Complete
**Commit:** 624e3be

Updated exports and types:
- Exported both trigger functions from `functions/src/index.ts`
- Added optional `telegramChatId?: number` field to Customer interface
- Field will be populated when user links their Telegram account

**Files:**
- Modified: `functions/src/index.ts`
- Modified: `src/types/customer.ts`

## Technical Implementation

### Simplified Scoring Function

Duplicated scoring logic from client-side `scoring-engine.ts` for Cloud Functions isolation:

```typescript
function scorePropertyForCustomer(customer: Customer, property: Property): number {
  const factors = {
    locationMatch: 0,    // 30% weight
    budgetMatch: 0,      // 30% weight
    typeMatch: 0,        // 20% weight
    roomsMatch: 0        // 20% weight
  };

  // Location matching (city = 30pts, district partial = 20pts)
  // Budget matching (exact = 30pts, within 10% = 15pts)
  // Property type matching (exact = 20pts)
  // Rooms matching (exact = 20pts, no preference = 10pts)

  return Math.max(0, Math.min(100, score));
}
```

### Notification Patterns

**Property Match Notifications** (one per customer):
```typescript
{
  type: 'property_match',
  title: 'Yeni mülk: [Property Title]',
  message: '[Customer Name] için %[score] eşleşen mülk eklendi',
  data: { propertyId, customerId, score }
}
```

**Customer Suggestion Notification** (one with multiple properties):
```typescript
{
  type: 'customer_suggestions',
  title: '[Customer Name] için [N] mülk önerisi',
  message: '[Property 1] (%[score]), [Property 2] (%[score]), ...',
  data: { customerId, suggestions: [{ propertyId, score }, ...] }
}
```

### Idempotency Strategy

Both triggers use document flags to prevent duplicate notifications:
- `matchNotificationsSent` - Set on property document after processing
- `suggestionsSent` - Set on customer document after processing

This prevents re-triggering if the function retries or if the document is updated.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

✅ TypeScript compilation successful: `cd functions && npm run build`
✅ Both triggers exported from `functions/src/index.ts`
✅ Idempotency checks implemented in both triggers
✅ Scoring logic matches client-side pattern (location 30%, budget 30%, type 20%, rooms 20%)
✅ Customer type includes telegramChatId field
✅ Region set to europe-west1 for KVKK compliance

## Integration Points

**Firestore Collections:**
- Reads: `users/{userId}/customers`, `users/{userId}/properties`
- Writes: `users/{userId}/notifications`
- Updates: Property and Customer documents (idempotency flags)

**Notification System:**
- Triggers create notifications that appear in existing notification dropdown
- Uses existing notification types and data structure
- Notifications will be displayed via real-time listeners (implemented in Phase 03-04)

**Future Integration:**
- `telegramChatId` field ready for Phase 05-04 (Telegram bot implementation)
- Notifications can be extended to send Telegram messages when chatId is available

## Next Steps

After this plan:
1. Phase 05-04: Implement Telegram bot webhook handler
2. Phase 05-05: Connect Telegram notifications to matching triggers
3. Phase 05-06: Add Telegram account linking UI

## Success Criteria Met

- ✅ notifyMatchingCustomers trigger fires on new property creation
- ✅ suggestMatchingProperties trigger fires on new customer creation
- ✅ Both triggers create in-app notifications with matching scores
- ✅ Idempotency flags prevent duplicate notifications
- ✅ Customer type includes telegramChatId for future Telegram notifications

## Self-Check: PASSED

**Created files exist:**
```
FOUND: functions/src/triggers/onPropertyCreated.ts
FOUND: functions/src/triggers/onCustomerCreated.ts
```

**Modified files exist:**
```
FOUND: functions/src/index.ts
FOUND: src/types/customer.ts
```

**Commits exist:**
```
FOUND: a147fa6 (Task 1: onPropertyCreated trigger)
FOUND: 18dbe5e (Task 2: onCustomerCreated trigger)
FOUND: 624e3be (Task 3: exports and Customer type)
```

**Exports verified:**
```
✓ notifyMatchingCustomers exported from index.ts
✓ suggestMatchingProperties exported from index.ts
✓ telegramChatId field added to Customer type
```
