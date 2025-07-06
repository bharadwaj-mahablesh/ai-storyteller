import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { Readable } from 'stream'; // Import Readable from Node.js stream

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // Enable JSON body parsing

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY, // Your API key from .env
});

app.post('/api/generate-audio', async (req: Request, res: Response) => {
  const { text, voiceId } = req.body;

  if (!text || !voiceId) {
    return res.status(400).json({ error: 'Text and voiceId are required.' });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured.' });
  }

  try {
    const audioStream = await elevenlabs.textToSpeech.convert(
      voiceId, // voiceId as the first argument
      {
        text: text,
        modelId: 'eleven_multilingual_v2',
      }
    );

    // Convert Web ReadableStream to Node.js ReadableStream
    const nodeReadableStream = Readable.fromWeb(audioStream as any); // 'as any' to bypass TS error for now

    res.setHeader('Content-Type', 'audio/mpeg');
    nodeReadableStream.pipe(res);
  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({ error: 'Failed to generate audio.' });
  }
});

app.get('/api/stories', (req: Request, res: Response) => {
  const prefacePath = path.join(__dirname, 'data', 'book1_preface.json');
  const storiesPath = path.join(__dirname, 'data', 'book1_stories_1_to_5.json');

  fs.readFile(prefacePath, 'utf8', (err, prefaceData) => {
    if (err) {
      console.error('Error reading preface file:', err);
      return res.status(500).send('Error reading preface data');
    }

    fs.readFile(storiesPath, 'utf8', (err, storiesData) => {
      if (err) {
        console.error('Error reading stories file:', err);
        return res.status(500).send('Error reading stories data');
      }

      res.json({
        preface: JSON.parse(prefaceData),
        stories: JSON.parse(storiesData),
      });
    });
  });
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});