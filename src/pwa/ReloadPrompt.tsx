import { useRegisterSW } from 'virtual:pwa-register/react'
import { X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registered:', r)
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  const handleUpdate = () => {
    updateServiceWorker(true)
  }

  if (!offlineReady && !needRefresh) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <RefreshCw className="h-5 w-5 text-sky-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {offlineReady ? 'Uygulama guncellendi' : 'Yeni versiyon mevcut'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {offlineReady
                ? 'Uygulama artik cevrimdisi calisabilir'
                : 'Yeni ozellikleri kullanmak icin sayfayi yenileyin'}
            </p>
          </div>
          <button
            onClick={close}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {needRefresh && (
          <div className="mt-3 flex gap-2">
            <Button onClick={handleUpdate} size="sm" className="flex-1">
              Yenile
            </Button>
            <Button onClick={close} variant="outline" size="sm" className="flex-1">
              Kapat
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
