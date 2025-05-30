import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useTRPCClient } from "./trpc/trpcClient";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";

interface AiChatContextType {
  messages: ChatCompletionMessageParam[];
  sendMessage: (input: string) => Promise<void>;
}

const AiChatContext = createContext<AiChatContextType | null>(null);

export const AiChatProvider = ({ children }: { children: ReactNode }) => {
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

    const stream = await client.ai.streamOpenAi.query({
      messages: [...messages, userMessage],
    });

    let latestMessage: ChatCompletionMessageParam = {
      role: "assistant",
      content: "",
      name: "assistant",
    };
    setMessages((prev) => [...prev, latestMessage]);

    for await (const chunk of stream) {
      latestMessage.content += chunk.choices[0].delta.content || "";
      setMessages((prev) => {
        const updatedMessages = [...prev];
        updatedMessages[updatedMessages.length - 1] = latestMessage;
        return updatedMessages;
      });
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
