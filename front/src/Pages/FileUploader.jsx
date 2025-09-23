import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function FileUploader({ onConvert }) {
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleUpload = () => {
    if (!file) return;
    // Simulate a conversion process
    onConvert(`✅ Mock conversion of ${file.name} completed. Extracted text: "This is a sample document content that has been processed using OCR technology. The text has been successfully converted and is ready for text-to-speech conversion."`);
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