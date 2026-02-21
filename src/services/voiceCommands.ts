import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase';

const functions = getFunctions(app, 'europe-west1');

interface TranscribeResult {
  success: boolean;
  transcript?: string;
  error?: string;
  duration?: number;
}

export async function transcribeVoiceCommand(audioBlob: Blob): Promise<TranscribeResult> {
  // Convert blob to base64
  const arrayBuffer = await audioBlob.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  );

  const transcribeVoice = httpsCallable<
    { audioBase64: string; mimeType: string },
    TranscribeResult
  >(functions, 'transcribeVoice');

  const result = await transcribeVoice({
    audioBase64: base64,
    mimeType: audioBlob.type,
  });

  return result.data;
}
