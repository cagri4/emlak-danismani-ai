import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { useAuthActions } from '@/hooks/useAuth'
import { registerSchema, RegisterFormData } from '@/lib/validations'

export default function Register() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { signUpWithEmail } = useAuthActions()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    const result = await signUpWithEmail({
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone || '',
      company: data.company || '',
    })
    setIsLoading(false)

    if (result.success) {
      toast({
        title: 'Kayıt başarılı',
        description: 'Doğrulama e-postası gönderildi. Lütfen e-posta adresinizi kontrol edin.',
      })
      navigate('/verify-email')
    } else {
      toast({
        title: 'Kayıt başarısız',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  return (
    <AuthLayout
      title="Kayıt Ol"
      description="Yeni hesap oluşturun"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-posta *</Label>
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

        <div className="space-y-2">
          <Label htmlFor="password">Şifre *</Label>
          <Input
            id="password"
            type="password"
            placeholder="En az 6 karakter"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Ad Soyad *</Label>
          <Input
            id="name"
            type="text"
            placeholder="Ahmet Yılmaz"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="0532 123 45 67"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Şirket Adı</Label>
          <Input
            id="company"
            type="text"
            placeholder="ABC Gayrimenkul"
            {...register('company')}
          />
          {errors.company && (
            <p className="text-sm text-destructive">{errors.company.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="terms"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            {...register('terms')}
          />
          <Label htmlFor="terms" className="text-sm font-normal">
            <Link to="/terms" className="text-primary hover:underline">
              Kullanım koşullarını
            </Link>{' '}
            kabul ediyorum
          </Label>
        </div>
        {errors.terms && (
          <p className="text-sm text-destructive">{errors.terms.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Zaten hesabınız var mı?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Giriş yapın
        </Link>
      </p>
    </AuthLayout>
  )
}
