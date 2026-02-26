import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useKVKKConsent } from '@/hooks/useKVKKConsent'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'
import { MessageCircle, Check, X, Loader2 } from 'lucide-react'

export default function Settings() {
  const { user, userProfile } = useAuth()
  const { consentData } = useKVKKConsent()
  const [telegramChatId, setTelegramChatId] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)

  const handleLinkTelegram = async () => {
    if (!user || !telegramChatId.trim()) return

    setIsLinking(true)
    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        telegramChatId: telegramChatId.trim()
      })
      toast.success('Telegram hesabınız başarıyla bağlandı!')
      setTelegramChatId('')
    } catch (error) {
      console.error('Telegram linking error:', error)
      toast.error('Bağlantı sırasında bir hata oluştu')
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlinkTelegram = async () => {
    if (!user) return

    setIsUnlinking(true)
    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        telegramChatId: null
      })
      toast.success('Telegram bağlantısı kaldırıldı')
    } catch (error) {
      console.error('Telegram unlinking error:', error)
      toast.error('Bağlantı kaldırılırken hata oluştu')
    } finally {
      setIsUnlinking(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
          <p className="text-muted-foreground">
            Hesap bilgilerinizi ve KVKK izinlerinizi yönetin
          </p>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Hesap Bilgileri</CardTitle>
            <CardDescription>Kullanıcı hesap bilgileriniz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">E-posta</p>
                <p className="text-sm">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ad Soyad</p>
                <p className="text-sm">{userProfile?.name || 'Belirtilmemiş'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                <p className="text-sm">{userProfile?.phone || 'Belirtilmemiş'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Şirket</p>
                <p className="text-sm">{userProfile?.company || 'Belirtilmemiş'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              Telegram Bağlantısı
            </CardTitle>
            <CardDescription>
              Telegram botunu kullanarak mülklerinizi yönetin ve bildirim alın
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(userProfile as any)?.telegramChatId ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Telegram hesabınız bağlı</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Chat ID: {(userProfile as any).telegramChatId}
                </p>
                <Button
                  variant="outline"
                  onClick={handleUnlinkTelegram}
                  disabled={isUnlinking}
                  className="text-red-600 hover:text-red-700"
                >
                  {isUnlinking ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Bağlantıyı Kaldır
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Nasıl Bağlanır?</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Telegram'da <a href="https://t.me/EmlakDanismaniBot" target="_blank" rel="noopener noreferrer" className="font-medium underline">@EmlakDanismaniBot</a>'u açın</li>
                    <li><code className="bg-blue-100 px-1 rounded">/start</code> yazın</li>
                    <li>Bot size Chat ID'nizi gösterecek</li>
                    <li>Bu ID'yi aşağıya girin</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Chat ID'nizi girin (örn: 123456789)"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    onClick={handleLinkTelegram}
                    disabled={!telegramChatId.trim() || isLinking}
                  >
                    {isLinking ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MessageCircle className="h-4 w-4 mr-2" />
                    )}
                    Bağla
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KVKK Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>KVKK İzinleri</CardTitle>
            <CardDescription>
              Kişisel verilerinizin işlenmesine ilişkin izin ve tercihleriniz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {consentData ? (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    KVKK Onay Tarihi
                  </p>
                  <p className="text-sm">
                    {consentData.acceptedAt && format(
                      typeof (consentData.acceptedAt as unknown as { toDate?: () => Date }).toDate === 'function'
                        ? (consentData.acceptedAt as unknown as { toDate: () => Date }).toDate()
                        : new Date(consentData.acceptedAt),
                      'PPpp',
                      { locale: tr }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Onay Versiyonu
                  </p>
                  <p className="text-sm">{consentData.version}</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    KVKK haklarınızı kullanmak veya izinlerinizi güncellemek için aşağıdaki
                    butonu kullanabilirsiniz. İlerleyen aşamalarda detaylı izin yönetimi eklenecektir.
                  </p>
                  <Button variant="outline" disabled>
                    İzinlerimi Güncelle (Yakında)
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                KVKK onayı bulunamadı. Lütfen giriş yapın ve onayınızı verin.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Future sections placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Diğer Ayarlar</CardTitle>
            <CardDescription>Gelecek güncellemelerde eklenecek</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bildirim tercihleri, entegrasyon ayarları ve diğer özelleştirme seçenekleri
              sonraki versiyonlarda eklenecektir.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
