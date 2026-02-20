import { useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useVoiceInput } from '@/hooks/useVoiceInput'

interface VoiceButtonProps {
  onTranscript: (text: string) => void
}

/**
 * Voice input button using Web Speech API
 * Shows pulsing animation while listening
 * Only renders if browser supports speech recognition
 */
export function VoiceButton({ onTranscript }: VoiceButtonProps) {
  const { isListening, transcript, isSupported, error, startListening, stopListening } =
    useVoiceInput('tr-TR')

  // Pass transcript to parent when ready
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript)
    }
  }, [transcript, onTranscript])

  // Show error if any
  useEffect(() => {
    if (error) {
      console.error('Voice input error:', error)
      // Could show a toast notification here
    }
  }, [error])

  // Don't render if not supported
  if (!isSupported) {
    return null
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={isListening ? stopListening : startListening}
      className={isListening ? 'text-red-500 animate-pulse' : ''}
      title={isListening ? 'Dinleniyor...' : 'Sesli komut'}
      aria-label={isListening ? 'Dinlemeyi durdur' : 'Sesli komut başlat'}
    >
      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </Button>
  )
}
