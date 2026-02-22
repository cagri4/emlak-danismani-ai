import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Property } from '@/types/property'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, MessageCircle, Home, Loader2 } from 'lucide-react'

export function PropertySharePage() {
  const { propertyId, userId } = useParams<{ propertyId: string; userId: string }>()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId || !userId) {
        setError('Geçersiz link')
        setIsLoading(false)
        return
      }

      try {
        // Fetch property from public-accessible path
        const propertyRef = doc(db, `users/${userId}/properties/${propertyId}`)
        const propertySnap = await getDoc(propertyRef)

        if (!propertySnap.exists()) {
          setError('İlan bulunamadı')
          setIsLoading(false)
          return
        }

        const propertyData = {
          id: propertySnap.id,
          ...propertySnap.data(),
        } as Property

        setProperty(propertyData)
      } catch (err) {
        console.error('Error fetching property:', err)
        setError('İlan yüklenirken hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperty()
  }, [propertyId, userId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">İlan yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive">{error || 'İlan bulunamadı'}</p>
        </div>
      </div>
    )
  }

  // Get cover photo or first photo
  const coverPhoto =
    property.photos?.find((p) => p.isCover) ||
    property.photos?.[0] ||
    null

  // Build OG image URL using Cloud Function for optimized share image
  // Falls back to direct cover photo URL if Cloud Function URL construction fails
  const ogImageUrl = userId && propertyId
    ? `https://europe-west1-emlak-ai-asist.cloudfunctions.net/generateShareImage?userId=${userId}&propertyId=${propertyId}`
    : coverPhoto?.url || ''

  // Format property details for OG description
  const ogDescription = [
    property.rooms,
    `${property.area}m²`,
    `${property.price.toLocaleString('tr-TR')} TL`,
  ]
    .filter(Boolean)
    .join(' • ')

  // WhatsApp contact link (placeholder - would need agent contact info)
  const handleContact = () => {
    const message = encodeURIComponent(`Merhaba, ${property.title} ilanı hakkında bilgi almak istiyorum.`)
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank')
  }

  return (
    <>
      <Helmet>
        <title>{property.title} - Emlak İlanı</title>
        <meta name="description" content={ogDescription} />

        {/* Open Graph tags for rich previews */}
        <meta property="og:title" content={property.title} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
        {ogImageUrl && <meta property="og:image:width" content="1200" />}
        {ogImageUrl && <meta property="og:image:height" content="630" />}

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={property.title} />
        <meta name="twitter:description" content={ogDescription} />
        {ogImageUrl && <meta name="twitter:image" content={ogImageUrl} />}
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="overflow-hidden shadow-lg">
            {/* Cover Photo */}
            {coverPhoto && (
              <div className="relative aspect-video w-full bg-muted">
                <img
                  src={coverPhoto.url}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  {property.listingType.charAt(0).toUpperCase() + property.listingType.slice(1)}
                </div>
              </div>
            )}

            <CardContent className="p-6 space-y-6">
              {/* Title and Price */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{property.title}</h1>
                <p className="text-3xl font-bold text-primary mt-2">
                  {property.price.toLocaleString('tr-TR')} TL
                </p>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Konum</p>
                  <p className="text-sm text-muted-foreground">
                    {property.location.neighborhood && `${property.location.neighborhood}, `}
                    {property.location.district}, {property.location.city}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="flex items-start gap-3">
                <Home className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Detaylar</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    {property.rooms && (
                      <div>
                        <span className="text-muted-foreground">Oda:</span>{' '}
                        <span className="font-medium">{property.rooms}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Alan:</span>{' '}
                      <span className="font-medium">{property.area} m²</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tip:</span>{' '}
                      <span className="font-medium">
                        {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                      </span>
                    </div>
                    {property.floor !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Kat:</span>{' '}
                        <span className="font-medium">
                          {property.floor}
                          {property.totalFloors && `/${property.totalFloors}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {(property.aiDescription || property.description) && (
                <div>
                  <p className="font-medium mb-2">Açıklama</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {property.aiDescription || property.description}
                  </p>
                </div>
              )}

              {/* Features */}
              {property.features.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Özellikler</p>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Button */}
              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                size="lg"
                onClick={handleContact}
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp ile İletişime Geç
              </Button>

              {/* Branding */}
              <div className="text-center pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Bu ilan Emlak Danışmanı AI ile oluşturulmuştur
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
