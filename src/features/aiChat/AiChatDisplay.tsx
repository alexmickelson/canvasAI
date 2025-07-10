import { useState, type FC, useRef, useEffect, useMemo } from "react";
import { useAiChat } from "./AiChatContext";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { FaStopCircle } from "react-icons/fa";
import { Message } from "./Message";

export const AiChatDisplay: FC<{ title: string }> = ({ title }) => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("aiChatInputHistory") || "[]");
    } catch {
      return [];
    }
  });
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const { messages, sendMessage, cancelStream, isStreaming } = useAiChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const orderedMessages = useMemo(() => messages.slice().reverse(), [messages]);

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 150;

    setIsAutoScrollEnabled(isAtBottom);
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    setHistoryIndex(null);
  };

  useEffect(() => {
    if (isAutoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAutoScrollEnabled]);

  return (
    <div className="flex flex-col items-center p-1 bg-gray-900 h-full w-full rounded-lg">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className={
          "w-full shadow-md rounded-lg p-2 mb-4 flex-1 " + " overflow-y-auto "
        }
      >
        <div className="flex flex-col-reverse">
          <div ref={messagesEndRef} />
          {orderedMessages.map(
            (msg: ChatCompletionMessageParam, index: number) => (
              <Message key={index} msg={msg} />
            )
          )}
        </div>
      </div>
      <form
        className="flex items-center w-full"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!isStreaming && input.trim()) {
            await sendMessage(input);
            const newHistory = [
              input,
              ...history.filter((h) => h !== input),
            ].slice(0, 50);
            setHistory(newHistory);
            localStorage.setItem(
              "aiChatInputHistory",
              JSON.stringify(newHistory)
            );
            setInput("");
            setHistoryIndex(null);
          }
        }}
      >
        <textarea
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-700 rounded-lg p-2 mr-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              if (history.length === 0) return;
              if (historyIndex === null) {
                setHistoryIndex(0);
                setInput(history[0]);
              } else if (historyIndex < history.length - 1) {
                setHistoryIndex(historyIndex + 1);
                setInput(history[historyIndex + 1]);
              }
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              if (historyIndex === null) return;
              if (historyIndex > 0) {
                setHistoryIndex(historyIndex - 1);
                setInput(history[historyIndex - 1]);
              } else {
                setHistoryIndex(null);
                setInput("");
              }
            } else if (e.key === "Enter") {
              const textarea = e.target as HTMLTextAreaElement;
              if (e.shiftKey) {
                e.preventDefault();
                const cursorPosition = textarea.selectionStart;
                const newValue =
                  input.slice(0, cursorPosition) +
                  "\n" +
                  input.slice(cursorPosition);
                setInput(newValue);
                textarea.value = newValue;
                textarea.selectionStart = textarea.selectionEnd =
                  cursorPosition + 1;
              } else {
                e.preventDefault();
                if (!isStreaming && input.trim()) {
                  sendMessage(input).then(() => {
                    const newHistory = [
                      input,
                      ...history.filter((h) => h !== input),
                    ].slice(0, 50);
                    setHistory(newHistory);
                    localStorage.setItem(
                      "aiChatInputHistory",
                      JSON.stringify(newHistory)
                    );
                    setInput("");
                    setHistoryIndex(null);
                  });
                }
              }
            }
          }}
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              cancelStream();
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
          >
            <FaStopCircle className="mr-2" /> Stop
          </button>
        ) : (
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
};
