import { useNavigate } from 'react-router-dom'
import { useProperties } from '@/hooks/useProperties'
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PropertyGrid from '@/components/property/PropertyGrid'
import { Plus } from 'lucide-react'

export default function Properties() {
  const navigate = useNavigate()
  const { properties, loading, error } = useProperties()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Mülkler yükleniyor...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mülkler</h1>
            <p className="text-muted-foreground mt-1">
              Portföyünüzdeki {properties.length} mülkü yönetin
            </p>
          </div>
          <Button onClick={() => navigate('/properties/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Mülk Ekle
          </Button>
        </div>

        {/* Filters will be added in Task 2 */}

        <PropertyGrid properties={properties} />
      </div>
    </DashboardLayout>
  )
}
