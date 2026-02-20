import type { ChatMessage } from '@/types/chat'

/**
 * Manage conversation context window
 * Keep recent messages, summarize old ones to stay within token limits
 */

const MAX_FULL_MESSAGES = 20
const MAX_TOTAL_MESSAGES = 50

export interface ConversationContext {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  hasMore: boolean
}

/**
 * Build conversation context for Claude API
 * Keeps last MAX_FULL_MESSAGES messages in full
 * Older messages are summarized or dropped
 */
export function buildConversationContext(
  messages: ChatMessage[]
): ConversationContext {
  // Convert to Claude message format
  const claudeMessages = messages
    .filter(msg => msg.status === 'sent') // Only include sent messages
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }))

  // If under limit, return all messages
  if (claudeMessages.length <= MAX_FULL_MESSAGES) {
    return {
      messages: claudeMessages,
      hasMore: false
    }
  }

  // Keep last MAX_FULL_MESSAGES messages
  const recentMessages = claudeMessages.slice(-MAX_FULL_MESSAGES)

  return {
    messages: recentMessages,
    hasMore: claudeMessages.length > MAX_FULL_MESSAGES
  }
}

/**
 * Extract key information from a message for context summary
 */
export function extractKeyInfo(message: ChatMessage): string | null {
  // Extract property/customer IDs from embedded content
  if (message.embeddedProperty) {
    return `[Property: ${message.embeddedProperty}]`
  }
  if (message.embeddedCustomer) {
    return `[Customer: ${message.embeddedCustomer}]`
  }
  if (message.embeddedMatches && message.embeddedMatches.length > 0) {
    return `[Matches: ${message.embeddedMatches.length} results]`
  }

  // For regular messages, extract intent if it's a short command
  if (message.role === 'user' && message.content.length < 100) {
    return message.content
  }

  return null
}

/**
 * Summarize older messages to reduce token count
 * This is a placeholder - in production, you'd call Claude to generate summaries
 */
export function summarizeOldMessages(
  messages: ChatMessage[]
): string {
  const keyEvents = messages
    .map(extractKeyInfo)
    .filter(Boolean)
    .slice(0, 5) // Keep up to 5 key events

  if (keyEvents.length === 0) {
    return 'Önceki görüşme: Genel sohbet'
  }

  return `Önceki görüşme özeti: ${keyEvents.join(', ')}`
}

/**
 * Check if conversation needs cleanup/summarization
 */
export function needsContextCleanup(messages: ChatMessage[]): boolean {
  return messages.length > MAX_TOTAL_MESSAGES
}

/**
 * Get conversation statistics for debugging
 */
export function getConversationStats(messages: ChatMessage[]): {
  total: number
  user: number
  assistant: number
  withEmbeds: number
} {
  return {
    total: messages.length,
    user: messages.filter(m => m.role === 'user').length,
    assistant: messages.filter(m => m.role === 'assistant').length,
    withEmbeds: messages.filter(m =>
      m.embeddedProperty || m.embeddedCustomer ||
      (m.embeddedMatches && m.embeddedMatches.length > 0)
    ).length
  }
}
