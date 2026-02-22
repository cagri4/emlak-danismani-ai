import { useState, useRef, useEffect } from 'react'
import { Property } from '@/types/property'
import { shareToWhatsApp, copyShareLink } from '@/lib/share'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Share2, MessageCircle, Copy, Link } from 'lucide-react'
import { toast } from 'sonner'

interface ShareButtonProps {
  property: Property
}

export function ShareButton({ property }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleWhatsAppShare = async () => {
    setIsSharing(true)
    setIsOpen(false)
    try {
      await shareToWhatsApp(property)
    } catch (error) {
      console.error('Share failed:', error)
      toast.error('Paylaşım başarısız oldu')
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyLink = async () => {
    setIsOpen(false)
    try {
      await copyShareLink(property.userId, property.id)
      toast.success('Link kopyalandı', {
        description: 'Paylaşım linki panonuza kopyalandı',
      })
    } catch (error) {
      console.error('Copy failed:', error)
      toast.error('Link kopyalanamadı')
    }
  }

  const handleNativeShare = async () => {
    setIsOpen(false)
    try {
      await shareToWhatsApp(property)
    } catch (error) {
      // User cancelled or error - already handled in shareToWhatsApp
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="gap-2"
        disabled={isSharing}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Share2 className="h-4 w-4" />
        Paylaş
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-48 p-1 shadow-lg z-50">
          <button
            onClick={handleWhatsAppShare}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-secondary transition-colors text-left"
          >
            <MessageCircle className="h-4 w-4 text-green-600" />
            <span>WhatsApp'ta Paylaş</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-secondary transition-colors text-left"
          >
            <Copy className="h-4 w-4" />
            <span>Linki Kopyala</span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-secondary transition-colors text-left"
            >
              <Link className="h-4 w-4" />
              <span>Paylaş</span>
            </button>
          )}
        </Card>
      )}
    </div>
  )
}
