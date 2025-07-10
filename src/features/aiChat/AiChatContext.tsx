import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";
import toast from "react-hot-toast";
import type { AiTool } from "../../utils/createAiTool";
import { useHandleStream } from "./useHandleStream";

interface AiChatContextType {
  messages: ChatCompletionMessageParam[];
  sendMessage: (input: string) => Promise<void>;
  cancelStream: () => void;
  isStreaming: boolean;
  currentMessage: string;
}

const AiChatContext = createContext<AiChatContextType | null>(null);

export const AiChatProvider = ({
  children,
  tools,
  systemPrompt,
}: {
  systemPrompt: string;
  children: ReactNode;
  tools: AiTool[];
}) => {
  console.log("rendering AiChatProvider");
  const acRef = useRef<AbortController>(new AbortController());
  const [completedMessages, setCompletedMessages] = useState<
    ChatCompletionMessageParam[]
  >([
    {
      role: "system",
      content: systemPrompt,
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState<string>("");

  const streamRef = useRef<AsyncIterable<ChatCompletionChunk> | null>(null);

  const { handleStream } = useHandleStream({
    tools,
    streamRef,
    setMessages: setCompletedMessages,
    ac: acRef,
    setCurrentMessage,
  });

  const cancelStream = useCallback(() => {
    acRef.current.abort("user requested to stop the stream");
    streamRef.current = null;
  }, []);

  useEffect(() => {
    const lastMessage = completedMessages[completedMessages.length - 1];
    if (!lastMessage) return;

    if (streamRef.current) {
      console.warn("Stream is already in progress, aborting new request.");
      return;
    }

    if (lastMessage.role !== "user" && lastMessage.role !== "tool") {
      console.log("not starting stream, last message is not user or tool");
      return;
    }

    handleStream(completedMessages)
      .catch((error) => {
        if (
          (error instanceof Error && error.message === "Stream closed") ||
          (error instanceof Error &&
            error.message.includes("The operation was aborted"))
        ) {
          return;
        }
        const message = `Error during AI chat stream: ${
          error instanceof Error ? error.message : "An unknown error occurred"
        }`;
        toast.error(message);
        console.error(message);
      })
      .finally(() => {
        acRef.current = new AbortController();
        streamRef.current = null;
      });
  }, [handleStream, completedMessages]);

  const sendMessage = async (input: string) => {
    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: input,
    };
    setCompletedMessages((prev) => [...prev, userMessage]);
  };

  return (
    <AiChatContext.Provider
      value={{
        messages: completedMessages,
        sendMessage,
        cancelStream,
        isStreaming: !!streamRef.current,
        currentMessage,
      }}
    >
      {children}
    </AiChatContext.Provider>
  );
};

export const useAiChat = () => {
  const context = useContext(AiChatContext);
  if (!context) {
    throw new Error("useAiChat must be used within an AiChatProvider");
  }
  return context;
};
