import { useState, useRef, useEffect } from "react";
import axios from "axios";
import SyncedTranscriptDisplay from "../components/SyncedTranscriptDisplay";
import TranscriptDisplay from "../components/TranscriptDisplay";
import { Button } from "@/components/ui/button";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
const SPEECH_KEY = import.meta.env.VITE_SPEECH_KEY;
const SPEECH_REGION = import.meta.env.VITE_SPEECH_REGION;

export default function LiveLecture() {
  const [transcript, setTranscript] = useState("");
  const [running, setRunning] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadTranscriptData, setUploadTranscriptData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoSrc, setVideoSrc] = useState(null);
  const [activeWordOffset, setActiveWordOffset] = useState(null);

  const videoRef = useRef(null);
  const recognizerRef = useRef(null);

  // Sync uploaded transcript with video
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      const currentTimeTicks = videoElement.currentTime * 10000000;

      if (uploadTranscriptData?.recognizedPhrases) {
        for (const phrase of uploadTranscriptData.recognizedPhrases) {
          const words = phrase.nBest?.[0]?.words || [];
          for (const word of words) {
            const wordStart = word.offsetInTicks;
            const wordEnd = word.offsetInTicks + word.durationInTicks;
            if (currentTimeTicks >= wordStart && currentTimeTicks < wordEnd) {
              setActiveWordOffset(word.offsetInTicks);
              return;
            }
          }
        }
      }
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [uploadTranscriptData]);

  // Handle file upload
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setVideoSrc(URL.createObjectURL(file));
      setUploadTranscriptData(null);
      setError("");
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }
    setIsLoading(true);
    setError("");
    setUploadTranscriptData(null);

    const formData = new FormData();
    formData.append("video", selectedFile);
    try {
      const response = await axios.post(
        "http://localhost:3000/api/transcribe",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setUploadTranscriptData(response.data);
    } catch (err) {
      console.error(err);
      setError("An error occurred during transcription.");
    } finally {
      setIsLoading(false);
    }
  };

  // Start/stop live recording with Azure
  const toggleLecture = async () => {
    if (running) {
      recognizerRef.current?.stopContinuousRecognitionAsync();
      recognizerRef.current = null;
      setRunning(false);
      return;
    }

    try {
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        SPEECH_KEY,
        SPEECH_REGION
      );
      speechConfig.speechRecognitionLanguage = "en-US";

      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(
        speechConfig,
        audioConfig
      );
      recognizerRef.current = recognizer;

      recognizer.recognizing = (_s, e) => {
        if (e.result.text) {
          setTranscript((prev) => prev + " " + e.result.text);
        }
      };

      recognizer.recognized = (_s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          setTranscript((prev) => prev + " " + e.result.text);
        }
      };

      recognizer.startContinuousRecognitionAsync();
      setRunning(true);
    } catch (err) {
      console.error("Azure Speech Error:", err);
      setError("Speech recognition failed. Check your Azure credentials.");
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setUploadTranscriptData(null);
    setVideoSrc(null);
    setSelectedFile(null);
    setError("");
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Live Lecture</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Real-time speech-to-text transcription for live lectures and
          presentations
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div
              className={`w-4 h-4 rounded-full ${
                running ? "bg-red-500 animate-pulse" : "bg-gray-300"
              }`}
            ></div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {running ? "Recording Active" : "Recording Stopped"}
              </h2>
              <p className="text-gray-600">Ready to start live transcription</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button onClick={clearTranscript} variant="outline">
              Clear
            </Button>
            <Button onClick={toggleLecture}>
              {running ? "Stop Recording" : "Start Recording"}
            </Button>
          </div>
        </div>

        <hr className="my-6 border-t-2 border-gray-100" />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Or Upload a Recorded Lecture
          </h2>

          {videoSrc && (
            <div className="my-4 border rounded-lg overflow-hidden bg-black">
              <video
                controls
                src={videoSrc}
                ref={videoRef}
                width="100%"
                className="max-h-[500px]"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input
              type="file"
              onChange={handleFileChange}
              accept="video/*"
              className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
            />
            <Button
              onClick={handleUploadSubmit}
              disabled={isLoading || !selectedFile}
            >
              {isLoading ? "Transcribing..." : "Get Transcription"}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900">Transcript</h2>
        {isLoading && (
          <div className="text-center py-12 text-gray-500">
            Processing your video...
          </div>
        )}

        {uploadTranscriptData ? (
          <SyncedTranscriptDisplay
            transcriptData={uploadTranscriptData}
            activeWordOffset={activeWordOffset}
          />
        ) : (
          <TranscriptDisplay text={transcript} />
        )}
      </div>
    </div>
  );
}
