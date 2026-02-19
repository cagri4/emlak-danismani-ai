import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKVKKConsent } from '@/hooks/useKVKKConsent'
import { useAuthActions } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, LogOut } from 'lucide-react'

export default function KVKKConsent() {
  const navigate = useNavigate()
  const { saveConsent } = useKVKKConsent()
  const { signOut } = useAuthActions()
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = contentRef.current
      // Consider "bottom" when user is within 10px of the actual bottom
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10

      if (isAtBottom && !hasScrolledToBottom) {
        setHasScrolledToBottom(true)
      }
    }

    const content = contentRef.current
    if (content) {
      content.addEventListener('scroll', handleScroll)
      return () => content.removeEventListener('scroll', handleScroll)
    }
  }, [hasScrolledToBottom])

  const handleAccept = async () => {
    setIsSubmitting(true)
    setError('')

    const result = await saveConsent()

    if (!result.success) {
      setError(result.error || 'KVKK onayı kaydedilemedi')
      setIsSubmitting(false)
    }
    // If success, saveConsent handles redirect with page reload
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">KVKK Aydınlatma Metni ve Onay</CardTitle>
          <CardDescription>
            Sistemimizi kullanabilmek için lütfen KVKK aydınlatma metnini okuyun ve onaylayın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Scrollable content area */}
          <div
            ref={contentRef}
            className="h-96 overflow-y-auto border rounded-lg p-6 bg-card space-y-4 text-sm"
          >
            <h3 className="font-semibold text-base">6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında Aydınlatma Metni</h3>

            <section>
              <h4 className="font-semibold">1. Veri Sorumlusunun Kimliği</h4>
              <p className="text-muted-foreground">
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz; veri sorumlusu olarak Emlak Danışmanı AI platformu ("Şirket") tarafından aşağıda açıklanan kapsamda işlenebilecektir.
              </p>
            </section>

            <section>
              <h4 className="font-semibold">2. Kişisel Verilerin İşlenme Amacı</h4>
              <p className="text-muted-foreground">
                Toplanan kişisel verileriniz, aşağıdaki amaçlarla KVKK'nın 5. ve 6. maddelerinde belirtilen kişisel veri işleme şartları dahilinde işlenebilecektir:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Kullanıcı hesabınızın oluşturulması ve yönetilmesi</li>
                <li>Platform üzerinden sunulan hizmetlerden faydalanmanızın sağlanması</li>
                <li>Emlak ilanlarınızın yönetilmesi ve potansiyel alıcılar ile eşleştirilmesi</li>
                <li>Yapay zeka destekli ilan açıklamalarının oluşturulması</li>
                <li>Müşteri ilişkileri yönetimi ve iletişim faaliyetlerinin yürütülmesi</li>
                <li>Hukuki yükümlülüklerin yerine getirilmesi</li>
                <li>Platform güvenliğinin sağlanması ve dolandırıcılığın önlenmesi</li>
                <li>Hizmet kalitesinin artırılması ve kullanıcı deneyiminin iyileştirilmesi</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold">3. Toplanan Kişisel Veriler</h4>
              <p className="text-muted-foreground">
                Platformumuz üzerinden toplanan kişisel verileriniz şunlardır:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Kimlik Bilgileri: Ad, soyad</li>
                <li>İletişim Bilgileri: E-posta adresi, telefon numarası</li>
                <li>Müşteri İşlem Bilgileri: Oluşturduğunuz emlak ilanları, müşteri kayıtları</li>
                <li>İşlem Güvenliği Bilgileri: IP adresi, çerez kayıtları, kullanıcı işlem geçmişi</li>
                <li>Mesleki Bilgiler: Şirket bilgisi, emlak danışmanı unvanı</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold">4. Kişisel Verilerin Aktarılması</h4>
              <p className="text-muted-foreground">
                Toplanan kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda;
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>İş ortaklarımıza (Firebase, Google Cloud Platform, Claude AI)</li>
                <li>Hukuki yükümlülüklerimizi yerine getirmek amacıyla kamu kurum ve kuruluşlarına</li>
                <li>Hizmet sağlayıcılarımıza</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                KVKK'nın 8. ve 9. maddelerinde belirtilen kişisel veri işleme şartları ve amaçları çerçevesinde aktarılabilecektir.
              </p>
            </section>

            <section>
              <h4 className="font-semibold">5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h4>
              <p className="text-muted-foreground">
                Kişisel verileriniz, web platformumuz üzerinden elektronik ortamda toplanmaktadır. Toplama işlemi, sözleşmenin kurulması ve ifası, hukuki yükümlülüğün yerine getirilmesi ve meşru menfaatlerimiz hukuki sebeplerine dayanmaktadır.
              </p>
            </section>

            <section>
              <h4 className="font-semibold">6. Kişisel Veri Sahibinin KVKK'nın 11. Maddesinde Sayılan Hakları</h4>
              <p className="text-muted-foreground">
                Kişisel veri sahibi olarak KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
                <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
                <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
                <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
                <li>Düzeltme, silme ve yok edilme işlemlerinin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
                <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                <li>Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold">7. Başvuru Yöntemi</h4>
              <p className="text-muted-foreground">
                Yukarıda belirtilen haklarınızı kullanmak için kimliğinizi tespit edici gerekli bilgiler ile KVKK'nın 11. maddesinde belirtilen haklardan kullanmayı talep ettiğiniz hakkınıza yönelik açıklamalarınızı içeren talebinizi; platformdaki ayarlar sayfasından veya info@emlakdanismani.ai e-posta adresine iletebilirsiniz.
              </p>
            </section>

            <section>
              <h4 className="font-semibold">8. Veri Saklama Süresi</h4>
              <p className="text-muted-foreground">
                Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve ilgili mevzuatta öngörülen saklama süreleri boyunca saklanacaktır. Saklama süresinin sona ermesi durumunda kişisel verileriniz KVKK'ya uygun şekilde silinecek, yok edilecek veya anonim hale getirilecektir.
              </p>
            </section>

            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Önemli:</strong> Bu metni sonuna kadar okuyup kabul etmediğiniz takdirde sistemimizi kullanamazsınız. KVKK onayı, platformumuzu kullanmanız için zorunludur.
              </AlertDescription>
            </Alert>
          </div>

          {/* Scroll indicator */}
          {!hasScrolledToBottom && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              ⬇️ Onay butonunu aktifleştirmek için metni sonuna kadar kaydırın
            </p>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleAccept}
            disabled={!hasScrolledToBottom || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? 'Kaydediliyor...' : 'Okudum, Kabul Ediyorum'}
          </Button>

          <div className="text-center w-full space-y-2">
            <p className="text-sm text-muted-foreground">
              KVKK onayı zorunludur. Kabul etmezseniz sistemi kullanamazsınız.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Çıkış Yap
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
