import { marked } from "marked";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";

export const Message = ({ msg }: { msg: ChatCompletionMessageParam }) => {
  return (
    <p className={`mb-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
      <strong className="block text-gray-400">{msg.role}:</strong>
      <span className="block text-gray-200">
        {msg.content?.toString().startsWith("<think>") && (
          <details className="mb-2">
            <summary className="cursor-pointer text-gray-400">Thoughts</summary>
            <div
              className="pl-4 text-gray-400"
              dangerouslySetInnerHTML={{
                __html: marked(msg.content.toString()),
              }}
            ></div>
          </details>
        )}
        <span
          dangerouslySetInnerHTML={{
            __html: getMessageContent(msg),
          }}
        />
      </span>
    </p>
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
