import { useState } from 'react'
import { useAI } from '@/hooks/useAI'
import { Property } from '@/types/property'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, Loader2, CheckCircle2, RotateCcw } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface AIDescriptionGeneratorProps {
  property: Property
  onSelect: (description: string) => Promise<void>
}

export default function AIDescriptionGenerator({
  property,
  onSelect,
}: AIDescriptionGeneratorProps) {
  const { variants, generating, error, generate } = useAI()
  const { toast } = useToast()
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const handleGenerate = () => {
    generate(property)
  }

  const handleSelectVariant = async (index: number, description: string) => {
    setSaving(true)
    try {
      await onSelect(description)
      setSelectedVariant(index)
      toast({
        title: 'Başarılı',
        description: 'İlan metni kaydedildi',
      })
    } catch (err: any) {
      toast({
        title: 'Hata',
        description: err?.message || 'İlan metni kaydedilirken hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!variants.length && !generating && !error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI İlan Metni Oluşturucu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Yapay zeka ile mülkünüz için profesyonel ilan metni oluşturun
            </p>
            <Button onClick={handleGenerate} className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI ile İlan Metni Oluştur
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI İlan Metni Oluşturucu
          </CardTitle>
          {variants.length > 0 && !generating && (
            <Button variant="outline" size="sm" onClick={handleGenerate} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Yeniden Oluştur
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading State */}
        {generating && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">İlan metinleri oluşturuluyor...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Bu işlem 5-10 saniye sürebilir
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Variants */}
        {variants.length > 0 && !generating && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Aşağıdaki varyantlardan birini seçin veya yeniden oluşturun
            </p>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
              {variants.map((variant, index) => (
                <Card
                  key={index}
                  className={`transition-all ${
                    selectedVariant === index
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>Varyant {index + 1}</span>
                      {selectedVariant === index && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {variant}
                    </p>
                    <Button
                      onClick={() => handleSelectVariant(index, variant)}
                      disabled={saving || selectedVariant === index}
                      className="w-full"
                      size="sm"
                    >
                      {selectedVariant === index ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Seçildi
                        </>
                      ) : (
                        'Bu Metni Kullan'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
