import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PropertyFormData, propertySchema, turkishCities, propertyFeatures, roomOptions } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface PropertyFormProps {
  defaultValues?: Partial<PropertyFormData>
  onSubmit: (data: PropertyFormData) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
  mode?: 'create' | 'edit'
}

export function PropertyForm({ defaultValues, onSubmit, isLoading, mode = 'create' }: PropertyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      status: 'aktif',
      features: [],
      ...defaultValues,
    },
  })

  const selectedFeatures = watch('features') || []

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = selectedFeatures
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f) => f !== feature)
      : [...currentFeatures, feature]
    setValue('features', newFeatures)
  }

  const onFormSubmit = async (data: PropertyFormData) => {
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Temel Bilgiler */}
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">İlan Başlığı *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Örn: Merkezi Konumda Satılık Lüks Daire"
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Mülk Tipi *</Label>
              <Select id="type" {...register('type')}>
                <option value="">Seçiniz</option>
                <option value="daire">Daire</option>
                <option value="villa">Villa</option>
                <option value="arsa">Arsa</option>
                <option value="işyeri">İşyeri</option>
                <option value="müstakil">Müstakil Ev</option>
                <option value="rezidans">Rezidans</option>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
              )}
            </div>

            <div>
              <Label>İlan Tipi *</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="satılık"
                    {...register('listingType')}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Satılık</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="kiralık"
                    {...register('listingType')}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Kiralık</span>
                </label>
              </div>
              {errors.listingType && (
                <p className="text-sm text-destructive mt-1">{errors.listingType.message}</p>
              )}
            </div>
          </div>

          {mode === 'edit' && (
            <div>
              <Label htmlFor="status">Durum</Label>
              <Select id="status" {...register('status')}>
                <option value="aktif">Aktif</option>
                <option value="opsiyonlu">Opsiyonlu</option>
                <option value="satıldı">Satıldı</option>
                <option value="kiralandı">Kiralandı</option>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive mt-1">{errors.status.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Konum */}
      <Card>
        <CardHeader>
          <CardTitle>Konum Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Şehir *</Label>
              <Select id="city" {...register('location.city')}>
                <option value="">Seçiniz</option>
                {turkishCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Select>
              {errors.location?.city && (
                <p className="text-sm text-destructive mt-1">{errors.location.city.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="district">İlçe *</Label>
              <Input
                id="district"
                {...register('location.district')}
                placeholder="Örn: Kadıköy"
              />
              {errors.location?.district && (
                <p className="text-sm text-destructive mt-1">{errors.location.district.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="neighborhood">Mahalle</Label>
              <Input
                id="neighborhood"
                {...register('location.neighborhood')}
                placeholder="Örn: Caddebostan"
              />
              {errors.location?.neighborhood && (
                <p className="text-sm text-destructive mt-1">{errors.location.neighborhood.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detaylar */}
      <Card>
        <CardHeader>
          <CardTitle>Mülk Detayları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Fiyat (TL) *</Label>
              <Input
                id="price"
                type="number"
                {...register('price', { valueAsNumber: true })}
                placeholder="Örn: 3500000"
              />
              {errors.price && (
                <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="area">Alan (m²) *</Label>
              <Input
                id="area"
                type="number"
                {...register('area', { valueAsNumber: true })}
                placeholder="Örn: 120"
              />
              {errors.area && (
                <p className="text-sm text-destructive mt-1">{errors.area.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="rooms">Oda Sayısı</Label>
              <Select id="rooms" {...register('rooms')}>
                <option value="">Seçiniz</option>
                {roomOptions.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </Select>
              {errors.rooms && (
                <p className="text-sm text-destructive mt-1">{errors.rooms.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="floor">Bulunduğu Kat</Label>
              <Input
                id="floor"
                type="number"
                {...register('floor', { valueAsNumber: true })}
                placeholder="Örn: 3"
              />
              {errors.floor && (
                <p className="text-sm text-destructive mt-1">{errors.floor.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="totalFloors">Toplam Kat</Label>
              <Input
                id="totalFloors"
                type="number"
                {...register('totalFloors', { valueAsNumber: true })}
                placeholder="Örn: 8"
              />
              {errors.totalFloors && (
                <p className="text-sm text-destructive mt-1">{errors.totalFloors.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="buildingAge">Bina Yaşı</Label>
              <Input
                id="buildingAge"
                type="number"
                {...register('buildingAge', { valueAsNumber: true })}
                placeholder="Örn: 5"
              />
              {errors.buildingAge && (
                <p className="text-sm text-destructive mt-1">{errors.buildingAge.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Özellikler */}
      <Card>
        <CardHeader>
          <CardTitle>Özellikler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {propertyFeatures.map((feature) => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={`feature-${feature}`}
                  checked={selectedFeatures.includes(feature)}
                  onChange={() => handleFeatureToggle(feature)}
                />
                <label
                  htmlFor={`feature-${feature}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {feature}
                </label>
              </div>
            ))}
          </div>
          {errors.features && (
            <p className="text-sm text-destructive mt-2">{errors.features.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Açıklama */}
      <Card>
        <CardHeader>
          <CardTitle>Açıklama</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('description')}
            placeholder="Mülk hakkında detaylı açıklama yazın... (İsteğe bağlı - AI ile otomatik açıklama oluşturulacak)"
            rows={5}
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Not: Açıklama boş bırakılırsa, AI tarafından otomatik olarak oluşturulacaktır.
          </p>
        </CardContent>
      </Card>

      {/* Global errors */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Lütfen tüm zorunlu alanları doğru şekilde doldurun.
          </AlertDescription>
        </Alert>
      )}

      {/* Submit button */}
      <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
        {isLoading ? 'Kaydediliyor...' : mode === 'edit' ? 'Değişiklikleri Kaydet' : 'Mülk Ekle'}
      </Button>
    </form>
  )
}
