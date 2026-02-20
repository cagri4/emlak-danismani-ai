---
phase: 03-background-processing-scraping
plan: 05
subsystem: scoring
tags: [lead-scoring, time-decay, customer-prioritization, dashboard, date-fns]

# Dependency graph
requires:
  - phase: 02-ai-interface-matching
    provides: Match outcomes collection for scoring signals
  - phase: 03-01
    provides: Cloud Functions infrastructure and patterns
provides:
  - Lead scoring algorithm with exponential time decay after 14 days
  - Temperature categorization (hot/warm/cold) with color badges
  - Boost/pin feature for manual customer prioritization
  - Hot Leads dashboard card showing top engaged customers
  - Automated score recalculation on interactions
affects: [dashboard-analytics, customer-insights, notification-triggers]

# Tech tracking
tech-stack:
  added: [date-fns/differenceInDays]
  patterns: [time-decay-scoring, temperature-categorization, boost-toggle]

key-files:
  created:
    - src/lib/scoring/leadScorer.ts
    - src/hooks/useLeadScore.ts
    - src/components/customers/LeadTemperatureBadge.tsx
    - src/components/dashboard/HotLeadsCard.tsx
  modified:
    - src/types/customer.ts
    - src/pages/Customers.tsx
    - src/pages/Dashboard.tsx
    - src/components/customer/CustomerCard.tsx
    - src/pages/CustomerDetail.tsx

key-decisions:
  - "Exponential decay after 14 days (exp(-0.05 * days))"
  - "Temperature thresholds: hot (30+), warm (15-30), cold (<15)"
  - "Boost adds fixed +20 bonus for important customers"
  - "Score weights: interactions (2pts), likes (5pts), rejects (-1pt)"
  - "Automatic recalculation on every interaction"
  - "Batch calculation hook for list views with 1-hour cache"

patterns-established:
  - "Time decay scoring: exponential decay for engagement recency"
  - "Temperature badges: visual color-coding for lead priority"
  - "Manual boost toggle: star icon for user override"
  - "Dual hook pattern: single customer (useLeadScore) and batch (useLeadScores)"

requirements-completed: [MUST-05]

# Metrics
duration: 8min
completed: 2026-02-20
---

# Phase 03 Plan 05: Lead Scoring & Temperature Summary

**Lead scoring with exponential time decay, temperature badges (hot/warm/cold), and automated priority ranking in customer list and dashboard**

## Performance

- **Duration:** 8 minutes
- **Started:** 2026-02-20T18:09:04Z
- **Completed:** 2026-02-20T18:17:38Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Lead scoring algorithm with time decay (14-day threshold, exponential decay formula)
- Temperature categorization with color-coded badges (hot/warm/cold)
- Customer list sorting by lead score with temperature filtering
- Hot Leads dashboard card showing top 5 hot leads
- Boost/pin feature for manual customer prioritization
- Automatic score recalculation on interactions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lead scoring algorithm with time decay** - `7220ab3` (feat)
2. **Task 2: Create lead score hook and badge component** - `90bddde` (feat)
3. **Task 3: Integrate lead scoring into customers page and dashboard** - `10b9313` (feat)

## Files Created/Modified

- `src/lib/scoring/leadScorer.ts` - Lead scoring algorithm with time decay and temperature categorization
- `src/hooks/useLeadScore.ts` - Hooks for single customer score and batch calculations
- `src/components/customers/LeadTemperatureBadge.tsx` - Color-coded temperature badge (hot/warm/cold)
- `src/components/dashboard/HotLeadsCard.tsx` - Dashboard card showing top 5 hot leads
- `src/types/customer.ts` - Added leadScore, leadTemperature, isBoosted, lastScoreUpdate fields
- `src/pages/Customers.tsx` - Added sorting by lead score and temperature filtering
- `src/pages/Dashboard.tsx` - Integrated HotLeadsCard component
- `src/components/customer/CustomerCard.tsx` - Added temperature badge and boost toggle
- `src/pages/CustomerDetail.tsx` - Added score recalculation trigger on interactions

## Decisions Made

**Time decay formula:**
- Linear factor until 14 days: `timeFactor = 1.0`
- Exponential decay after 14 days: `timeFactor = exp(-0.05 * (daysSinceContact - 14))`
- Results in ~60% at 30 days, ~36% at 45 days (per RESEARCH.md)

**Score calculation:**
- Interactions: 2 points each
- Liked properties: 5 points each
- Rejected properties: -1 point each
- Boost: +20 fixed bonus
- Formula: `round(max(0, engagementScore * timeFactor) + boostBonus)`

**Temperature thresholds:**
- Hot: score >= 30 (red badge with flame icon)
- Warm: score >= 15 and < 30 (amber badge with sun icon)
- Cold: score < 15 (blue badge with snowflake icon)

**UI patterns:**
- Temperature badge: compact mode (dot) and full mode (badge with icon)
- Boost toggle: star icon (filled when boosted, outline when not)
- Hot Leads card: top 5 hot customers with score, phone, and last contact date
- Customer list: sortable by lead score, last interaction, or name
- Filter by temperature: all/hot/warm/cold buttons

**Performance optimization:**
- Batch hook (useLeadScores) for list views
- 1-hour cache for existing scores (skip recalculation if recent)
- Automatic recalculation on interactions (background operation)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation proceeded smoothly following established patterns from customer management and matching systems.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Lead scoring foundation complete for notification triggers
- Temperature data available for dashboard analytics
- Boost feature enables manual priority override
- Ready for notification system integration (plan 03-04)
- Ready for scheduled score recalculation (future enhancement)

## Self-Check

Verifying created files and commits:

- [x] src/lib/scoring/leadScorer.ts exists
- [x] src/hooks/useLeadScore.ts exists
- [x] src/components/customers/LeadTemperatureBadge.tsx exists
- [x] src/components/dashboard/HotLeadsCard.tsx exists
- [x] Commit 7220ab3 exists (Task 1)
- [x] Commit 90bddde exists (Task 2)
- [x] Commit 10b9313 exists (Task 3)

**Self-Check: PASSED**

---
*Phase: 03-background-processing-scraping*
*Completed: 2026-02-20*
