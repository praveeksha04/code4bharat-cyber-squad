import { useState } from "react";
import TranscriptDisplay from "./TranscriptDisplay";
import { Button } from "@/components/ui/button";

export default function LiveLecture() {
  const [transcript, setTranscript] = useState("");
  const [running, setRunning] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const toggleLecture = () => {
    if (!running) {
      setRunning(true);
      setWordCount(0);
      // Mock live caption updates
      const interval = setInterval(() => {
        const mockWords = [
          "Welcome to today's lecture on artificial intelligence and machine learning.",
          "Today we'll be discussing neural networks and their applications.",
          "First, let's understand the basic concepts of deep learning.",
          "Neural networks consist of layers of interconnected nodes.",
          "Each node processes information and passes it to the next layer.",
          "The training process involves adjusting weights to minimize errors.",
          "This is crucial for achieving high accuracy in predictions.",
          "Let's look at some practical examples and use cases."
        ];
        
        const randomWords = mockWords[Math.floor(Math.random() * mockWords.length)];
        setTranscript(prev => prev + (prev ? " " : "") + randomWords);
        setWordCount(prev => prev + randomWords.split(' ').length);
      }, 3000);
      window.mockInterval = interval;
    } else {
      setRunning(false);
      clearInterval(window.mockInterval);
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setWordCount(0);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Live Lecture
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Real-time speech-to-text transcription for live lectures and presentations
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className={`w-4 h-4 rounded-full ${running ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {running ? "Recording Active" : "Recording Stopped"}
              </h2>
              <p className="text-gray-600">
                {wordCount > 0 ? `${wordCount} words captured` : "Ready to start transcription"}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={clearTranscript}
              disabled={running || !transcript}
              className="bg-white text-black px-6 py-3 rounded-xl font-semibold border-2 border-green-700 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center space-x-2">
                <span>🗑️</span>
                <span>Clear</span>
              </div>
            </Button>
            <Button
              onClick={toggleLecture}
              className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl border ${
                running 
                  ? 'bg-red-600 border-red-600 hover:bg-red-700' 
                  : 'bg-green-600 border-green-600 hover:bg-green-700'
              }`}
            >
              {running ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                  <span>Stop Recording</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                  <span>Start Recording</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Transcript Display */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Live Transcript</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
        
        <TranscriptDisplay text={transcript} />
        
        {!transcript && (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎤</span>
            </div>
            <p className="text-lg">Click "Start Recording" to begin live transcription</p>
          </div>
        )}
      </div>

      {/* Features Info */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Real-time Processing</h3>
          <p className="text-gray-600 text-sm">Instant speech-to-text conversion with minimal delay</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">High Accuracy</h3>
          <p className="text-gray-600 text-sm">Advanced AI models for precise transcription</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Export Options</h3>
          <p className="text-gray-600 text-sm">Save transcripts in multiple formats</p>
        </div>
      </div>
    </div>
  );
}