import { useState, useEffect } from "react";

export default function TranscriptDisplay({ text }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayedText("");
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 20);

    return () => clearInterval(typeInterval);
  }, [text]);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 min-h-[300px] max-h-[400px] overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Live Transcript</h3>
          <div className="flex items-center space-x-2">
            {isTyping && (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            )}
            <span className="text-sm text-gray-500">{displayedText.split(" ").length} words</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-gray-800 leading-relaxed">
            {displayedText || "Transcript will appear here..."}
            {isTyping && <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse"></span>}
          </p>
        </div>

        {text && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <button
              onClick={() => navigator.clipboard.writeText(text)}
              className="bg-white text-blue-700 px-4 py-2 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl border border-blue-300"
            >
              📋 Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
