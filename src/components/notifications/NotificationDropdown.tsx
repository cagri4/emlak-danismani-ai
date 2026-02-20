import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { ExternalLink, X } from 'lucide-react'
import type { Notification } from '@/types/notification'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { useState } from 'react'

interface NotificationDropdownProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onClose: () => void
}

/**
 * Notification dropdown showing recent notifications
 * Includes actions: view details (open URL) and import property
 */
export default function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose
}: NotificationDropdownProps) {
  const [importingId, setImportingId] = useState<string | null>(null)

  const handleImport = async (notification: Notification) => {
    if (!notification.data?.listingUrl) return

    setImportingId(notification.id)

    try {
      // Call the import function
      const functions = getFunctions()
      const importFn = httpsCallable(functions, 'importPropertyFromUrl')

      await importFn({
        url: notification.data.listingUrl,
        userId: 'current' // Will be extracted from auth context in function
      })

      // Mark as read after successful import
      onMarkAsRead(notification.id)

      // Show success (in production, use toast)
      alert('İlan başarıyla içe aktarıldı!')
    } catch (error) {
      console.error('Import error:', error)
      alert('İlan içe aktarılırken hata oluştu')
    } finally {
      setImportingId(null)
    }
  }

  const handleViewDetails = (notification: Notification) => {
    if (notification.data?.listingUrl) {
      window.open(notification.data.listingUrl, '_blank')
      onMarkAsRead(notification.id)
    }
  }

  const getPortalBadgeColor = (portal?: string) => {
    switch (portal) {
      case 'sahibinden':
        return 'bg-blue-100 text-blue-800'
      case 'hepsiemlak':
        return 'bg-green-100 text-green-800'
      case 'emlakjet':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price?: number) => {
    if (!price) return ''
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M TL`
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K TL`
    }
    return `${price.toLocaleString('tr-TR')} TL`
  }

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-gray-900">Bildirimler</h3>
        <div className="flex items-center gap-2">
          {notifications.some(n => !n.read) && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-primary hover:text-primary-dark"
            >
              Tümünü okundu işaretle
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            Yeni bildirim yok
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="mt-2 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Portal badge */}
                    {notification.data?.portal && (
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-1 ${getPortalBadgeColor(
                          notification.data.portal
                        )}`}
                      >
                        {notification.data.portal}
                      </span>
                    )}

                    {/* Title */}
                    <h4 className="font-medium text-sm text-gray-900 mb-1">
                      {notification.title}
                    </h4>

                    {/* Details */}
                    {notification.data && (
                      <div className="text-xs text-gray-600 space-y-0.5">
                        {notification.data.location && (
                          <div>📍 {notification.data.location}</div>
                        )}
                        {notification.data.price && (
                          <div>💰 {formatPrice(notification.data.price)}</div>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(notification.createdAt, {
                        addSuffix: true,
                        locale: tr
                      })}
                    </div>

                    {/* Actions */}
                    {notification.type === 'competitor_listing' && notification.data?.listingUrl && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleViewDetails(notification)}
                          className="text-xs text-primary hover:text-primary-dark flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Detay
                        </button>
                        <button
                          onClick={() => handleImport(notification)}
                          disabled={importingId === notification.id}
                          className="text-xs text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          {importingId === notification.id ? 'İçe aktarılıyor...' : 'İçe Aktar'}
                        </button>
                        <button
                          onClick={() => onDelete(notification.id)}
                          className="text-xs text-gray-500 hover:text-red-600 ml-auto"
                        >
                          Sil
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
