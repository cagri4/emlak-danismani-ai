import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
})

export const registerSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  name: z.string().min(2, 'Ad Soyad en az 2 karakter olmalıdır'),
  phone: z.string().optional(),
  company: z.string().optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: 'Kullanım koşullarını kabul etmelisiniz',
  }),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// Property validation schema
export const propertySchema = z.object({
  title: z.string().min(10, 'Başlık en az 10 karakter olmalı').max(100, 'Başlık en fazla 100 karakter olabilir'),
  type: z.enum(['daire', 'villa', 'arsa', 'işyeri', 'müstakil', 'rezidans'], {
    message: 'Geçerli bir mülk tipi seçiniz',
  }),
  listingType: z.enum(['satılık', 'kiralık'], {
    message: 'İlan tipi seçiniz',
  }),
  status: z.enum(['aktif', 'opsiyonlu', 'satıldı', 'kiralandı']).optional().default('aktif'),
  price: z.coerce.number({ message: 'Geçerli bir fiyat giriniz' }).positive('Fiyat pozitif olmalı'),
  location: z.object({
    city: z.string().min(1, 'Şehir zorunlu'),
    district: z.string().min(1, 'İlçe zorunlu'),
    neighborhood: z.string().optional(),
  }),
  area: z.coerce.number({ message: 'Geçerli bir alan giriniz' }).positive('Alan pozitif olmalı'),
  rooms: z.string().optional(),
  floor: z.coerce.number().int('Kat sayı olmalı').optional(),
  totalFloors: z.coerce.number().int('Toplam kat sayı olmalı').optional(),
  buildingAge: z.coerce.number().int('Bina yaşı sayı olmalı').min(0, 'Bina yaşı negatif olamaz').optional(),
  features: z.array(z.string()).default([]),
  description: z.string().optional(),
  imageUrl: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
})

export type PropertyFormData = z.infer<typeof propertySchema>

// Turkish cities (top 20 most populated)
export const turkishCities = [
  'İstanbul',
  'Ankara',
  'İzmir',
  'Bursa',
  'Antalya',
  'Adana',
  'Konya',
  'Gaziantep',
  'Şanlıurfa',
  'Kocaeli',
  'Mersin',
  'Diyarbakır',
  'Hatay',
  'Manisa',
  'Kayseri',
  'Samsun',
  'Balıkesir',
  'Kahramanmaraş',
  'Van',
  'Aydın',
  'Denizli',
  'Sakarya',
  'Tekirdağ',
  'Muğla',
] as const

// Common property features in Turkish
export const propertyFeatures = [
  'Asansör',
  'Otopark',
  'Güvenlik',
  'Havuz',
  'Spor Salonu',
  'Balkon',
  'Teras',
  'Eşyalı',
  'Klima',
  'Doğalgaz',
  'Jeneratör',
  'Çocuk Oyun Alanı',
  'Kapalı Otopark',
  'Açık Otopark',
  'Sauna',
  'Buhar Odası',
  'Görüntülü Diafon',
  'Alaturka Tuvalet',
  'Alafranga Tuvalet',
  'Duşakabin',
  'Amerikan Mutfak',
  'Ankastre Mutfak',
  'Gömme Dolap',
] as const

// Room options
export const roomOptions = [
  'stüdyo',
  '1+0',
  '1+1',
  '2+1',
  '3+1',
  '4+1',
  '5+1',
  '6+1',
  '7+1',
  '8+1',
  '9+1',
  '10+',
] as const
