/**
 * JSON schemas for Claude structured outputs
 * Used for intent detection and entity extraction from Turkish natural language
 */

export const intentSchema = {
  type: 'object',
  properties: {
    intent: {
      type: 'string',
      enum: [
        'add_property',
        'add_customer',
        'search_properties',
        'search_customers',
        'update_status',
        'add_note',
        'request_matches',
        'edit_description',
        'confirm_action',
        'cancel_action',
        'need_clarification',
        'general_chat'
      ],
      description: 'The detected user intent'
    },
    confidence: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
      description: 'Confidence level of intent detection'
    },
    entities: {
      type: 'object',
      properties: {
        propertyType: {
          type: 'string',
          description: 'Type of property: daire, villa, arsa, işyeri, etc.'
        },
        rooms: {
          type: 'string',
          description: 'Room configuration: 3+1, 2+1, stüdyo, etc.'
        },
        location: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name in Turkish' },
            district: { type: 'string', description: 'District/ilçe name in Turkish' },
            neighborhood: { type: 'string', description: 'Neighborhood/mahalle name in Turkish' }
          },
          description: 'Property location information'
        },
        price: {
          type: 'object',
          properties: {
            value: { type: 'number', description: 'Exact price value' },
            min: { type: 'number', description: 'Minimum price for range search' },
            max: { type: 'number', description: 'Maximum price for range search' }
          },
          description: 'Price information in TL'
        },
        area: {
          type: 'object',
          properties: {
            value: { type: 'number', description: 'Exact area in m²' },
            min: { type: 'number', description: 'Minimum area for range search' },
            max: { type: 'number', description: 'Maximum area for range search' }
          },
          description: 'Property area in square meters'
        },
        customerName: {
          type: 'string',
          description: 'Customer name'
        },
        customerPhone: {
          type: 'string',
          description: 'Customer phone number'
        },
        budget: {
          type: 'object',
          properties: {
            min: { type: 'number', description: 'Minimum budget' },
            max: { type: 'number', description: 'Maximum budget' }
          },
          description: 'Customer budget range'
        },
        status: {
          type: 'string',
          enum: ['active', 'pending', 'sold', 'archived'],
          description: 'Property status to update to'
        },
        propertyReference: {
          type: 'string',
          description: 'Reference to a specific property (by location, type, or ID)'
        },
        customerReference: {
          type: 'string',
          description: 'Reference to a specific customer (by name or ID)'
        },
        noteContent: {
          type: 'string',
          description: 'Content of note to add'
        },
        descriptionText: {
          type: 'string',
          description: 'New or edited description text'
        }
      },
      description: 'Extracted entities from user message'
    },
    clarificationNeeded: {
      type: 'string',
      description: 'Question to ask user if clarification is needed'
    },
    suggestedActions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Suggested actions the user might want to take'
    }
  },
  required: ['intent', 'confidence']
} as const

export type IntentResult = {
  intent: 'add_property' | 'add_customer' | 'search_properties' | 'search_customers' |
          'update_status' | 'add_note' | 'request_matches' | 'edit_description' |
          'confirm_action' | 'cancel_action' | 'need_clarification' | 'general_chat'
  confidence: 'high' | 'medium' | 'low'
  entities?: {
    propertyType?: string
    rooms?: string
    location?: {
      city?: string
      district?: string
      neighborhood?: string
    }
    price?: {
      value?: number
      min?: number
      max?: number
    }
    area?: {
      value?: number
      min?: number
      max?: number
    }
    customerName?: string
    customerPhone?: string
    budget?: {
      min?: number
      max?: number
    }
    status?: 'active' | 'pending' | 'sold' | 'archived'
    propertyReference?: string
    customerReference?: string
    noteContent?: string
    descriptionText?: string
  }
  clarificationNeeded?: string
  suggestedActions?: string[]
}
