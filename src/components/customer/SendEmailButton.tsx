import { useState, useRef, useEffect } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useProperties } from '@/hooks/useProperties'
import { Property } from '@/types/property'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mail, Loader2, AlertCircle, X } from 'lucide-react'
import { toast } from 'sonner'

interface SendEmailButtonProps {
  customerId: string
  customerEmail?: string
  customerName: string
}

export function SendEmailButton({ customerId, customerEmail, customerName }: SendEmailButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const { properties, loading } = useProperties({ useRealtime: false })

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
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

  const handleSendEmail = async () => {
    if (!selectedPropertyId) {
      toast.error('Lütfen bir mülk seçin')
      return
    }

    setSending(true)

    try {
      const sendPropertyEmail = httpsCallable(functions, 'sendPropertyEmail')
      await sendPropertyEmail({
        customerId,
        propertyId: selectedPropertyId,
      })

      toast.success('E-posta gönderildi', {
        description: `${customerName} adresine mülk bilgisi gönderildi`,
      })

      setIsOpen(false)
      setSelectedPropertyId(null)
    } catch (error: any) {
      console.error('Email send failed:', error)
      toast.error('E-posta gönderilemedi', {
        description: error.message || 'Bir hata oluştu',
      })
    } finally {
      setSending(false)
    }
  }

  if (!customerEmail) {
    return (
      <Button
        variant="outline"
        className="gap-2"
        disabled
        title="Müşterinin e-posta adresi yok"
      >
        <AlertCircle className="h-4 w-4" />
        E-posta Gönder
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Mail className="h-4 w-4" />
        E-posta Gönder
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card ref={modalRef} className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Mülk E-postası Gönder</h2>
                <p className="text-sm text-muted-foreground">
                  {customerName} ({customerEmail})
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Property Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Göndermek istediğiniz mülkü seçin:</label>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Henüz mülk eklenmemiş</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {properties.map((property: Property) => (
                    <button
                      key={property.id}
                      onClick={() => setSelectedPropertyId(property.id)}
                      className={`w-full p-4 border rounded-lg text-left transition-colors ${
                        selectedPropertyId === property.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Property Image */}
                        {property.photos && property.photos.length > 0 ? (
                          <img
                            src={property.photos[0].url}
                            alt={property.title}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                            <Mail className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}

                        {/* Property Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{property.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {property.location.city}, {property.location.district}
                          </p>
                          <p className="text-sm font-medium text-primary mt-1">
                            {property.price.toLocaleString('tr-TR')} TL
                          </p>
                        </div>

                        {/* Selection Indicator */}
                        {selectedPropertyId === property.id && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={sending}
              >
                İptal
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={sending || !selectedPropertyId}
                className="gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Gönder
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
