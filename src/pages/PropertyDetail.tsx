import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProperties } from '@/hooks/useProperties'
import { Property, PropertyStatus } from '@/types/property'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Edit, Trash2, MapPin, Home, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function PropertyDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { getProperty, deleteProperty, updateStatus } = useProperties({ useRealtime: false })
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) {
        setError('Mülk ID bulunamadı')
        setIsLoading(false)
        return
      }

      const result = await getProperty(id)

      if (result.success && result.property) {
        setProperty(result.property)
      } else {
        setError(result.error || 'Mülk yüklenemedi')
      }

      setIsLoading(false)
    }

    fetchProperty()
  }, [id])

  const handleStatusChange = async (newStatus: PropertyStatus) => {
    if (!id || !property) return

    const result = await updateStatus(id, newStatus)

    if (result.success) {
      setProperty({ ...property, status: newStatus })
      console.log('Durum güncellendi')
    } else {
      alert(result.error || 'Durum güncellenemedi')
    }
  }

  const handleDelete = async () => {
    if (!id) return

    setIsDeleting(true)

    const result = await deleteProperty(id)

    if (result.success) {
      console.log('Mülk silindi')
      navigate('/properties')
    } else {
      alert(result.error || 'Mülk silinemedi')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
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

  if (error || !property) {
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

  const statusColors: Record<PropertyStatus, string> = {
    aktif: 'bg-green-100 text-green-800',
    opsiyonlu: 'bg-yellow-100 text-yellow-800',
    satıldı: 'bg-red-100 text-red-800',
    kiralandı: 'bg-blue-100 text-blue-800',
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/properties')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{property.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColors[property.status]}`}>
                  {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {property.listingType.charAt(0).toUpperCase() + property.listingType.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/properties/${id}/edit`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Düzenle
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Sil
            </Button>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-semibold">Bu mülkü silmek istediğinizden emin misiniz?</p>
                <p className="text-sm">Bu işlem geri alınamaz.</p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick status change */}
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Durum Değişikliği</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select
                value={property.status}
                onChange={(e) => handleStatusChange(e.target.value as PropertyStatus)}
              >
                <option value="aktif">Aktif</option>
                <option value="opsiyonlu">Opsiyonlu</option>
                <option value="satıldı">Satıldı</option>
                <option value="kiralandı">Kiralandı</option>
              </Select>
              <p className="text-sm text-muted-foreground">
                İlan durumunu hızlıca değiştirin
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Property details */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mülk Tipi</p>
              <p className="text-sm">{property.type.charAt(0).toUpperCase() + property.type.slice(1)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fiyat</p>
              <p className="text-lg font-semibold">{property.price.toLocaleString('tr-TR')} TL</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Alan</p>
              <p className="text-sm">{property.area} m²</p>
            </div>
            {property.rooms && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Oda Sayısı</p>
                <p className="text-sm">{property.rooms}</p>
              </div>
            )}
            {property.floor !== undefined && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kat</p>
                <p className="text-sm">
                  {property.floor}
                  {property.totalFloors && ` / ${property.totalFloors}`}
                </p>
              </div>
            )}
            {property.buildingAge !== undefined && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bina Yaşı</p>
                <p className="text-sm">{property.buildingAge} yıl</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Konum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {property.location.neighborhood && `${property.location.neighborhood}, `}
              {property.location.district}, {property.location.city}
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        {property.features.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Özellikler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {property.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {property.description && (
          <Card>
            <CardHeader>
              <CardTitle>Açıklama</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{property.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>İlan Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Oluşturulma Tarihi</p>
              <p className="text-sm">
                {format(
                  property.createdAt instanceof Date
                    ? property.createdAt
                    : property.createdAt.toDate(),
                  'PPpp',
                  { locale: tr }
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Son Güncelleme</p>
              <p className="text-sm">
                {format(
                  property.updatedAt instanceof Date
                    ? property.updatedAt
                    : property.updatedAt.toDate(),
                  'PPpp',
                  { locale: tr }
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
