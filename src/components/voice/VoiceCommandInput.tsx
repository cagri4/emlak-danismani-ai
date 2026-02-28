import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { useEffect } from 'react';

interface VoiceCommandInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

/**
 * Voice command input with hold-to-speak interaction
 * Features:
 * - Pulsing recording indicator with timer
 * - Whisper API transcription (Turkish)
 * - Visual feedback for all states
 * - Error handling with retry
 */
export function VoiceCommandInput({ onTranscript, disabled = false }: VoiceCommandInputProps) {
  const {
    isRecording,
    isTranscribing,
    recordingDuration,
    error,
    transcript,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useVoiceCommand();

  // Pass transcript to parent when ready
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
      clearTranscript();
    }
  }, [transcript, onTranscript, clearTranscript]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = () => {
    if (!disabled && !isRecording && !isTranscribing) {
      startRecording();
    }
  };

  const handleMouseUp = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!disabled && !isRecording && !isTranscribing) {
      startRecording();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isRecording) {
      stopRecording();
    }
  };

  return (
    <div className="relative">
      {/* Timer overlay */}
      {isRecording && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-mono text-red-500 animate-pulse">
          {formatDuration(recordingDuration)}
        </div>
      )}

      {/* Recording button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || isTranscribing}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`
          relative transition-all
          ${isRecording ? 'text-red-500 bg-red-50' : ''}
          ${isTranscribing ? 'cursor-wait' : 'cursor-pointer'}
        `}
        title={
          isRecording
            ? 'Bırakarak gönder'
            : isTranscribing
            ? 'Tanınıyor...'
            : 'Basılı tutarak konuşun'
        }
        aria-label={isRecording ? 'Kaydı durdur' : 'Sesli komut başlat'}
      >
        {/* Recording state */}
        {isRecording && (
          <>
            <Square className="h-5 w-5 fill-current" />
            {/* Pulsing ring effect */}
            <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-75" />
          </>
        )}

        {/* Transcribing state */}
        {isTranscribing && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}

        {/* Idle state */}
        {!isRecording && !isTranscribing && <Mic className="h-5 w-5" />}
      </Button>

      {/* Error message */}
      {error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-xs text-red-500 whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
