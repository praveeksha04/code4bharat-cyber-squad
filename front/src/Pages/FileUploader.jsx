import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function FileUploader({ onConvert, onProgress }) {
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

// replace the existing handleUpload with streaming-aware version with progress
const handleUpload = async () => {
  if (!file) return;

  try {
    const fd = new FormData();
    fd.append('doc', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.responseType = 'blob';

    const startedAt = Date.now();

    // Upload progress
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return onProgress && onProgress({ phase: 'upload', percent: 0 });
      const percent = Math.round((e.loaded / e.total) * 100);
      onProgress && onProgress({ phase: 'upload', percent });
    };

    // When headers received -> likely server started processing
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
        onProgress && onProgress({ phase: 'processing', percent: undefined });
      }
    };

    // Download progress (response streaming)
    xhr.onprogress = (e) => {
      const contentLength = Number(xhr.getResponseHeader('Content-Length') || 0);
      if (contentLength > 0 && e.lengthComputable) {
        const percent = Math.min(100, Math.round((e.loaded / contentLength) * 100));
        const elapsedSec = (Date.now() - startedAt) / 1000;
        const speed = e.loaded / Math.max(1, elapsedSec); // bytes/sec
        const remaining = Math.max(0, contentLength - e.loaded);
        const etaSec = Math.round(remaining / Math.max(1, speed));
        onProgress && onProgress({ phase: 'download', percent, etaSec });
      } else {
        onProgress && onProgress({ phase: 'download', percent: undefined });
      }
    };

    xhr.onerror = () => {
      alert('Upload failed. Network error.');
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          const reader = new FileReader();
          reader.onload = () => alert(reader.result || 'Upload failed');
          reader.readAsText(xhr.response);
        } catch (_) {
          alert('Upload failed');
        }
        return;
      }

      const transcriptHeader = xhr.getResponseHeader('X-Transcript-URI');
      const text = transcriptHeader ? decodeURIComponent(transcriptHeader) : '';
      const blob = xhr.response;
      const audioUrl = URL.createObjectURL(blob);
      onProgress && onProgress({ phase: 'done', percent: 100 });
      if (onConvert) onConvert({ text, audioUrl });
    };

    xhr.send(fd);
  } catch (err) {
    console.error('Upload error', err);
    alert('Upload failed. See console for details.');
  }
};


  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">📁</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop files here or click to upload</h3>
            <p className="text-gray-600 mb-4">Support for PDF, DOCX, TXT, and image files</p>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
              className="hidden"
              id="file-upload"
            />
            <Label
              htmlFor="file-upload"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold cursor-pointer hover:bg-blue-700 transition-all duration-200 inline-block shadow-lg hover:shadow-xl border border-blue-600"
            >
              Choose File
            </Label>
          </div>
        </div>
      </div>

      {/* File Info */}
      {file && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">✓</span>
            </div>
            <div>
              <p className="font-semibold text-green-800">{file.name}</p>
              <p className="text-sm text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Convert Button */}
      <Button
        onClick={handleUpload}
        disabled={!file}
        className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl border border-blue-600 disabled:hover:shadow-lg"
      >
        {file ? `Convert ${file.name}` : 'Select a file to convert'}
      </Button>
    </div>
  );
}