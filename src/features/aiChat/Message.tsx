import { marked } from "marked";
import type {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";
import { useEffect, useState, type FC } from "react";

export const Message = ({ msg }: { msg: ChatCompletionMessageParam }) => {
  const [first, setFirst] = useState(false); // client side hack
  useEffect(() => {
    setFirst(true);
  }, []);

  const isToolCall =
    msg.role === "assistant" && (msg.tool_calls || []).length > 0;

  if (msg.role === "tool") {
    let parsedContent: unknown = msg.content;
    try {
      parsedContent =
        typeof msg.content === "string" ? JSON.parse(msg.content) : msg.content;
    } catch {
      // fallback to raw content
    }
    return (
      <div className="bg-gray-800 rounded p-2 my-2 text-left">
        <div>
          <span className="font-semibold text-blue-400">Tool Call Result</span>
        </div>
        <div className="mt-2">
          <span className="font-semibold text-yellow-400">Result:</span>{" "}
          <pre className="bg-gray-900 p-2 rounded text-yellow-300 whitespace-pre-wrap break-all">
            {typeof parsedContent === "object" && parsedContent !== null
              ? JSON.stringify(parsedContent, null, 2)
              : String(parsedContent)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mb-2 min-h-16 ${
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
                  <ThinkingSpinner content={msg.content?.toString()} />
                </summary>
                <div
                  className="pl-4 text-gray-400"
                  dangerouslySetInnerHTML={{
                    __html: marked(msg.content.toString().split("</think>")[0]),
                  }}
                ></div>
              </details>
            )}

            {isToolCall ? (
              <ToolMessage msg={msg as ChatCompletionMessage} />
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html: getMessageContent(msg),
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

const ToolMessage: FC<{ msg: ChatCompletionMessage }> = ({ msg }) => {
  if (!msg.tool_calls || !msg.tool_calls?.length)
    return <div>impropper tool call format</div>;

  return (
    <div className="bg-gray-800 rounded p-2 my-2 text-left">
      <div>
        <span className="font-semibold text-blue-400">Tool:</span>{" "}
        {msg.tool_calls?.[0]?.function?.name}
      </div>
      <div>
        <span className="font-semibold text-green-400">Params:</span>{" "}
        {msg.tool_calls?.[0]?.function?.arguments}
      </div>
      <div>
        <span className="font-semibold text-yellow-400">Result:</span>{" "}
        {msg.content}
      </div>
    </div>
  );
};

const ThinkingSpinner: FC<{ content: string }> = ({ content }) => {
  if (content.includes("</think>")) return <></>;
  return (
    <span className="ml-2 align-middle">
      <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
    </span>
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
