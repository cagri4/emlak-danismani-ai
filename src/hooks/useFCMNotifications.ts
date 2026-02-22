import { useState, useEffect } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { getMessagingInstance } from '@/lib/firebase'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

interface FCMNotificationHook {
  hasPermission: boolean
  token: string | null
  isLoading: boolean
  requestPermission: () => Promise<void>
}

/**
 * Hook for managing Firebase Cloud Messaging (FCM) push notifications
 * Handles permission requests, token management, and foreground message handling
 */
export function useFCMNotifications(): FCMNotificationHook {
  const { user } = useAuth()
  const [hasPermission, setHasPermission] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check current permission state on mount
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const checkPermission = async () => {
      try {
        const permission = Notification.permission
        setHasPermission(permission === 'granted')

        // If permission already granted, get token
        if (permission === 'granted') {
          await getAndSaveToken()
        }
      } catch (error) {
        console.error('Error checking notification permission:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermission()
  }, [user])

  // Setup foreground message handler
  useEffect(() => {
    if (!user || !hasPermission) return

    const setupForegroundHandler = async () => {
      const messaging = await getMessagingInstance()
      if (!messaging) return

      // Handle foreground messages (when app is open)
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload)

        const title = payload.notification?.title || 'Emlak AI'
        const body = payload.notification?.body || 'Yeni bildirim'

        // Show toast notification
        toast.info(title, {
          description: body,
          duration: 5000,
        })
      })

      return unsubscribe
    }

    setupForegroundHandler()
  }, [user, hasPermission])

  const getAndSaveToken = async () => {
    try {
      const messaging = await getMessagingInstance()
      if (!messaging || !user) return

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
      if (!vapidKey) {
        console.error('VAPID key not configured')
        return
      }

      // Get FCM token
      const currentToken = await getToken(messaging, { vapidKey })

      if (currentToken) {
        setToken(currentToken)

        // Save token to Firestore
        await setDoc(
          doc(db, 'users', user.uid, 'fcmTokens', currentToken),
          {
            token: currentToken,
            platform: navigator.platform,
            browser: navigator.userAgent,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )

        console.log('FCM token saved:', currentToken)
      } else {
        console.warn('No FCM registration token available')
      }
    } catch (error) {
      console.error('Error getting FCM token:', error)
      throw error
    }
  }

  const requestPermission = async () => {
    if (!user) {
      toast.error('Bildirimler için giriş yapmalısınız')
      return
    }

    setIsLoading(true)

    try {
      // Request notification permission
      const permission = await Notification.requestPermission()

      if (permission === 'granted') {
        setHasPermission(true)
        await getAndSaveToken()
        toast.success('Bildirimler açıldı!')
      } else if (permission === 'denied') {
        toast.error('Bildirim izni reddedildi')
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      toast.error('Bildirim izni alınırken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    hasPermission,
    token,
    isLoading,
    requestPermission,
  }
}
