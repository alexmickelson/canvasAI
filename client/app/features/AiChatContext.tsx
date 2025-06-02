import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useTRPCClient } from "./trpc/trpcClient";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import type OpenAI from "openai";
import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import toast from "react-hot-toast";

interface AiChatContextType {
  messages: ChatCompletionMessageParam[];
  sendMessage: (input: string) => Promise<void>;
}

const AiChatContext = createContext<AiChatContextType | null>(null);

export interface AiTool {
  name: string;
  description: string;
  paramsSchema: z.ZodTypeAny;
  fn: (params: string) => any;
}

export const AiChatProvider = ({
  children,
  tools,
}: {
  children: ReactNode;
  tools: AiTool[];
}) => {
  const [messages, setMessages] = useState<ChatCompletionMessageParam[]>([
    { role: "system", content: "You are chatting with an AI.", name: "system" },
  ]);
  const client = useTRPCClient();

  useEffect(() => {
    console.log(messages);
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

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
        console.log("Tool result:", result);

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

      const stream = await client.ai.streamOpenAi.query({
        messages: messages,
        tools: toolsSchema,
      });

      let latestMessage: ChatCompletionMessageParam = {
        role: "assistant",
        content: "",
        name: "assistant",
      };
      setMessages((prev) => [...prev, latestMessage]);

      for await (const chunk of stream) {
        console.log(chunk);
        // if (isCancelled) {
        //   console.log("stream cancelled");
        //   return;
        // } else

        if (chunk.choices[0].finish_reason) {
          // console.log("stream finished", chunk.choices[0].finish_reason);
          return chunk.choices[0].finish_reason;
        }
        if (chunk.choices[0].delta.tool_calls?.length) {
          console.log("tool call chunk", chunk);
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
      })
      .catch((error) => {
        const message = `Error during AI chat stream: ${
          error instanceof Error ? error.message : "An unknown error occurred"
        }`;
        toast.error(message);
        console.error(message);
      });
  }, [messages]);

  const sendMessage = async (input: string) => {
    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: input,
      name: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
  };

  return (
    <AiChatContext.Provider value={{ messages, sendMessage }}>
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
