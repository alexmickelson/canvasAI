import type OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { AiTool } from "../../utils/createAiTool";
import toast from "react-hot-toast";

export function useHandleToolCall({
  tools,
  setCurrentMessage,
}: {
  tools: AiTool[];
  setCurrentMessage: Dispatch<SetStateAction<string>>;
}) {
  const executeToolCalls = useExecuteToolCalls(tools);

  return useCallback(
    async function (
      chunk: OpenAI.Chat.Completions.ChatCompletionChunk,
      stream: AsyncIterable<
        OpenAI.Chat.Completions.ChatCompletionChunk,
        void,
        unknown
      >
    ) {
      const { error, requestedTools } = await collectFunctionArgsFromChunks(
        chunk,
        stream,
        setCurrentMessage
      );
      console.error("Error collecting function args:", error);
      const results = await executeToolCalls(requestedTools);
      return results

    },
    [executeToolCalls, setCurrentMessage]
  );
}

function useExecuteToolCalls(tools: AiTool[]) {
  return useCallback(
    async (
      requestedTools: Record<string, { args: string; functionName: string }>
    ) => {
      const results = await Promise.all(
        Object.entries(requestedTools).map(
          async ([toolId, { args, functionName }]): Promise<
            ChatCompletionMessageParam[]
          > => {
            const chosenTool = tools.find((tool) => tool.name === functionName);
            if (!chosenTool) {
              console.error("Tool not found:", functionName);
              return [];
            }
            try {
              const result = await chosenTool.fn(args);

              const toolRequestMessage: ChatCompletionMessageParam = {
                role: "assistant",
                tool_calls: [
                  {
                    id: toolId,
                    type: "function",
                    function: {
                      name: chosenTool.name,
                      arguments: args,
                    },
                  },
                ],
              };

              const toolMessage: ChatCompletionMessageParam = {
                role: "tool",
                content: result,
                tool_call_id: toolId,
              };
              return [toolRequestMessage, toolMessage];
            } catch (error) {
              console.error("Error executing tool function:", error);
              toast.error(
                `Error executing tool function ${functionName}: ${
                  typeof error === "object" && error && "message" in error
                    ? (error as { message: string }).message
                    : String(error)
                }`
              );
              throw error;
            }
          }
        )
      );

      return results.flat();
    },
    [tools]
  );
}


function processToolCallChunk(
  chunk: OpenAI.Chat.Completions.ChatCompletionChunk,
  requestedTools: Record<string, { args: string; functionName: string }>,
  currentId: string,
  setCurrentMessage: Dispatch<SetStateAction<string>>
): string {
  const toolCall = chunk.choices[0].delta.tool_calls?.[0];
  if (!toolCall) return currentId;

  if (toolCall.id) {
    console.log(
      "new tool call detected:",
      toolCall.id,
      toolCall.function?.name
    );
    requestedTools[toolCall.id] = {
      args: "",
      functionName: toolCall.function?.name ?? "",
    };
    setCurrentMessage("prepparing to call tool: " + toolCall.function?.name);
    return toolCall.id;
  }

  const newArgs = toolCall.function?.arguments ?? "";
  requestedTools[currentId].args += newArgs;
  return currentId;
}

async function collectFunctionArgsFromChunks(
  chunk: OpenAI.Chat.Completions.ChatCompletionChunk,
  stream: AsyncIterable<
    OpenAI.Chat.Completions.ChatCompletionChunk,
    void,
    unknown
  >,
  setCurrentMessage: Dispatch<SetStateAction<string>>
) {
  let currentChunk = chunk;

  const requestedTools: Record<string, { args: string; functionName: string }> =
    {};

  let currentId = chunk.choices[0].delta.tool_calls?.[0].id;
  if (!currentId) {
    const msg = "Tool call ID is missing in chunk, cannot handle tool call";
    console.error(msg, chunk);
    toast.error(msg);
    return { error: msg, requestedTools: {} };
  }
  currentId = processToolCallChunk(
    chunk,
    requestedTools,
    currentId,
    setCurrentMessage
  );

  for await (currentChunk of stream) {
    if (currentChunk.choices[0].finish_reason === "tool_calls") {
      continue;
    }
    currentId = processToolCallChunk(
      currentChunk,
      requestedTools,
      currentId,
      setCurrentMessage
    );
  }
  return { error: undefined, requestedTools };
}
