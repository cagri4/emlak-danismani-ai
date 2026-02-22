// Firebase Cloud Messaging Service Worker
// Handles background push notifications

// Import Firebase scripts (compat version required for service workers)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// Initialize Firebase with project config
// NOTE: These values must be hardcoded (service workers can't access import.meta.env)
// If Firebase project changes, update these values manually
firebase.initializeApp({
  apiKey: 'AIzaSyA8bWKXAV5nmt51nXKQmu3DQyYReUTWadM',
  authDomain: 'emlak-ai-asist.firebaseapp.com',
  projectId: 'emlak-ai-asist',
  storageBucket: 'emlak-ai-asist.firebasestorage.app',
  messagingSenderId: '677155195057',
  appId: '1:677155195057:web:f31cc96f3eb0f2933a7a90'
})

// Get messaging instance
const messaging = firebase.messaging()

// Handle background messages (when app is not in foreground)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload)

  const notificationTitle = payload.notification?.title || 'Emlak AI'
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni bildirim',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data,
    tag: payload.data?.type || 'default', // Group similar notifications
    requireInteraction: false,
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification)

  event.notification.close()

  // Determine URL to open based on notification data
  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open with this URL
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }

      // Check if there's any window open at all
      if (windowClients.length > 0) {
        const client = windowClients[0]
        if ('navigate' in client) {
          client.navigate(urlToOpen)
          return client.focus()
        }
      }

      // No windows open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
