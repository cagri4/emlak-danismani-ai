import { Property } from '@/types/property'
import { Customer } from '@/types/customer'
import { MatchScore, PropertyMatch, CustomerMatch, MatchOutcome } from '@/types/matching'

export async function scorePropertyForCustomer(
  customer: Customer,
  property: Property,
  outcomes: MatchOutcome[]
): Promise<MatchScore> {
  const factors = {
    locationMatch: 0,
    budgetMatch: 0,
    typeMatch: 0,
    roomsMatch: 0,
    historyPenalty: 0
  }

  // Location (30% weight)
  if (customer.preferences.location.includes(property.location.city)) {
    factors.locationMatch = 30
  } else if (customer.preferences.location.some(loc =>
    property.location.district?.toLowerCase().includes(loc.toLowerCase())
  )) {
    factors.locationMatch = 20  // Partial match
  }

  // Budget (30% weight)
  const { min, max } = customer.preferences.budget
  if (property.price >= min && property.price <= max) {
    factors.budgetMatch = 30
  } else if (property.price >= min * 0.9 && property.price <= max * 1.1) {
    factors.budgetMatch = 15  // Within 10% tolerance
  }

  // Property type (20% weight)
  if (customer.preferences.propertyType.includes(property.type)) {
    factors.typeMatch = 20
  }

  // Rooms (20% weight)
  if (customer.preferences.rooms?.includes(property.rooms || '')) {
    factors.roomsMatch = 20
  } else if (!customer.preferences.rooms || customer.preferences.rooms.length === 0) {
    factors.roomsMatch = 10  // No preference = partial match
  }

  // History penalty - check past rejections
  const rejections = outcomes.filter(o =>
    !o.liked &&
    o.customerId === customer.id &&
    o.propertyId === property.id
  )
  factors.historyPenalty = Math.max(-20, -10 * rejections.length)

  const score = Object.values(factors).reduce((sum, val) => sum + val, 0)

  return {
    score: Math.max(0, Math.min(100, score)),
    factors
  }
}

export async function findMatchesForCustomer(
  customer: Customer,
  properties: Property[],
  outcomes: MatchOutcome[],
  limit = 5
): Promise<PropertyMatch[]> {
  const matches = await Promise.all(
    properties
      .filter(p => p.status === 'aktif')  // Only active properties
      .map(async (property) => ({
        property,
        score: await scorePropertyForCustomer(customer, property, outcomes),
        explanation: ''  // Filled later by explanation generator
      }))
  )

  // Sort by score descending
  matches.sort((a, b) => b.score.score - a.score.score)

  // Take top N
  return matches.slice(0, limit)
}

export async function scoreCustomerForProperty(
  property: Property,
  customer: Customer,
  outcomes: MatchOutcome[]
): Promise<MatchScore> {
  // Same scoring logic, just reversed perspective
  return scorePropertyForCustomer(customer, property, outcomes)
}

export async function findMatchesForProperty(
  property: Property,
  customers: Customer[],
  outcomes: MatchOutcome[],
  limit = 5
): Promise<CustomerMatch[]> {
  const matches = await Promise.all(
    customers.map(async (customer) => ({
      customer,
      score: await scoreCustomerForProperty(property, customer, outcomes),
      explanation: ''  // Filled later by explanation generator
    }))
  )

  // Sort by score descending
  matches.sort((a, b) => b.score.score - a.score.score)

  // Take top N with score > 0
  return matches.filter(m => m.score.score > 0).slice(0, limit)
}
