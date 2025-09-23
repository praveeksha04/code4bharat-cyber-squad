import { Button } from "@/components/ui/button";
import { useState, useRef ,useEffect } from "react";

export default function AudioPlayer({ src ,autoplay=false}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (!src || !audioRef.current) return;

    // reload the audio element source
    audioRef.current.load();

    if (autoplay) {
      // attempt to play; browsers may block autoplay if no user gesture
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // autoplay blocked — keep isPlaying false and let user press play
          setIsPlaying(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, autoplay]);

  if (!src) return null;

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
  };

  const handleLoadedMetadata = (e) => {
    setDuration(e.target.duration);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const seekTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <span className="text-white text-xl">🎵</span>
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Audio Output</h3>
          <p className="text-sm text-gray-600">
            Generated speech from your document
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <Button
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl border border-blue-600"
          >
            {isPlaying ? (
              // Pause icon
              <div className="flex space-x-1">
                <div className="w-2 h-6 bg-white rounded-sm"></div>
                <div className="w-2 h-6 bg-white rounded-sm"></div>
              </div>
            ) : (
              // Play icon
              <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            disabled={!duration}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                duration ? (currentTime / duration) * 100 : 0
              }%, #e5e7eb ${duration ? (currentTime / duration) * 100 : 0}%, #e5e7eb 100%)`,
            }}
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Hidden Audio */}
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Download Button */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <a
          href={src}
          download
          className="w-full bg-white text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl border border-gray-300"
        >
          <span>💾</span>
          <span>Download Audio</span>
        </a>
      </div>
    </div>
  );
}
