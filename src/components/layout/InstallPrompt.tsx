import { useState, useEffect } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { X, Download, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export function InstallPrompt() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall()
  const [isDismissed, setIsDismissed] = useState(true)

  useEffect(() => {
    // Check if banner was dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10)
      const now = Date.now()
      if (now - dismissedTime < DISMISS_DURATION) {
        setIsDismissed(true)
        return
      }
    }
    setIsDismissed(false)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setIsDismissed(true)
  }

  const handleInstall = async () => {
    await promptInstall()
    handleDismiss()
  }

  // Don't show if already installed, dismissed, or not installable (and not iOS)
  if (isInstalled || isDismissed || (!isInstallable && !isIOS)) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-sky-500 text-white p-3 shadow-lg">
      <div className="container mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {isIOS ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Uygulamayi Ana Ekrana Ekle
            </p>
            {isIOS ? (
              <p className="text-xs text-sky-50 mt-0.5">
                Safari&apos;de Paylas butonu &gt; &quot;Ana Ekrana Ekle&quot;
              </p>
            ) : (
              <p className="text-xs text-sky-50 mt-0.5">
                Hizli erisim icin telefonunuza yukleyin
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isIOS && (
            <Button
              onClick={handleInstall}
              size="sm"
              variant="secondary"
              className="bg-white text-sky-600 hover:bg-sky-50"
            >
              Yukle
            </Button>
          )}
          <button
            onClick={handleDismiss}
            className="text-white hover:text-sky-100 transition-colors p-1"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
