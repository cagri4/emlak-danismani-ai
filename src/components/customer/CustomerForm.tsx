import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { customerSchema, turkishCities, roomOptions, CustomerFormData as ZodCustomerFormData } from '@/lib/validations'
import { CustomerFormData } from '@/types/customer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'

interface CustomerFormProps {
  defaultValues?: Partial<ZodCustomerFormData>
  onSubmit: (data: CustomerFormData) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
  mode?: 'create' | 'edit'
}

const propertyTypes = ['daire', 'villa', 'arsa', 'işyeri', 'müstakil', 'rezidans']

export function CustomerForm({ defaultValues, onSubmit, isLoading, mode = 'create' }: CustomerFormProps) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>(defaultValues?.preferences?.location || [])
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(defaultValues?.preferences?.propertyType || [])
  const [selectedRooms, setSelectedRooms] = useState<string[]>(defaultValues?.preferences?.rooms || [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      preferences: {
        location: [],
        budget: {
          min: 0,
          max: 0,
        },
        propertyType: [],
        rooms: [],
        urgency: 'medium',
        notes: '',
        ...defaultValues?.preferences,
      },
      ...defaultValues,
    },
  })

  // Sync multi-select states with form values
  const handleLocationToggle = (city: string) => {
    const newLocations = selectedLocations.includes(city)
      ? selectedLocations.filter((l) => l !== city)
      : [...selectedLocations, city]
    setSelectedLocations(newLocations)
    setValue('preferences.location', newLocations)
  }

  const handlePropertyTypeToggle = (type: string) => {
    const newTypes = selectedPropertyTypes.includes(type)
      ? selectedPropertyTypes.filter((t) => t !== type)
      : [...selectedPropertyTypes, type]
    setSelectedPropertyTypes(newTypes)
    setValue('preferences.propertyType', newTypes)
  }

  const handleRoomToggle = (room: string) => {
    const newRooms = selectedRooms.includes(room)
      ? selectedRooms.filter((r) => r !== room)
      : [...selectedRooms, room]
    setSelectedRooms(newRooms)
    setValue('preferences.rooms', newRooms)
  }

  const onFormSubmit = async (data: any) => {
    await onSubmit(data as CustomerFormData)
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
            <Label htmlFor="name">Ad Soyad *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Müşteri adı ve soyadı"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="05XX XXX XX XX"
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="ornek@email.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tercihler */}
      <Card>
        <CardHeader>
          <CardTitle>Müşteri Tercihleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Budget */}
          <div>
            <Label>Bütçe (TL) *</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Input
                  type="number"
                  {...register('preferences.budget.min', { valueAsNumber: true })}
                  placeholder="Minimum"
                />
                {errors.preferences?.budget?.min && (
                  <p className="text-sm text-destructive mt-1">{errors.preferences.budget.min.message}</p>
                )}
              </div>
              <div>
                <Input
                  type="number"
                  {...register('preferences.budget.max', { valueAsNumber: true })}
                  placeholder="Maksimum"
                />
                {errors.preferences?.budget?.max && (
                  <p className="text-sm text-destructive mt-1">{errors.preferences.budget.max.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Multi-Select */}
          <div>
            <Label>İlgilendiği Konumlar</Label>
            <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
              {turkishCities.map((city) => (
                <label key={city} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(city)}
                    onChange={() => handleLocationToggle(city)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{city}</span>
                </label>
              ))}
            </div>
            {selectedLocations.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Seçili: {selectedLocations.join(', ')}
              </p>
            )}
          </div>

          {/* Property Type Multi-Select */}
          <div>
            <Label>Mülk Tipi</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {propertyTypes.map((type) => (
                <label key={type} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPropertyTypes.includes(type)}
                    onChange={() => handlePropertyTypeToggle(type)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rooms Multi-Select */}
          <div>
            <Label>Oda Sayısı</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {roomOptions.map((room) => (
                <label key={room} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRooms.includes(room)}
                    onChange={() => handleRoomToggle(room)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{room}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Area Range */}
          <div>
            <Label>Alan Aralığı (m²)</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Input
                type="number"
                {...register('preferences.minArea', { valueAsNumber: true })}
                placeholder="Minimum alan"
              />
              <Input
                type="number"
                {...register('preferences.maxArea', { valueAsNumber: true })}
                placeholder="Maksimum alan"
              />
            </div>
            {errors.preferences?.minArea && (
              <p className="text-sm text-destructive mt-1">{errors.preferences.minArea.message}</p>
            )}
            {errors.preferences?.maxArea && (
              <p className="text-sm text-destructive mt-1">{errors.preferences.maxArea.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Aciliyet */}
      <Card>
        <CardHeader>
          <CardTitle>Aciliyet Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="low"
                {...register('preferences.urgency')}
                className="h-4 w-4"
              />
              <span className="text-sm">Düşük</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="medium"
                {...register('preferences.urgency')}
                className="h-4 w-4"
              />
              <span className="text-sm">Orta</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="high"
                {...register('preferences.urgency')}
                className="h-4 w-4"
              />
              <span className="text-sm">Yüksek</span>
            </label>
          </div>
          {errors.preferences?.urgency && (
            <p className="text-sm text-destructive mt-1">{errors.preferences.urgency.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Notlar */}
      <Card>
        <CardHeader>
          <CardTitle>Tercih Notları</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('preferences.notes')}
            placeholder="Müşterinin özel talepleri, tercihleri veya notları..."
            rows={4}
          />
          {errors.preferences?.notes && (
            <p className="text-sm text-destructive mt-1">{errors.preferences.notes.message}</p>
          )}
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
        {isLoading ? 'Kaydediliyor...' : mode === 'edit' ? 'Değişiklikleri Kaydet' : 'Müşteri Ekle'}
      </Button>
    </form>
  )
}
