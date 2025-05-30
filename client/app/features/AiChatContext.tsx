import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useTRPCClient } from "./trpc/trpcClient";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import type OpenAI from "openai";
import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

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

  const sendMessage = async (input: string) => {
    const userMessage: ChatCompletionMessageParam = {
      role: "user",
      content: input,
      name: "user",
    };
    setMessages((prev) => [...prev, userMessage]);

    const toolsSchema: OpenAI.Chat.Completions.ChatCompletionTool[] = tools.map(
      (tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: zodToJsonSchema(tool.paramsSchema, {
            target: "openAi",
          }),
        },
      })
    );

    const stream = await client.ai.streamOpenAi.query({
      messages: [...messages, userMessage],
      tools: toolsSchema,
    });

    let latestMessage: ChatCompletionMessageParam = {
      role: "assistant",
      content: "",
      name: "assistant",
    };
    setMessages((prev) => [...prev, latestMessage]);

    for await (const chunk of stream) {
      const isToolCall = (chunk.choices[0].delta.tool_calls?.length ?? -1) > 0;

      if (isToolCall) {
        await handleToolCall(chunk, tools, setMessages);
        
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

async function handleToolCall(
  chunk: OpenAI.Chat.Completions.ChatCompletionChunk,
  tools: AiTool[],
  setMessages: React.Dispatch<
    React.SetStateAction<ChatCompletionMessageParam[]>
  >
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

    let latestMessage: ChatCompletionMessageParam = {
      role: "assistant",
      content: `Tool: ${chosenTool.name}\nResult: ${JSON.stringify(result)}`,
    };
    latestMessage.content += `\n\n`;

    setMessages((prev) => {
      const updatedMessages = [...prev];
      updatedMessages[updatedMessages.length - 1] = { ...latestMessage };
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
