import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { useFCMNotifications } from '@/hooks/useFCMNotifications'

const DISMISSAL_KEY = 'fcm-prompt-dismissed'
const DISMISSAL_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

/**
 * Prompts user to enable push notifications
 * Shows only if permission not yet requested/granted
 * Can be dismissed for 7 days
 */
export function NotificationPermissionPrompt() {
  const { hasPermission, requestPermission, isLoading } = useFCMNotifications()
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    // Don't show if permission already granted
    if (hasPermission) {
      setIsDismissed(true)
      return
    }

    // Don't show if permission already denied
    if (Notification.permission === 'denied') {
      setIsDismissed(true)
      return
    }

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISSAL_KEY)
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10)
      const now = Date.now()
      if (now - dismissedTime < DISMISSAL_DURATION) {
        setIsDismissed(true)
        return
      }
    }

    // Show prompt
    setIsDismissed(false)
  }, [hasPermission])

  const handleDismiss = () => {
    localStorage.setItem(DISMISSAL_KEY, Date.now().toString())
    setIsDismissed(true)
  }

  const handleEnable = async () => {
    await requestPermission()
    setIsDismissed(true)
  }

  if (isDismissed) return null

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-purple-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Anında Bildirimleri Açın
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Yeni eşleşmeler için anında bildirim alın. Fırsatları kaçırmayın!
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Açılıyor...' : 'Bildirimleri Aç'}
            </button>

            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
            >
              Daha Sonra
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
