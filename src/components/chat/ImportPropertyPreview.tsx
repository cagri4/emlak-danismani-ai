interface ScrapedProperty {
  title: string
  price: number
  currency: string
  propertyType: string
  location: {
    city: string
    district?: string
    neighborhood?: string
    fullAddress?: string
  }
  area?: number
  rooms?: string
  features?: string[]
  description?: string
  photoUrls: string[]
  sourceUrl: string
  sourcePortal: string
  sourceId?: string
}

interface ImportPropertyPreviewProps {
  scraped: ScrapedProperty
  similar?: Array<{
    id: string
    title: string
    location: {
      city: string
      district: string
      neighborhood?: string
    }
  }>
}

export function ImportPropertyPreview({ scraped, similar }: ImportPropertyPreviewProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-white">
      {/* Preview header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{scraped.title}</h3>
          <p className="text-sm text-gray-600">
            {[scraped.location.neighborhood, scraped.location.district, scraped.location.city]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-primary">
            {new Intl.NumberFormat('tr-TR').format(scraped.price)} {scraped.currency}
          </div>
        </div>
      </div>

      {/* Property details */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        {scraped.area && (
          <div>
            <div className="text-gray-600">Alan</div>
            <div className="font-medium">{scraped.area} m²</div>
          </div>
        )}
        {scraped.rooms && (
          <div>
            <div className="text-gray-600">Oda Sayısı</div>
            <div className="font-medium">{scraped.rooms}</div>
          </div>
        )}
        <div>
          <div className="text-gray-600">Tip</div>
          <div className="font-medium capitalize">{scraped.propertyType}</div>
        </div>
      </div>

      {/* Photo preview */}
      {scraped.photoUrls && scraped.photoUrls.length > 0 && (
        <div>
          <div className="text-sm text-gray-600 mb-2">
            {scraped.photoUrls.length} fotoğraf
          </div>
          <div className="grid grid-cols-4 gap-2">
            {scraped.photoUrls.slice(0, 4).map((url, i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden">
                <img
                  src={url}
                  alt={'Fotoğraf ' + (i + 1)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          {scraped.photoUrls.length > 4 && (
            <p className="text-xs text-gray-500 mt-1">
              +{scraped.photoUrls.length - 4} fotoğraf daha
            </p>
          )}
        </div>
      )}

      {/* Description preview */}
      {scraped.description && (
        <div>
          <div className="text-sm text-gray-600 mb-1">Açıklama</div>
          <p className="text-sm line-clamp-3">{scraped.description}</p>
        </div>
      )}

      {/* Similar properties warning */}
      {similar && similar.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="text-yellow-600 mt-0.5">⚠️</div>
            <div className="flex-1">
              <div className="font-medium text-yellow-900">
                Benzer İlan Bulundu
              </div>
              <div className="text-sm text-yellow-800 mt-1">
                {similar.length} benzer ilan bulundu. Daha önce eklenmiş olabilir:
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {similar.slice(0, 3).map((prop) => (
                  <li key={prop.id} className="text-yellow-900">
                    • {prop.title} - {prop.location.district}, {prop.location.city}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Source info */}
      <div className="text-xs text-gray-500 pt-2 border-t">
        Kaynak: {scraped.sourcePortal}
        {scraped.sourceId && ' • ID: ' + scraped.sourceId}
      </div>
    </div>
  )
}
