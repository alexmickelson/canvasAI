import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";

interface TranscriptLine {
  speaker: number;
  text: string;
  beg?: number;
  end?: number;
}

interface VoiceContextType {
  isRecording: boolean;
  status: string;
  transcript: TranscriptLine[];
  bufferTranscription: string;
  chunkDuration: number;
  websocketUrl: string;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  setChunkDuration: (ms: number) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const useVoiceContext = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx)
    throw new Error("useVoiceContext must be used within VoiceContextProvider");
  return ctx;
};

export const VoiceContextProvider: React.FC<{
  children: React.ReactNode;
  websocketUrl: string;
}> = ({ children, websocketUrl }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Click to start transcription");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [bufferTranscription, setBufferTranscription] = useState("");
  const [chunkDuration, setChunkDurationState] = useState(1000);

  const websocketRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const setupWebSocket = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(websocketUrl);
        websocketRef.current = ws;
        ws.onopen = () => {
          setStatus("Connected to server.");
          resolve();
        };
        ws.onerror = () => {
          setStatus("Error connecting to WebSocket.");
          reject(new Error("WebSocket error"));
        };
        ws.onclose = () => {
          setStatus("Disconnected from WebSocket server.");
          setIsRecording(false);
        };
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "ready_to_stop") {
            setStatus("Finished processing audio! Ready to record again.");
          }
          console.log("Received message:", data.lines);
          setTranscript(data.lines || []);
          setBufferTranscription(data.buffer_transcription || "");
        };
      } catch (e) {
        setStatus("Invalid WebSocket URL");
        reject(e);
      }
    });
  }, [websocketUrl]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    setStatus("Connecting to WebSocket...");
    await setupWebSocket();
    setStatus("Accessing microphone...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // @ts-ignore: webkitAudioContext for Safari
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (
          websocketRef.current &&
          websocketRef.current.readyState === WebSocket.OPEN
        ) {
          websocketRef.current.send(e.data);
        }
      };
      recorder.start(chunkDuration);
      setIsRecording(true);
      setStatus("Recording...");
    } catch (err) {
      setStatus("Error accessing microphone");
      setIsRecording(false);
    }
  }, [chunkDuration, isRecording, setupWebSocket]);

  const stopRecording = useCallback(() => {
    setStatus("Stopping recording...");
    setIsRecording(false);
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (
      websocketRef.current &&
      websocketRef.current.readyState === WebSocket.OPEN
    ) {
      // Send empty audio buffer as stop signal
      const emptyBlob = new Blob([], { type: "audio/webm" });
      websocketRef.current.send(emptyBlob);
    }
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        isRecording,
        status,
        transcript,
        bufferTranscription,
        chunkDuration,
        websocketUrl,
        startRecording,
        stopRecording,
        setChunkDuration: setChunkDurationState,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};
