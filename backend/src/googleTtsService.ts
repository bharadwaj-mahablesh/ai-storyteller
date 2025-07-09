import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Set up Google Cloud credentials
// This assumes GOOGLE_APPLICATION_CREDENTIALS environment variable is set
// or that the credentials file is in a known location.
// For this project, it's likely in gcp-credentials/
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, '../../gcp-credentials/ai-storyteller-project-e4b0943567c1.json');

const client = new TextToSpeechClient();

export async function generateAudioFromText(text: string): Promise<string> {
  const request = {
    input: { text: text },
    voice: { languageCode: 'en-IN', name: 'en-IN-Standard-A', ssmlGender: 'FEMALE' as const }, // Customized voice
    audioConfig: { audioEncoding: 'MP3' as const },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    if (response.audioContent) {
      // Ensure audioContent is a Buffer before converting to base64
      const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
      return audioBuffer.toString('base64');
    }
    throw new Error('No audio content received from Google Cloud TTS.');
  } catch (error) {
    console.error('Error synthesizing speech with Google Cloud TTS:', error);
    throw error;
  }
}