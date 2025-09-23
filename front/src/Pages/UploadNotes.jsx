import { useState } from "react";
import FileUploader from "./FileUploader";
import AudioPlayer from "./AudioPlayer";

export default function UploadNotes() {
  const [result, setResult] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ phase: undefined, percent: 0, etaSec: undefined });

  const handleConvert = (resp) => {
    // resp expected to be an object: { text: "...", audioUrl: "/jobs/abc/out.wav" }
    setIsProcessing(true);

    // small UX delay to keep the "Processing..." state visible
    setTimeout(() => {
      setResult(resp?.text || "");
      setAudioUrl(resp?.audioUrl || "");
      setIsProcessing(false);
      setProgress({ phase: 'done', percent: 100, etaSec: 0 });
    }, 400);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Upload Notes
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload your documents and convert them to audio with advanced OCR and text-to-speech technology
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl">
              📄
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Document Upload</h2>
              <p className="text-gray-600">Supported formats: PDF, DOCX, TXT, Images</p>
            </div>
          </div>
          
          <FileUploader onConvert={handleConvert} onProgress={setProgress} />
        </div>
      </div>

      {/* Results Section */}
      {(result || audioUrl) && (
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white text-2xl">
              {isProcessing ? "⏳" : "✅"}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isProcessing ? "Processing..." : "Conversion Complete"}
              </h2>
              <p className="text-gray-600">
                {isProcessing ? "Converting your document to audio..." : "Your document has been successfully converted"}
              </p>
            </div>
          </div>

          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-900 font-medium">
                  {progress.phase === 'upload' && 'Uploading file...'}
                  {progress.phase === 'processing' && 'Processing on server...'}
                  {progress.phase === 'download' && 'Downloading audio...'}
                  {!progress.phase && 'Starting...'}
                </span>
                {typeof progress.percent === 'number' && (
                  <span className="text-blue-800">{progress.percent}%</span>
                )}
              </div>
              <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${Math.max(0, Math.min(100, progress.percent || 5))}%` }}
                ></div>
              </div>
              {typeof progress.etaSec === 'number' && progress.phase === 'download' && (
                <div className="text-sm text-blue-800">ETA ~ {Math.max(0, progress.etaSec)}s</div>
              )}
            </div>
          )}

          {result && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Extracted Text:</h3>
              <p className="text-gray-700 leading-relaxed">{result}</p>
            </div>
          )}

          {audioUrl && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Audio Output:</h3>
              <AudioPlayer src={audioUrl} autoplay={true} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
