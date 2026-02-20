import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage } from '@/types/chat';
import { parseCommand } from '@/lib/ai/command-parser';
import { handleCommand } from '@/lib/ai/command-handlers';
import { useAuth } from '@/contexts/AuthContext';
import { useProperties } from './useProperties';
import { useCustomers } from './useCustomers';
import { useMatching } from './useMatching';
import { saveMessage, getConversation } from '@/lib/firebase/conversation-service';

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setIsLoading: (loading: boolean) => void;
  conversationId: string;
}

// Get or create a persistent conversation ID for the user
function getConversationId(userId: string): string {
  const storageKey = `chat_conversation_${userId}`;
  let conversationId = localStorage.getItem(storageKey);

  if (!conversationId) {
    conversationId = crypto.randomUUID();
    localStorage.setItem(storageKey, conversationId);
  }

  return conversationId;
}

export function useChat(): UseChatReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [pendingConfirmation, setPendingConfirmation] = useState<any>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Initialize conversation ID and load history when user is available
  useEffect(() => {
    if (user && !conversationId) {
      const id = getConversationId(user.uid);
      setConversationId(id);
    }
  }, [user, conversationId]);

  // Load conversation history from Firestore
  useEffect(() => {
    async function loadHistory() {
      if (!user || !conversationId || historyLoaded) return;

      try {
        const result = await getConversation(user.uid, conversationId);
        if (result.success && result.messages && result.messages.length > 0) {
          setMessages(result.messages);
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
      } finally {
        setHistoryLoaded(true);
      }
    }

    loadHistory();
  }, [user, conversationId, historyLoaded]);

  // Get property and customer hooks for command execution
  const {
    properties,
    addProperty,
    updateProperty,
    getProperty,
  } = useProperties();

  const {
    customers,
    addCustomer,
    updateCustomer,
    getCustomer,
    addInteraction,
  } = useCustomers();

  const {
    findPropertiesForCustomer,
    findCustomersForProperty,
  } = useMatching();

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);

    // Save to Firestore if user is authenticated
    if (user) {
      saveMessage(user.uid, conversationId, message).catch(err => {
        console.error('Failed to save message:', err);
      });
    }
  }, [user, conversationId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !user) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sent',
    };

    addMessage(userMessage);
    setIsLoading(true);

    try {
      // Parse command with AI
      const parsed = await parseCommand(content, messages);

      // If clarification needed, ask user
      if (parsed.needsClarification) {
        const clarificationMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: parsed.clarificationQuestion || 'Anlayamadım. Lütfen daha açık ifade eder misiniz?',
          timestamp: new Date(),
          status: 'sent',
        };

        addMessage(clarificationMessage);
        setIsLoading(false);
        return;
      }

      // Handle special confirmation intents
      if (parsed.intent === 'confirm_action' && pendingConfirmation) {
        // Re-run the original command with confirmation
        const result = await handleCommand(
          pendingConfirmation.action,
          pendingConfirmation.entities,
          {
            userId: user.uid,
            properties,
            addProperty,
            updateProperty,
            getProperty,
            customers,
            addCustomer,
            updateCustomer,
            getCustomer,
            addInteraction,
            findPropertiesForCustomer,
            findCustomersForProperty,
          },
          pendingConfirmation
        );

        // Add AI response
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.message,
          timestamp: new Date(),
          status: 'sent',
          embeddedProperty: result.propertyId,
          embeddedCustomer: result.customerId,
          embeddedMatches: result.matches,
        };

        addMessage(aiMessage);
        setPendingConfirmation(null);
        setIsLoading(false);
        return;
      }

      if (parsed.intent === 'cancel_action') {
        const cancelMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'İşlem iptal edildi.',
          timestamp: new Date(),
          status: 'sent',
        };

        addMessage(cancelMessage);
        setPendingConfirmation(null);
        setIsLoading(false);
        return;
      }

      // Handle the command
      const result = await handleCommand(
        parsed.intent!,
        parsed.entities,
        {
          userId: user.uid,
          properties,
          addProperty,
          updateProperty,
          getProperty,
          customers,
          addCustomer,
          updateCustomer,
          getCustomer,
          addInteraction,
          findPropertiesForCustomer,
          findCustomersForProperty,
        },
        pendingConfirmation
      );

      // If needs confirmation, store pending data
      if (result.needsConfirmation) {
        setPendingConfirmation({
          action: parsed.intent,
          entities: parsed.entities,
          ...result.confirmationData,
        });
      } else {
        setPendingConfirmation(null);
      }

      // Add AI response with embedded cards
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
        status: 'sent',
        embeddedProperty: result.propertyId,
        embeddedCustomer: result.customerId,
        embeddedMatches: result.matches,
      };

      addMessage(aiMessage);

    } catch (error: any) {
      console.error('Error processing message:', error);

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date(),
        status: 'sent',
      };

      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, messages, pendingConfirmation, addMessage, properties, customers, addProperty, updateProperty, getProperty, addCustomer, updateCustomer, getCustomer, addInteraction, findPropertiesForCustomer, findCustomersForProperty]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingConfirmation(null);
    setHistoryLoaded(false);
    // Start a new conversation
    if (user) {
      const newConversationId = crypto.randomUUID();
      localStorage.setItem(`chat_conversation_${user.uid}`, newConversationId);
      setConversationId(newConversationId);
    }
  }, [user]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    setIsLoading,
    conversationId,
  };
}
