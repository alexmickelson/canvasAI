import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";
import {
  type RefObject,
  type Dispatch,
  type SetStateAction,
  useCallback,
} from "react";
import zodToJsonSchema from "zod-to-json-schema";
import { useTRPCClient } from "../../server/trpc/trpcClient";
import type { AiTool } from "../../utils/createAiTool";
import { handleAssistantMessageStream } from "./handleAssistantMessageStream";
import { useHandleToolCall } from "./useHandleToolCall";

export const useHandleStream = ({
  tools,
  streamRef,
  setMessages,
  ac,
  setCurrentMessage,
}: {
  tools: AiTool[];
  streamRef: RefObject<AsyncIterable<ChatCompletionChunk> | null>;
  setMessages: Dispatch<SetStateAction<ChatCompletionMessageParam[]>>;
  ac: RefObject<AbortController>;
  setCurrentMessage: Dispatch<SetStateAction<string>>;
}) => {
  const client = useTRPCClient();
  const handleToolCallStream = useHandleToolCall({
    tools,
    setCurrentMessage,
  });

  const handleStream = useCallback(
    async (messages: ChatCompletionMessageParam[]) => {
      const toolsSchema: ChatCompletionTool[] = tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: zodToJsonSchema(tool.paramsSchema, {
            target: "openAi",
          }),
        },
      }));

      if (streamRef.current) {
        console.warn("Stream is already in progress, not making new stream.");
        return;
      } else {
        console.log("starting stream with messages:", messages);
      }

      const newStream = await client.ai.streamOpenAi.mutate(
        {
          messages: messages,
          tools: toolsSchema,
        },
        {
          signal: ac.current.signal,
        }
      );
      streamRef.current = newStream;

      console.log("starting async iterator for stream type detection");
      const { type, chunk } = await getStreamType(newStream);
      if (!type) {
        console.error("Could not determine stream type");
        return;
      }

      if (type === "tool_call") {
        console.log("Handling tool call stream");
        const toolCallMessages = await handleToolCallStream(chunk, newStream);
        setMessages((prev) => [...prev, ...toolCallMessages]);
      } else if (type === "assistant_message") {
        console.log("Handling assistant message stream");
        const assistantMessage = await handleAssistantMessageStream(
          chunk,
          newStream,
          setCurrentMessage
        );
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: assistantMessage,
          },
        ]);
      } else {
        console.error(
          "Received chunk without tool calls or assistant message:",
          chunk
        );
      }
      setCurrentMessage("");
    },
    [
      ac,
      client.ai.streamOpenAi,
      handleToolCallStream,
      setCurrentMessage,
      setMessages,
      streamRef,
      tools,
    ]
  );

  return { handleStream };
};

async function getStreamType(stream: AsyncIterable<ChatCompletionChunk>) {
  const reader = stream[Symbol.asyncIterator]();
  let chunkResult = await reader.next();

  while (true) {
    if (chunkResult.done) break;
    const chunk = chunkResult.value;
    console.log("detecting stream type", chunk);

    if (
      chunk.choices[0]?.delta.tool_calls?.length ||
      chunk.choices[0]?.finish_reason === "tool_calls"
    ) {
      return { type: "tool_call", chunk };
    } else if (chunk.choices[0]?.delta.content) {
      return {
        type: "assistant_message",
        chunk,
      };
    }
    chunkResult = await reader.next();
  }
  console.error(chunkResult);
  throw new Error("No valid chunk found in stream");
}
