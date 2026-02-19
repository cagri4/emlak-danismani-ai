import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PropertyForm } from '@/components/property/PropertyForm'
import { useProperties } from '@/hooks/useProperties'
import { PropertyFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PropertyAdd() {
  const navigate = useNavigate()
  const { addProperty } = useProperties({ useRealtime: false })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true)

    const result = await addProperty(data)

    if (result.success) {
      // Show success message (in future, add toast notification)
      console.log('Mülk başarıyla eklendi')
      navigate('/properties')
      return { success: true }
    } else {
      setIsSubmitting(false)
      return { success: false, error: result.error }
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yeni Mülk Ekle</h1>
            <p className="text-muted-foreground">
              Portföyünüze yeni mülk ekleyin
            </p>
          </div>
        </div>

        <PropertyForm onSubmit={handleSubmit} isLoading={isSubmitting} mode="create" />
      </div>
    </div>
  )
}
