import { marked } from "marked";
import type {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";
import type { DetailsHTMLAttributes, HTMLAttributes, FC } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Collapse } from "../canvas/components/modules/Collapse";

export const Message = ({ msg }: { msg: ChatCompletionMessageParam }) => {
  if (msg.role === "tool") {
    return <ToolResult content={msg.content} />;
  }

  if (msg.role === "system") {
    return <SystemMessage msg={msg} />;
  }

  return (
    <div
      className={`mb-2 min-h-16 ${
        msg.role === "user" ? "text-right" : "text-left"
      }`}
    >
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

        {msg.role === "assistant" && (msg.tool_calls || []).length > 0 ? (
          <ToolMessage msg={msg as ChatCompletionMessage} />
        ) : (
          <div
            dangerouslySetInnerHTML={{
              __html: getMessageContent(msg),
            }}
          />
        )}
      </div>
    </div>
  );
};

const components = {
  details(props: DetailsHTMLAttributes<HTMLDetailsElement>) {
    // ReactMarkdown passes children as an array, so we need to handle that
    return <details {...props}>{props.children}</details>;
  },
  summary(props: HTMLAttributes<HTMLElement>) {
    return <summary {...props}>{props.children}</summary>;
  },
};
const SystemMessage: FC<{ msg: ChatCompletionMessageParam }> = ({ msg }) => {
  const content = msg.content?.toString() || "";
  return (
    <div className="p-2 my-2 text-left text-gray-300">
      <span className="font-semibold text-purple-400">System:</span>{" "}
      <ReactMarkdown
        components={components}
        skipHtml={false}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
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

const ToolResult: FC<{ content: unknown }> = ({ content }) => {
  const parsedContent: unknown =
    typeof content === "string"
      ? (() => {
          try {
            return JSON.parse(content);
          } catch {
            return content;
          }
        })()
      : content;
  return (
    <div className="bg-gray-800 rounded p-2 my-2 text-left">
      <div>
        <span className="font-semibold text-blue-400">Tool Call Result</span>
      </div>
      <div className="mt-2">
        <Collapse
          header={
            <span className="font-semibold text-yellow-400">Result:</span>
          }
        >
          <div className="max-h-96 overflow-y-auto ">
            <pre className="unstyled font-mono bg-slate-900 rounded text-yellow-300 whitespace-pre-wrap break-all">
              {typeof parsedContent === "object" && parsedContent !== null
                ? JSON.stringify(parsedContent, null, 2)
                : String(parsedContent)}
            </pre>
          </div>
        </Collapse>
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
