import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { useAuthActions } from '@/hooks/useAuth'
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations'

export default function ForgotPassword() {
  const { toast } = useToast()
  const { sendPasswordReset } = useAuthActions()
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    const result = await sendPasswordReset(data.email)
    setIsLoading(false)

    if (result.success) {
      setEmailSent(true)
      toast({
        title: 'E-posta gönderildi',
        description: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
      })
    } else {
      toast({
        title: 'Hata',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  if (emailSent) {
    return (
      <AuthLayout
        title="E-posta Gönderildi"
        description="Şifre sıfırlama talimatları e-posta adresinize gönderildi"
      >
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            E-posta kutunuzu kontrol edin ve şifre sıfırlama bağlantısına tıklayın.
            E-posta birkaç dakika içinde gelmezse spam klasörünüzü kontrol edin.
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full">
              Giriş sayfasına dön
            </Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Şifremi Unuttum"
      description="E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            placeholder="ornek@email.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Bağlantısı Gönder'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline">
          Giriş sayfasına dön
        </Link>
      </p>
    </AuthLayout>
  )
}
