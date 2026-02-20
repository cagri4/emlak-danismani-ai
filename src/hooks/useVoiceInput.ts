import { useState, useEffect, useRef } from 'react'

// Extend Window interface for webkit support
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface VoiceInputState {
  isListening: boolean
  transcript: string
  isSupported: boolean
  error: string | null
}

/**
 * Hook for Web Speech API voice input
 * Supports Turkish language (tr-TR) by default
 */
export function useVoiceInput(language = 'tr-TR') {
  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    transcript: '',
    isSupported: false,
    error: null,
  })

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check if browser supports Speech Recognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setState(prev => ({ ...prev, isSupported: false }))
      return
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setState(prev => ({
        ...prev,
        transcript,
        isListening: false,
        error: null,
      }))
    }

    recognition.onerror = (event: any) => {
      let errorMessage = 'Ses tanıma hatası'

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Ses algılanamadı. Lütfen tekrar deneyin.'
          break
        case 'audio-capture':
          errorMessage = 'Mikrofon kullanılamıyor.'
          break
        case 'not-allowed':
          errorMessage = 'Mikrofon izni reddedildi.'
          break
        case 'network':
          errorMessage = 'Ağ hatası oluştu.'
          break
      }

      setState(prev => ({
        ...prev,
        isListening: false,
        error: errorMessage,
      }))
    }

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }))
    }

    recognitionRef.current = recognition
    setState(prev => ({ ...prev, isSupported: true }))

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [language])

  const startListening = () => {
    if (!recognitionRef.current) return

    setState(prev => ({
      ...prev,
      error: null,
      transcript: '',
      isListening: true,
    }))

    try {
      recognitionRef.current.start()
    } catch (error) {
      setState(prev => ({
        ...prev,
        isListening: false,
        error: 'Ses tanıma başlatılamadı.',
      }))
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  return {
    isListening: state.isListening,
    transcript: state.transcript,
    isSupported: state.isSupported,
    error: state.error,
    startListening,
    stopListening,
  }
}
