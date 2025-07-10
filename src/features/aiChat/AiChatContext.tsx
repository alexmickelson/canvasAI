import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import type OpenAI from "openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import toast from "react-hot-toast";
import { useHandleToolCall } from "./useHandleToolCall";
import { useTRPCClient } from "../../server/trpc/trpcClient";
import type { AiTool } from "../../utils/createAiTool";

interface AiChatContextType {
  messages: ChatCompletionMessageParam[];
  sendMessage: (input: string) => Promise<void>;
  cancelStream: () => void;
  isStreaming: boolean;
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
  const [messages, setMessages] = useState<ChatCompletionMessageParam[]>([
    {
      role: "system",
      content: systemPrompt,
      name: "system",
    },
  ]);
  const client = useTRPCClient();
  const [stream, setStream] = useState<AsyncIterable<unknown> | null>(null);
  const [ac, setAc] = useState(() => new AbortController());

  const cancelStream = useCallback(() => {
    ac.abort("user requestted to strop the stream");
    setAc(new AbortController());
    setStream(null);
  }, [ac]);

  const handleToolCall = useHandleToolCall({
    tools,
    setMessages,
    cancelStream,
  });

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    if (stream) {
      console.warn("Stream is already in progress, aborting new request.");
      return;
    }

    if (lastMessage.role !== "user" && lastMessage.role !== "tool") {
      console.log("not starting stream, last message is not user");
      return;
    } else {
      console.log("starting stream with messages:", messages);
    }

    const handleStream = async () => {
      const toolsSchema: OpenAI.Chat.Completions.ChatCompletionTool[] =
        tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: zodToJsonSchema(tool.paramsSchema, {
              target: "openAi",
            }),
          },
        }));

      const newStream = await client.ai.streamOpenAi.mutate(
        {
          messages: messages,
          tools: toolsSchema,
        },
        {
          signal: ac.signal,
        }
      );

      setStream(newStream);

      const latestMessage: ChatCompletionMessageParam = {
        role: "assistant",
        content: "",
        // name: "assistant",
      };
      setMessages((prev) => [...prev, latestMessage]);

      for await (let chunk of newStream) {
        console.log(chunk);

        const isToolCall =
          chunk.choices[0] &&
          (chunk.choices[0].delta.tool_calls?.length ||
            chunk.choices[0].finish_reason === "tool_calls");

        if (isToolCall) {
          // console.log("tool call detected in chunk:", chunk);
          chunk = await handleToolCall(chunk, newStream);
        } else if (chunk.choices[0]) {
          latestMessage.content += chunk.choices[0].delta.content || "";
          setMessages((prev) => {
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1] = latestMessage;
            return updatedMessages;
          });
        }

        if (chunk.choices?.[0]?.finish_reason) {
          console.log(
            "finishing stream with reason:",
            chunk.choices[0].finish_reason
          );
          return chunk.choices[0].finish_reason;
        }
      }
    };

    handleStream()
      .then((reason) => {
        console.log("Stream finished with reason:", reason);
        setStream(null);
      })
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
        setStream(null);
      });
  }, [
    ac.signal,
    cancelStream,
    client.ai.streamOpenAi,
    handleToolCall,
    messages,
    stream,
    tools,
  ]);

  const sendMessage = async (input: string) => {
    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: input,
      // name: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
  };

  return (
    <AiChatContext.Provider
      value={{
        messages,
        sendMessage,
        cancelStream,
        isStreaming: !!stream,
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
