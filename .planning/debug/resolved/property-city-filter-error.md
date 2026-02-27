---
status: resolved
trigger: "When user enters a city in the property filters, they get 'Mulkler yuklenirken hata olustu' error"
created: 2026-02-27T10:00:00Z
updated: 2026-02-27T14:30:00Z
---

## Current Focus

hypothesis: Missing Firestore composite index for location.city + createdAt query
test: Check firestore.indexes.json for required indexes
expecting: Empty or missing index definitions
next_action: Document root cause and recommend fix

## Symptoms

expected: Property list filters by city, status, and price range
actual: Error "Mulkler yuklenirken hata olustu" when city filter applied
errors: Firestore query fails (likely "requires an index" error in console)
reproduction: 1) Go to Properties page, 2) Select any city from filter dropdown, 3) Click "Filtrele"
started: Always broken when using city filter with orderBy

## Eliminated

(none - first hypothesis confirmed)

## Evidence

- timestamp: 2026-02-27T10:02:00Z
  checked: /src/hooks/useProperties.ts lines 73-75
  found: Query uses where('location.city', '==', filters.city) combined with orderBy('createdAt', 'desc')
  implication: Firestore requires composite index for where + orderBy on different fields

- timestamp: 2026-02-27T10:03:00Z
  checked: /firestore.indexes.json
  found: File contains empty indexes array: {"indexes": [], "fieldOverrides": []}
  implication: No composite indexes defined - query will fail with "requires an index" error

- timestamp: 2026-02-27T10:04:00Z
  checked: /src/types/property.ts lines 9-13
  found: PropertyLocation has city as nested field inside location object
  implication: Firestore needs index on nested field path "location.city"

## Resolution

root_cause: Firestore requires composite indexes for queries that combine inequality/range filters or multiple fields with orderBy. The useProperties hook queries with `where('location.city', '==', city)` combined with `orderBy('createdAt', 'desc')`, but no composite index exists in firestore.indexes.json.

fix: Add composite indexes for all filter+orderBy combinations to firestore.indexes.json and deploy with `firebase deploy --only firestore:indexes`

verification: VERIFIED - Fixed by 01-04 gap closure plan (commit ee1f997)
files_changed: [firestore.indexes.json]
