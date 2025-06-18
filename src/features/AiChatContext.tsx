import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { useTRPCClient } from "../server/trpc/trpcClient";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import type OpenAI from "openai";
import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import toast from "react-hot-toast";

interface AiChatContextType {
  messages: ChatCompletionMessageParam[];
  sendMessage: (input: string) => Promise<void>;
  cancelStream: () => void;
  isStreaming: boolean;
}

const AiChatContext = createContext<AiChatContextType | null>(null);

export interface AiTool {
  name: string;
  description: string;
  paramsSchema: z.ZodTypeAny;
  fn: (params: string) => unknown;
}

export const AiChatProvider = ({
  children,
  tools,
}: {
  children: ReactNode;
  tools: AiTool[];
}) => {
  const systemPrompt = `You are an AI assistant, use the tools available to you when appropriate. 
    Proactively assist your user, after making a tool call, check if you need to make another tool call based on the result.
  `;
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

    async function handleToolCall(
      chunk: OpenAI.Chat.Completions.ChatCompletionChunk
    ) {
      console.log("tool call detected", chunk.choices[0].delta.tool_calls);

      const chosenTool = tools.find(
        (tool) =>
          tool.name === chunk.choices[0].delta.tool_calls?.[0].function?.name
      );
      if (!chosenTool) {
        console.error("Tool not found:", chunk.choices[0].delta.tool_calls);
        return;
      }
      const params = chunk.choices[0].delta.tool_calls?.[0].function?.arguments;
      if (!params) {
        console.error(
          "No parameters provided for tool call",
          chunk.choices[0].delta.tool_calls
        );
        return;
      }
      try {
        const result = await chosenTool.fn(params);
        // console.log("Tool result:", result);

        const newMessageContent = `Tool: ${
          chosenTool.name
        } Params: ${params} Result: ${JSON.stringify(result)}`;

        setMessages((prev) => {
          const updatedMessages = [...prev];
          const lastIdx = updatedMessages.length - 1;
          updatedMessages[lastIdx] = {
            ...updatedMessages[lastIdx],
            content:
              (updatedMessages[lastIdx].content || "") + newMessageContent,
          };
          return updatedMessages;
        });

        // Send the tool result back to the LLM as a tool message
        const tool_call_id =
          chunk.choices[0].delta.tool_calls?.[0].id ??
          chunk.choices[0].delta.tool_calls?.[0].function?.name ??
          "unknown_tool_call_id";
        const toolMessage: ChatCompletionMessageParam = {
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id,
        };
        setMessages((prev) => [...prev, toolMessage]);
        cancelStream();
      } catch (error) {
        console.error("Error executing tool function:", error);
      }
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
        name: "assistant",
      };
      setMessages((prev) => [...prev, latestMessage]);

      for await (const chunk of newStream) {
        console.log(chunk);
        if (chunk.choices[0].finish_reason) {
          console.log(
            "finishing stream with reason:",
            chunk.choices[0].finish_reason
          );
          return chunk.choices[0].finish_reason;
        } else if (chunk.choices[0].delta.tool_calls?.length) {
          console.log("tool call detected in chunk:", chunk);
          await handleToolCall(chunk);
        } else {
          latestMessage.content += chunk.choices[0].delta.content || "";
          setMessages((prev) => {
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1] = latestMessage;
            return updatedMessages;
          });
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
    messages,
    stream,
    tools,
  ]);

  const sendMessage = async (input: string) => {
    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: input,
      name: "user",
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
