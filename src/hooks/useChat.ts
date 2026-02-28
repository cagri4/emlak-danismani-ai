import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage } from '@/types/chat';
import { smartChat, ChatContext } from '@/lib/ai/claude-client';
import { useAuth } from '@/contexts/AuthContext';
import { useProperties } from './useProperties';
import { useCustomers } from './useCustomers';
import { saveMessage, getConversation } from '@/lib/firebase/conversation-service';

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setIsLoading: (loading: boolean) => void;
  conversationId: string;
}

interface PendingAction {
  type: 'delete_property' | 'delete_customer';
  id: string;
  title: string;
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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
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

  // Get property and customer hooks
  const {
    properties,
    updateProperty,
    deleteProperty,
    addProperty,
  } = useProperties();

  const {
    customers,
    deleteCustomer,
  } = useCustomers();

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
      const lowerContent = content.toLowerCase().trim();

      // Check for confirmation/cancellation of pending action
      if (pendingAction) {
        if (lowerContent === 'evet' || lowerContent === 'tamam' || lowerContent === 'olur' || lowerContent === 'sil') {
          // Execute the pending action
          let result;
          if (pendingAction.type === 'delete_property') {
            result = await deleteProperty(pendingAction.id);
          } else {
            result = await deleteCustomer(pendingAction.id);
          }

          const responseMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: result.success
              ? `✅ "${pendingAction.title}" başarıyla silindi.`
              : `❌ Silme sırasında hata oluştu: ${result.error}`,
            timestamp: new Date(),
            status: 'sent',
          };

          addMessage(responseMessage);
          setPendingAction(null);
          setIsLoading(false);
          return;
        } else if (lowerContent === 'hayır' || lowerContent === 'iptal' || lowerContent === 'vazgeç') {
          const cancelMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '❌ Silme işlemi iptal edildi.',
            timestamp: new Date(),
            status: 'sent',
          };

          addMessage(cancelMessage);
          setPendingAction(null);
          setIsLoading(false);
          return;
        }
        // If not a clear confirmation/cancellation, clear pending and continue
        setPendingAction(null);
      }

      // Build context for Claude
      const context: ChatContext = {
        properties: properties.map(p => ({
          id: p.id,
          title: p.title,
          type: p.type,
          price: p.price,
          location: {
            city: p.location.city,
            district: p.location.district,
          },
          status: p.status,
          rooms: p.rooms,
        })),
        customers: customers.map(c => ({
          id: c.id,
          name: c.name,
          preferences: {
            budget: c.preferences?.budget || { min: 0, max: 0 },
            location: c.preferences?.location || [],
          },
        })),
      };

      // Build conversation history for context
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Use smart chat
      const result = await smartChat(content, context, conversationHistory);

      // Handle actions
      if (result.action) {
        const action = result.action;

        if (action.type === 'update_price' && action.id && action.value) {
          // Execute price update immediately
          const updateResult = await updateProperty(action.id, { price: action.value });
          const statusText = updateResult.success
            ? `\n\n✅ Fiyat ${formatPrice(action.value)} olarak güncellendi.`
            : `\n\n❌ Güncelleme hatası: ${updateResult.error}`;

          const aiMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: result.text + statusText,
            timestamp: new Date(),
            status: 'sent',
          };

          addMessage(aiMessage);
        } else if (action.type === 'update_status' && action.id && action.value) {
          // Execute status update immediately
          const updateResult = await updateProperty(action.id, { status: action.value });
          const statusText = updateResult.success
            ? `\n\n✅ Durum "${action.value}" olarak güncellendi.`
            : `\n\n❌ Güncelleme hatası: ${updateResult.error}`;

          const aiMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: result.text + statusText,
            timestamp: new Date(),
            status: 'sent',
          };

          addMessage(aiMessage);
        } else if (action.type === 'add_property' && action.propertyData) {
          // Execute property add
          const pd = action.propertyData;
          const addResult = await addProperty({
            title: pd.title,
            type: pd.propertyType as any,
            listingType: pd.listingType as any,
            price: pd.price,
            area: pd.area,
            rooms: pd.rooms,
            status: 'aktif' as any,
            description: '',
            location: {
              city: pd.city,
              district: pd.district,
              neighborhood: pd.neighborhood || '',
            },
            features: pd.features || [],
          });
          const statusText = addResult.success
            ? `\n\n✅ "${pd.title}" mülkü başarıyla eklendi!`
            : `\n\n❌ Ekleme hatası: ${addResult.error}`;

          const aiMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: result.text + statusText,
            timestamp: new Date(),
            status: 'sent',
          };

          addMessage(aiMessage);
        } else if ((action.type === 'delete_property' || action.type === 'delete_customer') && action.needsConfirmation) {
          // Store pending action for confirmation
          setPendingAction({
            type: action.type,
            id: action.id!,
            title: action.title || 'Öğe',
          });

          const confirmMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: result.text + '\n\n⚠️ Silmek istediğinize emin misiniz? (evet/hayır)',
            timestamp: new Date(),
            status: 'sent',
          };

          addMessage(confirmMessage);
        } else {
          // Unknown action, just show the text
          const aiMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: result.text,
            timestamp: new Date(),
            status: 'sent',
          };

          addMessage(aiMessage);
        }
      } else {
        // No action, just show the response
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.text,
          timestamp: new Date(),
          status: 'sent',
        };

        addMessage(aiMessage);
      }

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
  }, [user, messages, pendingAction, addMessage, properties, customers, updateProperty, deleteProperty, deleteCustomer, addProperty]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingAction(null);
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

/**
 * Format price in Turkish format
 */
function formatPrice(price: number): string {
  if (!price) return 'Belirtilmemiş'
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1).replace('.0', '')}M TL`
  } else if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K TL`
  }
  return `${price.toLocaleString('tr-TR')} TL`
}
