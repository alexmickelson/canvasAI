import { useState } from "react";
import { marked } from "marked";
import { AiChatProvider, useAiChat } from "./AiChatContext";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";

export const AiChat = () => {
  return (
    <AiChatProvider
      tools={[
        {
          name: "set_title",
          description: "Set the title of the chat",
          paramsSchema: z.object({ title: z.string() }),
          fn: (params: string) => {
            const parsed = z.object({ title: z.string() }).parse(JSON.parse(params));
            console.log("Setting title with params:", parsed.title);
            return `Title set to: ${parsed.title}`;
          },
        },
      ]}
    >
      <ChatDisplay />
    </AiChatProvider>
  );
};

const ChatDisplay = () => {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useAiChat();

  const handleSend = async () => {
    await sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 h-screen w-196">
      <h1 className="text-2xl font-bold mb-4">AI Chat</h1>
      <div className="w-full shadow-md rounded-lg p-4 mb-4 overflow-auto flex-1 flex flex-col-reverse">
        {messages
          .slice()
          .reverse()
          .map((msg: ChatCompletionMessageParam, index: number) => (
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
        className="flex items-center w-full"
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
