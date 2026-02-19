import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthActions } from '@/hooks/useAuth'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const { resendVerificationEmail } = useAuthActions()
  const [isResending, setIsResending] = useState(false)
  const [lastSentTime, setLastSentTime] = useState<number | null>(null)
  const [canResend, setCanResend] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Check verification status every 3 seconds
    const interval = setInterval(async () => {
      await user.reload()
      if (user.emailVerified) {
        toast({
          title: 'E-posta doğrulandı',
          description: 'E-posta adresiniz başarıyla doğrulandı.',
        })
        navigate('/dashboard')
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [user, navigate, toast])

  useEffect(() => {
    // Resend cooldown timer (60 seconds)
    if (lastSentTime) {
      setCanResend(false)
      const timer = setTimeout(() => {
        setCanResend(true)
      }, 60000)
      return () => clearTimeout(timer)
    }
  }, [lastSentTime])

  const handleResendEmail = async () => {
    setIsResending(true)
    const result = await resendVerificationEmail()
    setIsResending(false)

    if (result.success) {
      setLastSentTime(Date.now())
      toast({
        title: 'E-posta gönderildi',
        description: 'Doğrulama e-postası tekrar gönderildi.',
      })
    } else {
      toast({
        title: 'Hata',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  return (
    <AuthLayout
      title="E-posta Adresinizi Doğrulayın"
      description="Hesabınızı etkinleştirmek için e-posta adresinizi doğrulamanız gerekiyor"
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-medium">Doğrulama e-postası gönderildi</p>
          <p className="mt-1">
            <strong>{user?.email}</strong> adresine bir doğrulama e-postası gönderdik.
            Lütfen e-posta kutunuzu kontrol edin ve doğrulama bağlantısına tıklayın.
          </p>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>E-posta gelmediyse:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Spam/Gereksiz klasörünüzü kontrol edin</li>
            <li>E-posta adresinizin doğru olduğundan emin olun</li>
            <li>Birkaç dakika bekleyin ve tekrar kontrol edin</li>
          </ul>
        </div>

        <Button
          onClick={handleResendEmail}
          variant="outline"
          className="w-full"
          disabled={isResending || !canResend}
        >
          {isResending
            ? 'Gönderiliyor...'
            : canResend
            ? 'Doğrulama E-postası Tekrar Gönder'
            : 'Lütfen 60 saniye bekleyin'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Bu sayfa otomatik olarak e-posta doğrulandığında yönlendirilecektir
        </p>
      </div>
    </AuthLayout>
  )
}
