import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
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
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAudioDataTime = useRef<number>(Date.now());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);

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
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext!)();
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;
      recorder.ondataavailable = async (e) => {
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
    } catch (e) {
      console.error(e);
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

  useEffect(() => {
    const silenceIntervalSeconds = 5;
    if (!isRecording) return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    const checkSilence = () => {
      if (
        Date.now() - lastAudioDataTime.current >=
        silenceIntervalSeconds * 1000
      ) {
        console.log(
          `MediaRecorder detected ${silenceIntervalSeconds}s of silence. Transcript:`
        );
      } else {
        silenceTimerRef.current = setTimeout(checkSilence, 500);
      }
    };
    silenceTimerRef.current = setTimeout(checkSilence, 500);
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isRecording]);

  useRealtimeSilenceDetection({
    isRecording,
    audioContextRef,
    streamRef,
    analyserRef,
    silenceStartRef,
    silenceIntervalSeconds: 5,
    decibelLimit: -50,
    silenceCallback: () => {
      console.log(`Real-time detected 5s of silence. Transcript:`, transcript);
    },
  });

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

// Utility: Real-time silence checker
function useRealtimeSilenceDetection({
  isRecording,
  audioContextRef,
  streamRef,
  analyserRef,
  silenceStartRef,
  silenceIntervalSeconds = 5,
  decibelLimit = -50,
  silenceCallback,
}: {
  isRecording: boolean;
  audioContextRef: React.RefObject<AudioContext | null>;
  streamRef: React.RefObject<MediaStream | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  silenceStartRef: React.RefObject<number | null>;
  silenceIntervalSeconds?: number;
  decibelLimit?: number;
  silenceCallback?: () => void;
}) {
  useEffect(() => {
    if (!isRecording || !audioContextRef.current || !streamRef.current) return;
    const audioContext = audioContextRef.current;
    const source = audioContext.createMediaStreamSource(streamRef.current);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = analyser;
    const dataArray = new Float32Array(analyser.fftSize);

    let animationId: number;
    const checkSilence = () => {
      const decibels = calculateDecibels(
        (analyser.getFloatTimeDomainData(dataArray), dataArray)
      );
      if (decibels < decibelLimit) {
        if (silenceStartRef.current === null) {
          silenceStartRef.current = Date.now();
        } else if (
          Date.now() - silenceStartRef.current >=
          silenceIntervalSeconds * 1000
        ) {
          if (silenceCallback) silenceCallback();
          silenceStartRef.current = Date.now(); // reset so it only logs once per silence period
        }
      } else {
        silenceStartRef.current = null;
      }
      animationId = requestAnimationFrame(checkSilence);
    };
    animationId = requestAnimationFrame(checkSilence);
    return () => {
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      source.disconnect();
      cancelAnimationFrame(animationId);
      silenceStartRef.current = null;
    };
  }, [
    analyserRef,
    audioContextRef,
    decibelLimit,
    isRecording,
    silenceIntervalSeconds,
    silenceStartRef,
    streamRef,
    silenceCallback,
  ]);
}
// Utility: Calculate RMS and decibels from audio data
function calculateDecibels(dataArray: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i] * dataArray[i];
  }
  const rms = Math.sqrt(sum / dataArray.length);
  return 20 * Math.log10(rms);
}
