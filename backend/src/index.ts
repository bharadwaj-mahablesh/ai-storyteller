import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { generateAudioFromText } from './googleTtsService';
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // Enable JSON body parsing

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/stories', (req: Request, res: Response) => {
  const prefacePath = path.join(__dirname, 'data', 'book1_preface.json');
  const storiesPath = path.join(__dirname, 'data', 'stories_final.json');

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

app.post('/api/ask-llm', async (req: Request, res: Response) => {
  const { userQuestion, storyTitle, segmentText } = req.body;

  if (!userQuestion || !storyTitle || !segmentText) {
    return res.status(400).json({ error: 'Missing required parameters: userQuestion, storyTitle, or segmentText.' });
  }

  try {
    const prompt = `You are an AI storyteller assistant. The user is currently listening to a story titled "${storyTitle}". The current part of the story is: "${segmentText}". The user has interrupted to ask: "${userQuestion}". Please answer the user's question concisely based on the provided story context. If the question is not directly related to the story context, politely state that you can only answer questions related to the story.`;

    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral', // Assuming 'mistral' is the model you have pulled in Ollama
        prompt: prompt,
        stream: false, // We want the full response at once
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      throw new Error(`Ollama API error: ${ollamaResponse.status} - ${errorText}`);
    }

    const data = await ollamaResponse.json();
    // Ollama's generate API returns a JSON object with a 'response' field
    const llmAnswer = data.response.trim();

    // Generate audio from LLM response using Google Cloud TTS
    const llmAudioBase64 = await generateAudioFromText(llmAnswer);

    res.json({ response: llmAnswer, audio: llmAudioBase64 });

  } catch (error) {
    console.error('Error communicating with Ollama:', error);
    res.status(500).json({ error: 'Failed to get response from LLM.' });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});