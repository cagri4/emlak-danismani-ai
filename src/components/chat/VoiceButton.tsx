import { VoiceCommandInput } from '@/components/voice/VoiceCommandInput'

interface VoiceButtonProps {
  onTranscript: (text: string) => void
}

/**
 * Voice input button using OpenAI Whisper API
 * Replaces Web Speech API for better Turkish language support
 * Works across all browsers (Chrome, Firefox, Safari)
 */
export function VoiceButton({ onTranscript }: VoiceButtonProps) {
  // Check if MediaRecorder is supported
  if (typeof MediaRecorder === 'undefined') {
    console.warn('MediaRecorder not supported in this browser')
    return null
  }

  return <VoiceCommandInput onTranscript={onTranscript} />
}
