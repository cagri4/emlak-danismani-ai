import { useNavigate } from 'react-router-dom'
import { useProperties } from '@/hooks/useProperties'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, MapPin, Home } from 'lucide-react'
import { PropertyStatus } from '@/types/property'

export default function Properties() {
  const navigate = useNavigate()
  const { properties, loading, error } = useProperties()

  const statusColors: Record<PropertyStatus, string> = {
    aktif: 'bg-green-100 text-green-800',
    opsiyonlu: 'bg-yellow-100 text-yellow-800',
    satıldı: 'bg-red-100 text-red-800',
    kiralandı: 'bg-blue-100 text-blue-800',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Mülkler yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mülklerim</h1>
            <p className="text-muted-foreground">
              Portföyünüzdeki {properties.length} mülkü yönetin
            </p>
          </div>
          <Button onClick={() => navigate('/properties/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Mülk Ekle
          </Button>
        </div>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Henüz mülk eklemediniz</h3>
              <p className="text-muted-foreground mb-4">
                Portföyünüze mülk ekleyerek başlayın
              </p>
              <Button onClick={() => navigate('/properties/new')}>
                İlk Mülkünüzü Ekleyin
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {properties.map((property) => (
              <Card
                key={property.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/properties/${property.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{property.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {property.location.district}, {property.location.city}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[property.status]}`}>
                      {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Fiyat</p>
                      <p className="font-semibold">{property.price.toLocaleString('tr-TR')} TL</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Alan</p>
                      <p className="font-semibold">{property.area} m²</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tip</p>
                      <p className="font-semibold">{property.type}</p>
                    </div>
                    {property.rooms && (
                      <div>
                        <p className="text-xs text-muted-foreground">Oda</p>
                        <p className="font-semibold">{property.rooms}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
