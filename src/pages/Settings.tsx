import { useAuth } from '@/contexts/AuthContext'
import { useKVKKConsent } from '@/hooks/useKVKKConsent'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function Settings() {
  const { user, userProfile } = useAuth()
  const { consentData } = useKVKKConsent()

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
                    {format(new Date(consentData.acceptedAt), 'PPpp', { locale: tr })}
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
