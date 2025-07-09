'use client';

import { useState, useEffect } from 'react';
import AudioPlayer from '../../../components/AudioPlayer'; // Import the AudioPlayer component

interface Preface {
  title: string;
  text: string;
}

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface Story {
  story_number: number;
  title: string;
  full_text: string;
  summary: string;
  moral: string;
  segments: {
    segment_id: number;
    segment_text: string;
    pause_after: boolean;
    guided_questions: { text: string; audio_path?: string; timestamps?: WordTimestamp[] }[];
    audio_path?: string;
    timestamps?: WordTimestamp[];
  }[];
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
  const [currentSegment, setCurrentSegment] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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

  const handleStorySelect = (story: Story) => {
    setSelectedStory(story);
    setCurrentSegment(0);
    setShowQuestions(false);
    setAudioUrl(null);
    setAudioError(null);
    setHighlightedWordIndex(-1);
    setCurrentQuestionIndex(0);

    const firstSegment = story.segments[0];
    if (firstSegment?.audio_path) {
      setAudioUrl(`http://localhost:3001${firstSegment.audio_path}`);
    } else {
      setAudioError("Audio not available for this segment.");
    }
  };

  const handleNextSegment = () => {
    if (selectedStory && currentSegment < selectedStory.segments.length - 1) {
      const nextSegmentIndex = currentSegment + 1;
      setCurrentSegment(nextSegmentIndex);
      const nextSegment = selectedStory.segments[nextSegmentIndex];
      
      setShowQuestions(false);
      setAudioUrl(null);
      setAudioError(null);
      setHighlightedWordIndex(-1);
      setCurrentQuestionIndex(0);

      if (nextSegment?.audio_path) {
        setAudioUrl(`http://localhost:3001${nextSegment.audio_path}`);
      } else {
        setAudioError("Audio not available for this segment.");
      }
    } else if (selectedStory && currentSegment === selectedStory.segments.length - 1) {
      setSelectedStory(null);
    }
  };

  const handleAudioTimeUpdate = (currentTime: number) => {
    if (currentTime === undefined) return;

    const currentSegmentData = selectedStory?.segments[currentSegment];
    if (currentSegmentData?.timestamps) {
      const activeWordIndex = currentSegmentData.timestamps.findIndex(
        (ts) => currentTime >= ts.start && currentTime < ts.end
      );
      setHighlightedWordIndex(activeWordIndex);
    }
  };

  const handleAudioEnd = () => {
    setHighlightedWordIndex(-1);
    if (selectedStory?.segments[currentSegment]?.pause_after) {
      setShowQuestions(true);
    } else {
      handleNextSegment();
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
                onClick={() => handleStorySelect(story)}
              >
                <div className="flex-1 relative overflow-hidden">
                  <h3 className="text-2xl font-semibold mb-2">{story.title}</h3>
                  <div className="relative h-32 overflow-hidden">
                    <p className="text-gray-700 text-base whitespace-pre-line mb-4 h-full overflow-hidden" style={{ WebkitMaskImage: 'linear-gradient(180deg, #000 60%, transparent 100%)', maskImage: 'linear-gradient(180deg, #000 60%, transparent 100%)' }}>{story.segments.map(s => s.segment_text).join(' ')}</p>
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
                setAudioUrl(null);
                setAudioError(null);
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-3xl font-bold mb-4">{selectedStory.title}</h3>
            <p className="text-lg font-semibold text-blue-700 mb-2">Moral:</p>
            <p className="text-base text-blue-900 mb-6">{selectedStory.moral}</p>
            <div className="text-gray-800 whitespace-pre-line mb-6 text-lg leading-relaxed">
              {selectedStory.segments.map((segment, segmentIndex) => (
                <span key={segmentIndex}>
                  {segment.timestamps ? (
                    segment.timestamps.map((wordData, wordIndex) => {
                      const isRead = segmentIndex < currentSegment || (segmentIndex === currentSegment && wordIndex < highlightedWordIndex);
                      return (
                        <span
                          key={wordIndex}
                          className={`word ${isRead ? 'read' : ''}`}
                        >
                          {wordData.word + ' '}
                        </span>
                      );
                    })
                  ) : (
                    <span>{segment.segment_text}</span>
                  )}
                </span>
              ))}
            </div>

            {/* Audio Player Section */}
            <div className="mt-6 flex flex-col items-center">
              {audioError && <p className="text-center text-red-600">Audio Error: {audioError}</p>}
              {audioUrl && !audioLoading && !audioError && (
                <AudioPlayer
                  audioUrl={audioUrl}
                  onEnded={handleAudioEnd}
                  onTimeUpdate={handleAudioTimeUpdate}
                  autoPlay={true}
                />
              )}
            </div>

            {showQuestions && selectedStory.segments[currentSegment].guided_questions.length > 0 && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                  <h4 className="font-bold text-xl mb-4 text-center">Think about it...</h4>
                  <p className="text-gray-700 text-center mb-4">
                    {selectedStory.segments[currentSegment].guided_questions[currentQuestionIndex].text}
                  </p>
                  {selectedStory.segments[currentSegment].guided_questions[currentQuestionIndex].audio_path && (
                    <AudioPlayer
                      audioUrl={`http://localhost:3001${selectedStory.segments[currentSegment].guided_questions[currentQuestionIndex].audio_path}`}
                      autoPlay={true}
                      onEnded={() => {}}
                    />
                  )}
                  <div className="flex justify-center mt-6">
                    {currentQuestionIndex < selectedStory.segments[currentSegment].guided_questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Next Question
                      </button>
                    ) : (
                      <button
                        onClick={handleNextSegment}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Continue Story
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

