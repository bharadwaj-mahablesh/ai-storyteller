'use client';

import { useState, useEffect } from 'react';
import AudioPlayer from '../../../components/AudioPlayer'; // Import the AudioPlayer component

interface Preface {
  title: string;
  text: string;
}

interface Story {
  story_number: number;
  title: string;
  full_text: string;
  age_groups: {
    '3-7': {
      summary: string;
      moral: string;
    };
    '8-12': {
      summary: string;
      moral: string;
    };
  };
}

export default function PanchatantraBook1Page() {
  const [preface, setPreface] = useState<Preface | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Default voice ID for ElevenLabs (Adam)
  const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('http://localhost:3001/api/stories');
        if (!res.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await res.json();
        setPreface(data.preface);
        setStories(data.stories);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const generateAudio = async (text: string) => {
    setAudioLoading(true);
    setAudioError(null);
    setAudioUrl(null); // Clear previous audio

    try {
      const response = await fetch('http://localhost:3001/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voiceId: ELEVENLABS_VOICE_ID }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate audio from ElevenLabs.');
      }

      // Create a Blob from the audio stream and then a URL
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAudioError(err.message);
      } else {
        setAudioError('An unknown error occurred during audio generation.');
      }
    } finally {
      setAudioLoading(false);
    }
  };

  

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {preface && (
          <section className="mb-12">
            <h1 className="text-4xl font-bold mb-4 text-center">{preface.title}</h1>
            <p className="text-lg text-gray-700 whitespace-pre-line">{preface.text}</p>
          </section>
        )}

        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story) => (
              <div
                key={story.story_number}
                className="border rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer h-64 flex flex-col justify-between bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden"
                onClick={() => setSelectedStory(story)}
              >
                <div className="flex-1 relative overflow-hidden">
                  <h3 className="text-2xl font-semibold mb-2">{story.title}</h3>
                  <div className="relative h-32 overflow-hidden">
                    <p className="text-gray-700 text-base whitespace-pre-line mb-4 h-full overflow-hidden" style={{ WebkitMaskImage: 'linear-gradient(180deg, #000 60%, transparent 100%)', maskImage: 'linear-gradient(180deg, #000 60%, transparent 100%)' }}>{story.full_text}</p>
                  </div>
                </div>
                <p className="text-sm text-blue-800 font-semibold mt-auto">Tap to read full story</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal for full story */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative overflow-y-auto max-h-[90vh]">
            <button
              className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-700"
              onClick={() => {
                setSelectedStory(null);
                setAudioUrl(null); // Clear audio when modal closes
                setAudioError(null);
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-3xl font-bold mb-4">{selectedStory.title}</h3>
            <p className="text-gray-800 whitespace-pre-line mb-6">{selectedStory.full_text}</p>
            <p className="text-lg font-semibold text-blue-700 mb-2">Moral:</p>
            <p className="text-base text-blue-900">{selectedStory.age_groups['8-12'].moral}</p>

            {/* Audio Generation and Player Section */}
            <div className="mt-6 flex flex-col items-center">
              <button
                onClick={() => selectedStory && generateAudio(selectedStory.full_text)}
                disabled={audioLoading}
                className="mb-4 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {audioLoading ? 'Generating Audio...' : 'Generate Audio'}
              </button>
              {audioError && <p className="text-center text-red-600">Audio Error: {audioError}</p>}
              {audioUrl && !audioLoading && !audioError && (
                <AudioPlayer audioUrl={audioUrl} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
