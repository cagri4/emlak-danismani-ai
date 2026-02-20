import { parseWithStructuredOutput } from './claude-client'
import { intentSchema, type IntentResult } from './structured-schemas'
import type { ChatMessage } from '@/types/chat'

/**
 * Parsed command result with Turkish language support
 */
export interface ParsedCommand {
  needsClarification: boolean
  clarificationQuestion?: string
  intent?: IntentResult['intent']
  entities?: IntentResult['entities']
  suggestedActions?: string[]
  confidence?: 'high' | 'medium' | 'low'
}

/**
 * Parse Turkish natural language commands
 * Extract intent and entities for command execution
 */
export async function parseCommand(
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<ParsedCommand> {
  try {
    // Convert chat messages to Claude format
    const claudeHistory = conversationHistory
      .filter(msg => msg.status === 'sent')
      .slice(-10) // Last 10 messages for context
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))

    // Call Claude with structured output
    const result = await parseWithStructuredOutput(
      userMessage,
      claudeHistory,
      intentSchema
    )

    // If low confidence, return clarification needed
    if (result.confidence === 'low' || result.intent === 'need_clarification') {
      return {
        needsClarification: true,
        clarificationQuestion: result.clarificationNeeded ||
          'Anlayamadım. Lütfen daha açık ifade eder misiniz?'
      }
    }

    return {
      needsClarification: false,
      intent: result.intent,
      entities: normalizeEntities(result.entities),
      suggestedActions: result.suggestedActions,
      confidence: result.confidence
    }

  } catch (error) {
    console.error('Error parsing command:', error)

    // Return generic clarification on error
    return {
      needsClarification: true,
      clarificationQuestion: 'Bir hata oluştu. Lütfen tekrar dener misiniz?'
    }
  }
}

/**
 * Normalize extracted entities for Turkish language
 * Handle Turkish-specific formats and character normalization
 */
function normalizeEntities(entities?: IntentResult['entities']): IntentResult['entities'] {
  if (!entities) return undefined

  const normalized = { ...entities }

  // Normalize Turkish price format (2M, 1.5M, 500K)
  if (normalized.price) {
    if (normalized.price.value !== undefined) {
      normalized.price.value = normalizePriceValue(normalized.price.value)
    }
    if (normalized.price.min !== undefined) {
      normalized.price.min = normalizePriceValue(normalized.price.min)
    }
    if (normalized.price.max !== undefined) {
      normalized.price.max = normalizePriceValue(normalized.price.max)
    }
  }

  // Normalize budget range
  if (normalized.budget) {
    if (normalized.budget.min !== undefined) {
      normalized.budget.min = normalizePriceValue(normalized.budget.min)
    }
    if (normalized.budget.max !== undefined) {
      normalized.budget.max = normalizePriceValue(normalized.budget.max)
    }
  }

  // Normalize location (Turkish character handling)
  if (normalized.location) {
    if (normalized.location.city) {
      normalized.location.city = normalizeLocation(normalized.location.city)
    }
    if (normalized.location.district) {
      normalized.location.district = normalizeLocation(normalized.location.district)
    }
    if (normalized.location.neighborhood) {
      normalized.location.neighborhood = normalizeLocation(normalized.location.neighborhood)
    }
  }

  // Normalize room format (3+1, 2+1, etc.)
  if (normalized.rooms) {
    normalized.rooms = normalizeRoomFormat(normalized.rooms)
  }

  // Normalize property type
  if (normalized.propertyType) {
    normalized.propertyType = normalizePropertyType(normalized.propertyType)
  }

  return normalized
}

/**
 * Normalize price values from Turkish format
 * 2M -> 2000000, 1.5M -> 1500000, 500K -> 500000
 */
function normalizePriceValue(value: number | string): number {
  if (typeof value === 'number') return value

  const str = value.toString().toLowerCase().trim()

  // Handle "M" (million)
  if (str.includes('m')) {
    const num = parseFloat(str.replace('m', '').replace(',', '.'))
    return num * 1000000
  }

  // Handle "K" (thousand)
  if (str.includes('k')) {
    const num = parseFloat(str.replace('k', '').replace(',', '.'))
    return num * 1000
  }

  // Handle "milyon"
  if (str.includes('milyon')) {
    const num = parseFloat(str.replace('milyon', '').trim().replace(',', '.'))
    return num * 1000000
  }

  // Handle "bin"
  if (str.includes('bin')) {
    const num = parseFloat(str.replace('bin', '').trim().replace(',', '.'))
    return num * 1000
  }

  // Return as-is if no special format
  return parseFloat(str.replace(',', '.')) || 0
}

/**
 * Normalize location names (preserve Turkish characters)
 */
function normalizeLocation(location: string): string {
  // Capitalize first letter of each word, preserve Turkish characters
  return location
    .split(' ')
    .map(word => {
      if (word.length === 0) return word
      const first = word[0].toLocaleUpperCase('tr-TR')
      const rest = word.slice(1).toLocaleLowerCase('tr-TR')
      return first + rest
    })
    .join(' ')
}

/**
 * Normalize room format (3+1, 2+1, stüdyo)
 */
function normalizeRoomFormat(rooms: string): string {
  const str = rooms.toLowerCase().trim()

  // Handle variations of "stüdyo"
  if (str.includes('stud') || str.includes('stüd')) {
    return 'Stüdyo'
  }

  // Handle variations of "dubleks"
  if (str.includes('dubl') || str.includes('duple')) {
    return 'Dubleks'
  }

  // Normalize format like "3 + 1" to "3+1"
  const normalized = str.replace(/\s/g, '')

  // Validate format (number+number)
  if (/^\d+\+\d+$/.test(normalized)) {
    return normalized
  }

  return rooms // Return as-is if can't normalize
}

/**
 * Normalize property type
 */
function normalizePropertyType(type: string): string {
  const str = type.toLowerCase().trim()

  const typeMap: Record<string, string> = {
    'daire': 'Daire',
    'apartman': 'Daire',
    'apartment': 'Daire',
    'villa': 'Villa',
    'müstakil': 'Villa',
    'arsa': 'Arsa',
    'land': 'Arsa',
    'işyeri': 'İşyeri',
    'isyeri': 'İşyeri',
    'ofis': 'İşyeri',
    'dükkan': 'İşyeri',
    'residence': 'Residence',
    'rezidans': 'Residence'
  }

  return typeMap[str] || type
}

/**
 * Validate if command has all required entities
 */
export function validateCommandEntities(
  intent: string,
  entities?: IntentResult['entities']
): { valid: boolean; missing?: string[] } {
  if (!entities) {
    return { valid: false, missing: ['all entities'] }
  }

  const missing: string[] = []

  switch (intent) {
    case 'add_property':
      if (!entities.propertyType) missing.push('mülk tipi')
      if (!entities.location?.city) missing.push('şehir')
      if (!entities.price?.value) missing.push('fiyat')
      break

    case 'add_customer':
      if (!entities.customerName) missing.push('müşteri adı')
      break

    case 'search_properties':
      // At least one search criteria required
      const hasSearchCriteria =
        entities.location?.city ||
        entities.propertyType ||
        entities.price?.min ||
        entities.price?.max ||
        entities.rooms
      if (!hasSearchCriteria) missing.push('arama kriteri')
      break

    case 'update_status':
      if (!entities.propertyReference) missing.push('mülk referansı')
      if (!entities.status) missing.push('yeni durum')
      break

    case 'request_matches':
      if (!entities.customerReference) missing.push('müşteri referansı')
      break

    case 'edit_description':
      if (!entities.propertyReference) missing.push('mülk referansı')
      break
  }

  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined
  }
}
