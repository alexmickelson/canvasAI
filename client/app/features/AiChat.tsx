import { useState } from "react";
import { useTRPC, useTRPCClient } from "./trpc/trpcClient";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { marked } from "marked";

export const AiChat = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatCompletionMessageParam[]>([
    { role: "system", content: "You are chatting with an AI.", name: "system" },
  ]);
  const client = useTRPCClient();

  const handleSend = async () => {
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

    setInput("");
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 h-screen w-196">
      <h1 className="text-2xl font-bold mb-4">AI Chat</h1>
      <div className="w-full bg-gray-800 shadow-md rounded-lg p-4 mb-4 overflow-auto flex-1 flex flex-col-reverse">
        {messages
          .slice()
          .reverse()
          .map((msg, index) => (
        <p
          key={index + "" + msg.content?.toString()}
          className={`mb-2 ${
            msg.role === "user" ? "text-right" : "text-left"
          }`}
        >
          <strong className="block text-gray-400">{msg.role}:</strong>
          <span className="block text-gray-200">
            <span
          dangerouslySetInnerHTML={{
            __html: msg.content ? marked(msg.content.toString()) : "",
          }}
            />
          </span>
        </p>
          ))}
      </div>
      <form
        className="flex items-center"
        onSubmit={async (e) => {
          e.preventDefault();
          await handleSend();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-700 rounded-lg p-2 mr-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
};
