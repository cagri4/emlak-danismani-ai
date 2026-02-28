import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProperties } from '@/hooks/useProperties'
import { Property, PropertyStatus } from '@/types/property'
import { PropertyPhoto } from '@/types/photo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AIDescriptionGenerator from '@/components/property/AIDescriptionGenerator'
import { PhotoUploader } from '@/components/photos/PhotoUploader'
import { PhotoGrid } from '@/components/photos/PhotoGrid'
import { PhotoEditor } from '@/components/photos/PhotoEditor'
import { AdvancedPhotoEditor } from '@/components/photos/AdvancedPhotoEditor'
import { UploadProgressIndicator } from '@/components/photos/UploadProgressIndicator'
import { ValuationCard } from '@/components/property/ValuationCard'
import { ShareButton } from '@/components/properties/ShareButton'
import { usePhotoUpload } from '@/hooks/usePhotoUpload'
import { ArrowLeft, Edit, Trash2, MapPin, Home, AlertCircle, Pencil, Image } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { doc, updateDoc, arrayRemove } from 'firebase/firestore'
import { deleteObject, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function PropertyDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { getProperty, deleteProperty, updateStatus, updateProperty } = useProperties({ useRealtime: false })
  const { uploads, clearCompleted, isUploading } = usePhotoUpload(id || '')
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wasUploading, setWasUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<PropertyPhoto | null>(null)
  const [advancedEditingPhoto, setAdvancedEditingPhoto] = useState<PropertyPhoto | null>(null)

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

  // Watch for upload completion and refresh property
  useEffect(() => {
    // Track if we were uploading
    if (isUploading) {
      setWasUploading(true)
    }

    // When uploads finish (was uploading, now not), refresh property
    if (wasUploading && !isUploading && id) {
      const refreshProperty = async () => {
        console.log('Uploads complete, refreshing property data...')
        const result = await getProperty(id)
        if (result.success && result.property) {
          setProperty(result.property)
          console.log('Property refreshed with', result.property.photos?.length || 0, 'photos')
        }
      }
      refreshProperty()
      setWasUploading(false)
    }
  }, [isUploading, wasUploading, id, getProperty])

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

  const handleAIDescriptionSelect = async (description: string) => {
    if (!id || !property) return

    const result = await updateProperty(id, { aiDescription: description })

    if (result.success) {
      setProperty({ ...property, aiDescription: description })
    } else {
      throw new Error(result.error || 'AI açıklaması kaydedilemedi')
    }
  }

  const handleReorderPhotos = async (reorderedPhotos: PropertyPhoto[]) => {
    if (!id || !user) return

    try {
      const propertyRef = doc(db, `users/${user.uid}/properties`, id)
      await updateDoc(propertyRef, {
        photos: reorderedPhotos,
      })
      setProperty({ ...property!, photos: reorderedPhotos })
    } catch (err) {
      console.error('Error reordering photos:', err)
      alert('Fotoğraflar yeniden sıralanamadı')
    }
  }

  const handleSetCover = async (photoId: string) => {
    if (!id || !user || !property?.photos) {
      console.error('handleSetCover early return:', { id, user: !!user, photos: property?.photos?.length })
      return
    }

    try {
      console.log('Setting cover photo:', photoId, 'from', property.photos.length, 'photos')
      const updatedPhotos = property.photos.map((photo) => ({
        ...photo,
        isCover: photo.id === photoId,
      }))

      console.log('Updated photos isCover:', updatedPhotos.map(p => ({ id: p.id, isCover: p.isCover })))

      const propertyRef = doc(db, `users/${user.uid}/properties`, id)
      await updateDoc(propertyRef, {
        photos: updatedPhotos,
      })
      console.log('Firestore updated successfully')
      setProperty({ ...property, photos: updatedPhotos })
      toast.success('Kapak fotoğrafı değiştirildi')
    } catch (err) {
      console.error('Error setting cover photo:', err)
      toast.error('Kapak fotoğrafı ayarlanamadı')
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!id || !user || !property?.photos) return

    try {
      const photoToDelete = property.photos.find((p) => p.id === photoId)
      if (!photoToDelete) return

      // Delete from Firestore
      const propertyRef = doc(db, `users/${user.uid}/properties`, id)
      await updateDoc(propertyRef, {
        photos: arrayRemove(photoToDelete),
      })

      // Delete from Storage
      try {
        const photoRef = storageRef(storage, photoToDelete.url)
        await deleteObject(photoRef)

        if (photoToDelete.thumbnailUrl) {
          const thumbRef = storageRef(storage, photoToDelete.thumbnailUrl)
          await deleteObject(thumbRef)
        }
      } catch (storageErr) {
        console.error('Error deleting from storage:', storageErr)
      }

      setProperty({
        ...property,
        photos: property.photos.filter((p) => p.id !== photoId),
      })
    } catch (err) {
      console.error('Error deleting photo:', err)
      alert('Fotoğraf silinemedi')
    }
  }

  const handlePhotoEnhanced = async (photoIndex: number, newUrl: string) => {
    if (!id || !user || !property?.photos) return

    try {
      const updatedPhotos = property.photos.map((photo) =>
        photo.order === photoIndex ? { ...photo, url: newUrl } : photo
      )

      const propertyRef = doc(db, `users/${user.uid}/properties`, id)
      await updateDoc(propertyRef, {
        photos: updatedPhotos,
      })
      setProperty({ ...property, photos: updatedPhotos })
    } catch (err) {
      console.error('Error updating enhanced photo:', err)
      alert('Fotoğraf güncellenemedi')
    }
  }

  const handleUploadComplete = async () => {
    // Refresh property to get updated photos
    if (!id) return
    const result = await getProperty(id)
    if (result.success && result.property) {
      setProperty(result.property)
    }
  }

  const handleEditPhoto = (photo: PropertyPhoto) => {
    setEditingPhoto(photo)
  }

  const handleAdvancedEdit = (photo: PropertyPhoto) => {
    setAdvancedEditingPhoto(photo)
  }

  const handleSaveCroppedPhoto = async (croppedBlob: Blob) => {
    if (!id || !user || !editingPhoto || !property?.photos) return

    try {
      // Upload cropped blob to root-level properties path (matches upload path in usePhotoUpload.ts)
      const photoRef = storageRef(storage, `properties/${id}/${editingPhoto.id}.jpg`)
      await uploadBytes(photoRef, croppedBlob)

      // Get new download URL with cache-buster
      const newUrl = await getDownloadURL(photoRef)
      const cacheBustedUrl = `${newUrl}&t=${Date.now()}`

      // Update photo URL in Firestore
      const updatedPhotos = property.photos.map((photo) =>
        photo.id === editingPhoto.id
          ? { ...photo, url: cacheBustedUrl }
          : photo
      )

      const propertyRef = doc(db, `users/${user.uid}/properties`, id)
      await updateDoc(propertyRef, {
        photos: updatedPhotos,
      })

      setProperty({ ...property, photos: updatedPhotos })
      setEditingPhoto(null)

      // Show success message
      console.log('Fotoğraf başarıyla kırpıldı')
    } catch (err) {
      console.error('Error saving cropped photo:', err)
      throw new Error('Fotoğraf kaydedilemedi')
    }
  }

  const handleSaveAdvancedEdit = async (enhancedUrl: string) => {
    if (!id || !user || !advancedEditingPhoto || !property?.photos) return

    try {
      // Update photo URL in Firestore with enhanced version
      const updatedPhotos = property.photos.map((photo) =>
        photo.id === advancedEditingPhoto.id
          ? { ...photo, url: enhancedUrl }
          : photo
      )

      const propertyRef = doc(db, `users/${user.uid}/properties`, id)
      await updateDoc(propertyRef, {
        photos: updatedPhotos,
      })

      setProperty({ ...property, photos: updatedPhotos })
      setAdvancedEditingPhoto(null)
    } catch (err) {
      console.error('Error saving advanced edit:', err)
      alert('Fotoğraf kaydedilemedi')
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
            <ShareButton property={property} />
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

        {/* AI Description Section */}
        <div>
          {property.aiDescription ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>AI İlan Metni</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingDescription(!editingDescription)}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      {editingDescription ? 'İptal' : 'Düzenle'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingDescription ? (
                  <AIDescriptionGenerator
                    property={property}
                    onSelect={handleAIDescriptionSelect}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {property.aiDescription}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <AIDescriptionGenerator
              property={property}
              onSelect={handleAIDescriptionSelect}
            />
          )}
        </div>

        {/* AI Valuation Section */}
        {id && (
          <div className="space-y-6">
            <ValuationCard propertyId={id} />
          </div>
        )}

        {/* Photos Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Fotoğraflar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload area */}
            {id && <PhotoUploader propertyId={id} onUploadComplete={handleUploadComplete} />}

            {/* Upload progress (only when uploads active) */}
            {uploads.length > 0 && <UploadProgressIndicator uploads={uploads} onClearCompleted={clearCompleted} />}

            {/* Photo grid */}
            <PhotoGrid
              photos={property.photos || []}
              onReorder={handleReorderPhotos}
              onSetCover={handleSetCover}
              onDelete={handleDeletePhoto}
              onEdit={handleEditPhoto}
              onAdvancedEdit={handleAdvancedEdit}
              onPhotoEnhanced={handlePhotoEnhanced}
              propertyId={id}
              isEditable={true}
            />
          </CardContent>
        </Card>

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

      {/* Photo Editor Modal */}
      {editingPhoto && (
        <PhotoEditor
          isOpen={!!editingPhoto}
          onClose={() => setEditingPhoto(null)}
          imageUrl={editingPhoto.url}
          onSave={handleSaveCroppedPhoto}
        />
      )}

      {/* Advanced Photo Editor Modal */}
      {advancedEditingPhoto && (
        <AdvancedPhotoEditor
          isOpen={!!advancedEditingPhoto}
          onClose={() => setAdvancedEditingPhoto(null)}
          imageUrl={advancedEditingPhoto.url}
          propertyId={id!}
          photoIndex={advancedEditingPhoto.order}
          onSave={handleSaveAdvancedEdit}
        />
      )}
    </div>
  )
}
