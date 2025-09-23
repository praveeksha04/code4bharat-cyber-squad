SyncedTranscriptDisplay// SyncedTranscriptDisplay.js

export default function SyncedTranscriptDisplay({ transcriptData, activeWordOffset }) {
  // If there's no data, show a placeholder message.
  if (!transcriptData || !transcriptData.recognizedPhrases) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">Your transcript will appear here once processing is complete.</p>
      </div>
    );
  }

  // Flatten all words from all phrases into a single array for easier rendering
  const allWords = transcriptData.recognizedPhrases.flatMap(
    (phrase) => (phrase.nBest && phrase.nBest[0].words) || []
  );

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 min-h-[150px]">
      <p className="text-gray-800 leading-relaxed text-lg">
        {allWords.map((word) => (
          // Add a space after each word span
          <span key={word.offsetInTicks}>
            <span
              className={word.offsetInTicks === activeWordOffset ? "bg-yellow-200 rounded px-1 transition-colors duration-150" : "px-1"}
            >
              {word.word}
            </span>
            {' '}
          </span>
        ))}
      </p>
    </div>
  );
}