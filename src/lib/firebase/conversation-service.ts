import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ChatMessage, Conversation } from '@/types/chat'

/**
 * Save a chat message to Firestore
 */
export async function saveMessage(
  userId: string,
  conversationId: string,
  message: Omit<ChatMessage, 'id'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const messagesRef = collection(
      db,
      'users',
      userId,
      'conversations',
      conversationId,
      'messages'
    )

    const docRef = await addDoc(messagesRef, {
      role: message.role,
      content: message.content,
      status: message.status,
      embeddedProperty: message.embeddedProperty,
      embeddedCustomer: message.embeddedCustomer,
      embeddedMatches: message.embeddedMatches,
      timestamp: serverTimestamp(),
    })

    return { success: true, id: docRef.id }
  } catch (error: any) {
    console.error('Error saving message:', error)
    return {
      success: false,
      error: error?.message || 'Mesaj kaydedilirken hata oluştu'
    }
  }
}

/**
 * Get conversation messages
 */
export async function getConversation(
  userId: string,
  conversationId: string,
  limit: number = 100
): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
  try {
    const messagesRef = collection(
      db,
      'users',
      userId,
      'conversations',
      conversationId,
      'messages'
    )

    const q = query(
      messagesRef,
      orderBy('timestamp', 'asc'),
      firestoreLimit(limit)
    )

    const snapshot = await getDocs(q)

    const messages: ChatMessage[] = snapshot.docs.map(doc => ({
      id: doc.id,
      role: doc.data().role,
      content: doc.data().content,
      status: doc.data().status || 'sent',
      timestamp: doc.data().timestamp?.toDate() || new Date(),
      embeddedProperty: doc.data().embeddedProperty,
      embeddedCustomer: doc.data().embeddedCustomer,
      embeddedMatches: doc.data().embeddedMatches,
    }))

    return { success: true, messages }
  } catch (error: any) {
    console.error('Error fetching conversation:', error)
    return {
      success: false,
      error: error?.message || 'Konuşma yüklenirken hata oluştu'
    }
  }
}

/**
 * Get recent conversations for a user
 */
export async function getRecentConversations(
  userId: string,
  limit: number = 10
): Promise<{ success: boolean; conversations?: Conversation[]; error?: string }> {
  try {
    const conversationsRef = collection(db, 'users', userId, 'conversations')

    const q = query(
      conversationsRef,
      orderBy('updatedAt', 'desc'),
      firestoreLimit(limit)
    )

    const snapshot = await getDocs(q)

    const conversations: Conversation[] = await Promise.all(
      snapshot.docs.map(async (convDoc) => {
        // Get messages for this conversation
        const messagesResult = await getConversation(userId, convDoc.id, 20)

        return {
          id: convDoc.id,
          messages: messagesResult.messages || [],
          createdAt: convDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: convDoc.data().updatedAt?.toDate() || new Date(),
        }
      })
    )

    return { success: true, conversations }
  } catch (error: any) {
    console.error('Error fetching recent conversations:', error)
    return {
      success: false,
      error: error?.message || 'Konuşmalar yüklenirken hata oluştu'
    }
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const conversationsRef = collection(db, 'users', userId, 'conversations')

    const docRef = await addDoc(conversationsRef, {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return { success: true, id: docRef.id }
  } catch (error: any) {
    console.error('Error creating conversation:', error)
    return {
      success: false,
      error: error?.message || 'Konuşma oluşturulurken hata oluştu'
    }
  }
}

/**
 * Update conversation timestamp
 */
export async function updateConversationTimestamp(
  _userId: string,
  _conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Note: We're not using updateDoc here because the conversation doc
    // might not exist yet. The timestamps are handled by saveMessage.
    // This is a placeholder for future enhancements.

    return { success: true }
  } catch (error: any) {
    console.error('Error updating conversation timestamp:', error)
    return {
      success: false,
      error: error?.message || 'Konuşma güncellenirken hata oluştu'
    }
  }
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Note: Firestore doesn't support cascading deletes in web SDK
    // In production, you'd use a Cloud Function to handle this

    const conversationRef = doc(
      db,
      'users',
      userId,
      'conversations',
      conversationId
    )

    // Delete all messages first
    const messagesRef = collection(
      db,
      'users',
      userId,
      'conversations',
      conversationId,
      'messages'
    )

    const messagesSnapshot = await getDocs(messagesRef)
    const deletePromises = messagesSnapshot.docs.map(messageDoc => deleteDoc(messageDoc.ref))
    await Promise.all(deletePromises)

    // Then delete conversation
    await deleteDoc(conversationRef)

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting conversation:', error)
    return {
      success: false,
      error: error?.message || 'Konuşma silinirken hata oluştu'
    }
  }
}
