export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
  // For embedded cards
  embeddedProperty?: string;  // propertyId
  embeddedCustomer?: string;  // customerId
  embeddedMatches?: MatchResult[];
}

export interface MatchResult {
  propertyId: string;
  customerId: string;
  score: number;
  explanation: string;
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatState {
  isOpen: boolean;
  isLoading: boolean;
  messages: ChatMessage[];
  conversationId: string | null;
  error: string | null;
}
