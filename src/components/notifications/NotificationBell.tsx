import { Bell } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

interface NotificationBellProps {
  onClick: () => void
}

/**
 * Notification bell icon with unread count badge
 * Shown in header for quick access to notifications
 */
export default function NotificationBell({ onClick }: NotificationBellProps) {
  const { unreadCount } = useNotifications()

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
      aria-label="Bildirimler"
    >
      <Bell className="h-5 w-5 text-gray-600" />

      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[18px]">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
