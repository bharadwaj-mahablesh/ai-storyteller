import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
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

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});