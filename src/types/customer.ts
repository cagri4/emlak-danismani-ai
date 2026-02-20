export interface CustomerPreferences {
  location: string[]        // Cities/districts interested in
  budget: {
    min: number
    max: number
  }
  propertyType: string[]    // daire, villa, arsa, etc
  rooms?: string[]          // 2+1, 3+1, etc
  minArea?: number
  maxArea?: number
  urgency: 'low' | 'medium' | 'high'
  notes?: string            // Free-form preference notes
}

export interface Interaction {
  id: string
  type: 'chat_message' | 'phone_call' | 'property_shown' | 'note' | 'match_result'
  content: string
  propertyId?: string       // If interaction involves a property
  conversationId?: string   // If from chat
  timestamp: Date | { toDate: () => Date }
  metadata?: Record<string, any>
}

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  preferences: CustomerPreferences
  interactionCount: number  // Denormalized for quick display
  lastInteraction?: Date | { toDate: () => Date }
  leadScore?: number
  leadTemperature?: 'hot' | 'warm' | 'cold'
  isBoosted?: boolean  // Manual boost/pin (per user decision)
  lastScoreUpdate?: Date | { toDate: () => Date }
  createdAt: Date | { toDate: () => Date }
  updatedAt: Date | { toDate: () => Date }
  userId: string
}

export type CustomerFormData = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'interactionCount' | 'lastInteraction'>
