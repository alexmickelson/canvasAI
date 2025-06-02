import { use, useState, type FC } from "react";
import { marked } from "marked";
import { AiChatProvider, useAiChat } from "./AiChatContext";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { set, z } from "zod";
import { Message } from "./Message";

export const AiChat = () => {
  const [title, setTitle] = useState("AI Chat");
  return (
    <AiChatProvider
      tools={[
        {
          name: "set_title",
          description: "Set the title of the chat",
          paramsSchema: z.object({ title: z.string() }),
          fn: (params: string) => {
            const parsed = z
              .object({ title: z.string() })
              .parse(JSON.parse(params));
            setTitle(parsed.title);
            console.log("Setting title with params:", parsed.title);
            return `Title set to: ${parsed.title}`;
          },
        },
      ]}
    >
      <ChatDisplay title={title} />
    </AiChatProvider>
  );
};

const ChatDisplay: FC<{ title: string }> = ({ title }) => {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useAiChat();

  const handleSend = async () => {
    await sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 h-screen w-196">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="w-full shadow-md rounded-lg p-4 mb-4 overflow-auto flex-1 flex flex-col-reverse">
        {messages
          .slice()
          .reverse()
          .map((msg: ChatCompletionMessageParam, index: number) => (
            <Message key={index} msg={msg} />
          ))}
      </div>
      <form
        className="flex items-center w-full"
        onSubmit={async (e) => {
          e.preventDefault();
          await handleSend();
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-700 rounded-lg p-2 mr-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={2}
          onKeyDown={async (e) => {
            if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) {
              e.preventDefault();
              await handleSend();
            }
          }}
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
