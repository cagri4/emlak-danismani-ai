import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

/**
 * Offline notification banner
 *
 * Shows at top of screen when user loses connection. Disappears when back online.
 * Turkish message explains that changes will sync when connection is restored.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  // Only show when offline
  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 text-center py-2 z-50 flex items-center justify-center gap-2">
      <WifiOff className="w-5 h-5" />
      <span>
        Cevrimdisi calisiyorsunuz. Degisiklikler baglanti kurulunca senkronize edilecek.
      </span>
    </div>
  )
}
