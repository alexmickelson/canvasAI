import { useVoiceContext } from "./VoiceContextProvider";

export const VoiceClientDisplay = () => {
  const {
    isRecording,
    status,
    transcript,
    bufferTranscription,
    startRecording,
    stopRecording,
    chunkDuration,
    setChunkDuration,
  } = useVoiceContext();

  return (
    <div className="bg-gray-900 min-h-[300px] rounded-xl p-6 shadow-lg text-white w-full max-w-2xl mx-auto mt-8">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
        <div className="flex gap-4">
          <button
            className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isRecording
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            onClick={startRecording}
            disabled={isRecording}
          >
            Start
          </button>
          <button
            className="px-6 py-2 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            onClick={stopRecording}
            disabled={!isRecording}
          >
            Stop
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">Chunk size (ms):</label>
          <select
            className="bg-gray-800 text-white rounded px-2 py-1 border border-gray-700 focus:outline-none"
            value={chunkDuration}
            onChange={(e) => setChunkDuration(Number(e.target.value))}
            disabled={isRecording}
          >
            {[500, 1000, 2000, 3000, 4000, 5000].map((ms) => (
              <option key={ms} value={ms}>
                {ms} ms
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-4 text-center">
        <span className="text-base font-medium text-gray-200">{status}</span>
      </div>
      <div className="bg-gray-800 rounded-lg p-4 min-h-[120px] max-h-72 overflow-y-auto">
        {transcript.length === 0 && (
          <div className="text-gray-400 text-center">No transcript yet.</div>
        )}
        <div className="space-y-2">
          {transcript.map((line, idx) => (
            <span key={idx} className="text-gray-100">
              {line.text}
            </span>
          ))}
        </div>
        {bufferTranscription && (
          <span className="text-gray-400 text-xs italic">
            Transcription: {bufferTranscription}
          </span>
        )}
      </div>
    </div>
  );
};
