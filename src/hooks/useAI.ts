import { useState } from 'react'
import { generatePropertyDescription } from '@/lib/claude'
import { Property } from '@/types/property'

interface UseAIResult {
  variants: string[]
  generating: boolean
  error: string | null
  generate: (property: Property) => Promise<void>
}

// Simple in-memory cache
const descriptionCache = new Map<string, string[]>()

export function useAI(): UseAIResult {
  const [variants, setVariants] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async (property: Property) => {
    // Check cache first
    if (descriptionCache.has(property.id)) {
      setVariants(descriptionCache.get(property.id)!)
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const generatedVariants = await generatePropertyDescription(property)
      setVariants(generatedVariants)

      // Cache the results
      descriptionCache.set(property.id, generatedVariants)
    } catch (err: any) {
      console.error('Error generating AI descriptions:', err)
      setError(err?.message || 'Bilinmeyen bir hata oluştu')
      setVariants([])
    } finally {
      setGenerating(false)
    }
  }

  return {
    variants,
    generating,
    error,
    generate,
  }
}
