import { Property } from './property'
import { Customer } from './customer'

export interface MatchScore {
  score: number  // 0-100
  factors: {
    locationMatch: number   // 0-30 points
    budgetMatch: number     // 0-30 points
    typeMatch: number       // 0-20 points
    roomsMatch: number      // 0-20 points
    historyPenalty: number  // negative points for past rejections
  }
}

export interface PropertyMatch {
  property: Property
  score: MatchScore
  explanation: string
}

export interface CustomerMatch {
  customer: Customer
  score: MatchScore
  explanation: string
}

export interface MatchOutcome {
  id: string
  customerId: string
  propertyId: string
  shown: boolean      // Was property shown to customer?
  liked: boolean      // Did customer like it?
  reason?: string     // Why liked/rejected
  timestamp: Date | { toDate: () => Date }
}
