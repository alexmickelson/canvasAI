import { marked } from "marked";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { useEffect, useState, type FC } from "react";

export const Message = ({ msg }: { msg: ChatCompletionMessageParam }) => {
  const [first, setFirst] = useState(false); // client side hack
  useEffect(() => {
    setFirst(true);
  }, []);
  const content = msg.content?.toString() || "";
  const toolMatch = content.match(
    /Tool:\s*(.+?)\s+Params:\s*(.+?)\s+Result:\s*(.+)/s
  );
  const [, toolName, params, result] = toolMatch ?? ["", "", "", ""];

  if (msg.role === "tool") {
    return (
      <>
        tool call
        <br />
        {msg.content?.toString() || ""}
      </>
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

            {toolMatch ? (
              <div className="bg-gray-800 rounded p-2 my-2 text-left">
                <div>
                  <span className="font-semibold text-blue-400">Tool:</span>{" "}
                  {toolName}
                </div>
                <div>
                  <span className="font-semibold text-green-400">Params:</span>{" "}
                  {params}
                </div>
                <div>
                  <span className="font-semibold text-yellow-400">Result:</span>{" "}
                  {(() => {
                    try {
                      const unescapedResult = JSON.parse(result);
                      const parsedResult = Array.isArray(unescapedResult)
                        ? unescapedResult
                        : JSON.parse(unescapedResult);
                      return (
                        <pre className="bg-gray-900 p-2 rounded text-yellow-300">
                          {JSON.stringify(parsedResult, null, 2)}
                        </pre>
                      );
                    } catch {
                      return result;
                    }
                  })()}
                </div>
              </div>
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
