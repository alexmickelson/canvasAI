import { marked } from "marked";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { useEffect, useState } from "react";

export const Message = ({ msg }: { msg: ChatCompletionMessageParam }) => {
  const [first, setFirst] = useState(false); // client side hack
  useEffect(() => {
    setFirst(true);
  });
  return (
    <div
      className={`mb-2 min-h-16 flex-col ${
        msg.role === "user" ? "text-right" : "text-left"
      }`}
    >
      {first && (
        <>
          <div className="text-gray-400">{msg.role}:</div>
          <div className="text-gray-200">
            {msg.content?.toString().startsWith("<think>") && (
              <details className="mb-2">
                <summary className="cursor-pointer text-gray-400">
                  Thoughts
                </summary>
                <div
                  className="pl-4 text-gray-400"
                  dangerouslySetInnerHTML={{
                    __html: marked(msg.content.toString()),
                  }}
                ></div>
              </details>
            )}
            <div
              dangerouslySetInnerHTML={{
                __html: getMessageContent(msg),
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

const getMessageContent = (msg: ChatCompletionMessageParam) => {
  const hasThinking = msg.content?.toString().includes("<think>");
  const isDoneThinking = msg.content?.toString().includes("</think>");

  if (!msg.content) return "";
  if (hasThinking && !isDoneThinking) {
    return "";
  }
  if (hasThinking && isDoneThinking) {
    const content = msg.content.toString().split("</think>")[1] || "";
    return marked(content);
  }

  return marked(msg.content.toString());
};
