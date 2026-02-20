import { db } from '@/lib/firebase'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  where,
  writeBatch,
  type Unsubscribe
} from 'firebase/firestore'
import type { Notification } from '@/types/notification'

/**
 * Get notifications for a user
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
  const notificationsRef = collection(db, 'users', userId, 'notifications')
  const q = query(
    notificationsRef,
    orderBy('createdAt', 'desc'),
    limit(50)
  )

  const snapshot = await getDocs(q)
  const notifications: Notification[] = []

  snapshot.forEach((doc) => {
    const data = doc.data()
    notifications.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date()
    } as Notification)
  })

  return notifications
}

/**
 * Mark a notification as read
 */
export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'users', userId, 'notifications', notificationId)
  await updateDoc(notificationRef, { read: true })
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const notificationsRef = collection(db, 'users', userId, 'notifications')
  const q = query(notificationsRef, where('read', '==', false))
  const snapshot = await getDocs(q)

  if (snapshot.empty) return

  const batch = writeBatch(db)

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true })
  })

  await batch.commit()
}

/**
 * Delete a notification
 */
export async function deleteNotification(userId: string, notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'users', userId, 'notifications', notificationId)
  await deleteDoc(notificationRef)
}

/**
 * Subscribe to notifications in real-time
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const notificationsRef = collection(db, 'users', userId, 'notifications')
  const q = query(
    notificationsRef,
    orderBy('createdAt', 'desc'),
    limit(50)
  )

  return onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as Notification)
    })

    callback(notifications)
  })
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const notificationsRef = collection(db, 'users', userId, 'notifications')
  const q = query(notificationsRef, where('read', '==', false))
  const snapshot = await getDocs(q)

  return snapshot.size
}
