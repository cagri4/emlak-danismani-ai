import * as functions from 'firebase-functions/v2/https';
import OpenAI from 'openai';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

// Lazy initialization to avoid errors during deployment
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

interface TranscribeRequest {
  audioBase64: string;  // Base64-encoded audio data
  mimeType: string;     // 'audio/webm', 'audio/mp4', etc.
}

interface TranscribeResponse {
  success: boolean;
  transcript?: string;
  error?: string;
  language?: string;
  duration?: number;
}

export const transcribeVoice = functions.onCall(
  {
    region: 'europe-west1',
    memory: '512MiB',
    timeoutSeconds: 60,
  },
  async (request): Promise<TranscribeResponse> => {
    // Verify authentication
    if (!request.auth) {
      throw new functions.HttpsError('unauthenticated', 'User must be logged in');
    }

    const { audioBase64, mimeType } = request.data as TranscribeRequest;

    if (!audioBase64) {
      throw new functions.HttpsError('invalid-argument', 'Audio data required');
    }

    const tempFilePath = path.join(os.tmpdir(), `voice-${Date.now()}.webm`);

    try {
      // Decode base64 and write to temp file
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      fs.writeFileSync(tempFilePath, audioBuffer);

      // Call Whisper API
      const transcription = await getOpenAI().audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'tr',  // Turkish
        response_format: 'verbose_json',  // Get duration and language info
        temperature: 0.2,  // Lower = more conservative
      });

      return {
        success: true,
        transcript: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
      };
    } catch (error) {
      console.error('Transcription error:', error);
      return {
        success: false,
        error: (error as Error).message || 'Transcription failed',
      };
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }
);
