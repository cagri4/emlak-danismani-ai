import { differenceInDays } from 'date-fns'
import { Customer } from '@/types/customer'
import { MatchOutcome } from '@/types/matching'

export interface ScoringSignal {
  lastInteraction: Date
  interactionCount: number
  likedProperties: number      // from match_outcomes
  rejectedProperties: number   // from match_outcomes
  isBoosted: boolean
}

/**
 * Calculate lead score based on engagement signals with time decay
 *
 * Algorithm:
 * - Base score from interactions, likes, and rejects
 * - Time decay: exponential decay after 14 days without contact
 * - Boost: manual priority marker adds fixed bonus
 *
 * @param signal - Engagement signals for the customer
 * @returns Score (0+), higher is better
 */
export function calculateLeadScore(signal: ScoringSignal): number {
  const daysSinceContact = differenceInDays(new Date(), signal.lastInteraction)

  // Time decay: exponential decay after 14 days
  // Per RESEARCH.md: ~60% at 30 days, ~36% at 45 days
  const timeFactor = daysSinceContact <= 14
    ? 1.0
    : Math.exp(-0.05 * (daysSinceContact - 14))

  // Weighted signals (engagement score)
  const engagementScore = (
    signal.interactionCount * 2 +      // Each interaction: 2 points
    signal.likedProperties * 5 +        // Each like: 5 points
    signal.rejectedProperties * -1      // Each rejection: -1 point
  )

  // Apply time decay
  let score = Math.max(0, engagementScore * timeFactor)

  // Boost adds fixed bonus (per user decision: "boost/pin feature to mark important")
  if (signal.isBoosted) {
    score += 20  // Significant but not overwhelming
  }

  return Math.round(score)
}

/**
 * Convert lead score to temperature category
 *
 * @param score - Lead score
 * @returns Temperature: hot (30+), warm (15-30), cold (<15)
 */
export function getLeadTemperature(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 30) return 'hot'
  if (score >= 15) return 'warm'
  return 'cold'
}

/**
 * Build scoring signal from customer data and match outcomes
 *
 * @param customer - Customer data
 * @param outcomes - Match outcomes for this customer
 * @returns ScoringSignal ready for score calculation
 */
export function buildScoringSignal(
  customer: Customer,
  outcomes: MatchOutcome[]
): ScoringSignal {
  // Extract last interaction date
  let lastInteraction: Date
  if (customer.lastInteraction) {
    lastInteraction = customer.lastInteraction instanceof Date
      ? customer.lastInteraction
      : customer.lastInteraction.toDate()
  } else {
    // Fall back to created date if no interactions
    lastInteraction = customer.createdAt instanceof Date
      ? customer.createdAt
      : customer.createdAt.toDate()
  }

  // Count liked and rejected properties
  const likedProperties = outcomes.filter(o => o.liked).length
  const rejectedProperties = outcomes.filter(o => !o.liked).length

  return {
    lastInteraction,
    interactionCount: customer.interactionCount || 0,
    likedProperties,
    rejectedProperties,
    isBoosted: customer.isBoosted || false
  }
}
