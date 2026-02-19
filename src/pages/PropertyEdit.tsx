import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PropertyForm } from '@/components/property/PropertyForm'
import { useProperties } from '@/hooks/useProperties'
import { PropertyFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PropertyEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { getProperty, updateProperty } = useProperties({ useRealtime: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [propertyData, setPropertyData] = useState<PropertyFormData | null>(null)

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) {
        setError('Mülk ID bulunamadı')
        setIsLoading(false)
        return
      }

      const result = await getProperty(id)

      if (result.success && result.property) {
        const { id: _, createdAt, updatedAt, userId, ...formData } = result.property
        setPropertyData(formData)
      } else {
        setError(result.error || 'Mülk yüklenemedi')
      }

      setIsLoading(false)
    }

    fetchProperty()
  }, [id])

  const handleSubmit = async (data: PropertyFormData) => {
    if (!id) return { success: false, error: 'Mülk ID bulunamadı' }

    setIsSubmitting(true)

    const result = await updateProperty(id, data)

    if (result.success) {
      console.log('Mülk başarıyla güncellendi')
      navigate(`/properties/${id}`)
      return { success: true }
    } else {
      setIsSubmitting(false)
      return { success: false, error: result.error }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Mülk yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error || !propertyData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error || 'Mülk bulunamadı'}</p>
          <Button className="mt-4" onClick={() => navigate('/properties')}>
            Mülklere Dön
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/properties/${id}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mülk Düzenle</h1>
            <p className="text-muted-foreground">
              Mülk bilgilerini güncelleyin
            </p>
          </div>
        </div>

        <PropertyForm
          defaultValues={propertyData}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          mode="edit"
        />
      </div>
    </div>
  )
}
