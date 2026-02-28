import { useState, useRef, useCallback } from 'react';
import { transcribeVoiceCommand } from '../services/voiceCommands';

interface UseVoiceCommandReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  recordingDuration: number;
  error: string | null;
  transcript: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  clearTranscript: () => void;
}

const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
  '',  // empty string = browser default
];

export function useVoiceCommand(): UseVoiceCommandReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('');

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      const mimeType = MIME_TYPES.find(type =>
        type === '' || MediaRecorder.isTypeSupported(type)
      ) ?? '';
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);  // Collect in 100ms chunks
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Start timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingDuration(seconds);

        // Auto-stop after 60 seconds (Whisper limit)
        if (seconds >= 60) {
          stopRecording();
        }
      }, 1000);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setError('Mikrofon izni reddedildi. Tarayıcı ayarlarından izin verin.');
      } else if (err?.name === 'NotFoundError') {
        setError('Mikrofon bulunamadı. Cihazınızda mikrofon var mı kontrol edin.');
      } else if (err?.name === 'NotSupportedError') {
        setError('Tarayıcınız ses kaydını desteklemiyor.');
      } else {
        setError('Ses kaydı başlatılamadı. Tekrar deneyin.');
      }
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop recording
    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);

        // Stop all tracks
        streamRef.current?.getTracks().forEach((track) => track.stop());

        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeTypeRef.current || 'audio/webm' });
          const result = await transcribeVoiceCommand(audioBlob);

          if (result.success && result.transcript) {
            setTranscript(result.transcript);
          } else {
            setError(result.error || 'Ses tanıma başarısız');
          }
        } catch (err) {
          setError('Ses tanıma hatası');
        } finally {
          setIsTranscribing(false);
          resolve();
        }
      };

      mediaRecorder.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
    setRecordingDuration(0);
    chunksRef.current = [];
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript(null);
    setError(null);
    setRecordingDuration(0);
  }, []);

  return {
    isRecording,
    isTranscribing,
    recordingDuration,
    error,
    transcript,
    startRecording,
    stopRecording,
    cancelRecording,
    clearTranscript,
  };
}
