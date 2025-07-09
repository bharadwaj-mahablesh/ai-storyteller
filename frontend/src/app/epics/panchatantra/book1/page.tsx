'use client';

import { useState, useEffect, useRef } from 'react';
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

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
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

  // State for interactive mode
  const [isInterruptionModalOpen, setIsInterruptionModalOpen] = useState(false);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [llmResponse, setLlmResponse] = useState<string>(''); // Keep text response for display
  const [llmAudioUrl, setLlmAudioUrl] = useState<string | null>(null); // New state for audio URL
  const [isListening, setIsListening] = useState(false);
  const audioPlayerRef = useRef<{ pause: () => void; play: () => void }>(null);


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

  // Interactive Mode Functions
  const handleInterrupt = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setIsInterruptionModalOpen(true);
    startSpeechRecognition();
  };

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Please use Chrome.');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let finalTranscript = ''; // Use a local variable to store the transcript

    recognition.onstart = () => {
      setIsListening(true);
      setUserQuestion('');
      setLlmResponse('');
      finalTranscript = ''; // Reset local transcript
    };

    recognition.onresult = (event: any) => {
      finalTranscript = event.results[0][0].transcript; // Store in local variable
      setUserQuestion(finalTranscript); // Update state for display
      recognition.stop(); // Stop recognition once a result is obtained
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setLlmResponse('Could not understand your question. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript) { // Use the local variable here
        sendQuestionToLLM(finalTranscript);
      } else {
        setLlmResponse('No question detected. Please try again.');
      }
    };

    recognition.start();
  };

  const sendQuestionToLLM = async (question: string) => {
    if (!selectedStory) return;

    const context = {
      storyTitle: selectedStory.title,
      segmentText: selectedStory.segments[currentSegment].segment_text,
      userQuestion: question,
    };

    try {
      const response = await fetch('http://localhost:3001/api/ask-llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from LLM');
      }

      const data = await response.json();
      setLlmResponse(data.response); // Set text response for display

      // Handle audio response
      if (data.audio) {
        const audioBlob = base64toBlob(data.audio, 'audio/mpeg'); // Assuming audio/mpeg
        const url = URL.createObjectURL(audioBlob);
        setLlmAudioUrl(url);
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        setLlmResponse(`Error: ${err.message}`);
      } else {
        setLlmResponse('An unknown error occurred while contacting the LLM.');
      }
    }
  };

  const handleResumeStory = () => {
    setIsInterruptionModalOpen(false);
    setUserQuestion('');
    setLlmResponse('');
    setLlmAudioUrl(null); // Clear audio URL
    if (audioPlayerRef.current) {
      audioPlayerRef.current.play();
    }
  };

  // Helper function to convert base64 to Blob
  const base64toBlob = (base64: string, type: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: type });
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
            {/* Audio Player and Interrupt Button (side-by-side) */}
            <div className="mt-6 flex flex-wrap justify-center items-center gap-4">
              {audioError && <p className="text-center text-red-600">Audio Error: {audioError}</p>}
              {audioUrl && !audioLoading && !audioError && (
                <AudioPlayer
                  ref={audioPlayerRef}
                  audioUrl={audioUrl}
                  onEnded={handleAudioEnd}
                  onTimeUpdate={handleAudioTimeUpdate}
                  autoPlay={true}
                />
              )}
              {selectedStory && audioUrl && !showQuestions && (
                <button
                  onClick={handleInterrupt}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Interrupt & Ask
                </button>
              )}
            </div>
            <div className="text-gray-800 whitespace-pre-line my-8 text-lg leading-relaxed">
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

            {/* Moral of the Story (moved to end) */}
            <p className="text-lg font-semibold text-blue-700 mb-2">Moral:</p>
            <p className="text-base text-blue-900 mb-6">{selectedStory.moral}</p>


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

            {/* Interruption Modal */}
            {isInterruptionModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                  <h4 className="font-bold text-xl mb-4 text-center">
                    {isListening ? 'Listening...' : 'Ask Your Question'}
                  </h4>
                  {userQuestion && (
                    <p className="text-gray-700 text-center mb-4">You asked: "{userQuestion}"</p>
                  )}
                  {llmAudioUrl && ( // Play audio if available
                    <AudioPlayer
                      audioUrl={llmAudioUrl}
                      autoPlay={true}
                      onEnded={() => { /* Optionally enable resume button here */ }}
                    />
                  )}
                  {!llmAudioUrl && llmResponse && ( // Fallback to text if no audio or error
                    <p className="text-gray-800 text-center mb-4 font-semibold">AI: "{llmResponse}"</p>
                  )}
                  {!isListening && !llmAudioUrl && !llmResponse && !userQuestion && (
                    <p className="text-gray-500 text-center mb-4">Speak your question clearly.</p>
                  )}
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleResumeStory}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Resume Story
                    </button>
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