import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  subscribeToNotifications,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  deleteNotification as deleteNotificationService
} from '@/lib/firebase/notification-service'
import type { Notification } from '@/types/notification'

/**
 * Hook for managing user notifications
 * Provides real-time subscription to notifications
 */
export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // Subscribe to real-time notifications
    const unsubscribe = subscribeToNotifications(user.uid, (updatedNotifications) => {
      setNotifications(updatedNotifications)
      setIsLoading(false)
    })

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [user?.uid])

  /**
   * Mark a notification as read
   */
  const markAsRead = async (notificationId: string) => {
    if (!user?.uid) return

    try {
      await markAsReadService(user.uid, notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    if (!user?.uid) return

    try {
      await markAllAsReadService(user.uid)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  /**
   * Delete a notification
   */
  const deleteNotification = async (notificationId: string) => {
    if (!user?.uid) return

    try {
      await deleteNotificationService(user.uid, notificationId)
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}
