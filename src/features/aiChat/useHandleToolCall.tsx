import type OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { useCallback, useRef } from "react";
import type { AiTool } from "../../utils/createAiTool";

export function useHandleToolCall({
  tools,
  setMessages,
  cancelStream,
}: {
  tools: AiTool[];
  setMessages: React.Dispatch<
    React.SetStateAction<ChatCompletionMessageParam[]>
  >;
  cancelStream: () => void;
}) {
  const paramsRef = useRef<
    Record<
      string,
      {
        chunks: OpenAI.Chat.Completions.ChatCompletionChunk[];
        functionName: string;
        message: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta;
      }
    >
  >({});

  const executeToolCall = useCallback(
    async (toolId: string) => {
      const toolFunctionName = paramsRef.current[toolId]?.functionName;
      if (!toolFunctionName) {
        console.error(
          "Tool function name is missing for toolId:",
          toolId,
          paramsRef.current[toolId]
        );
        return;
      }
      const chosenTool = tools.find((tool) => tool.name === toolFunctionName);
      if (!chosenTool) {
        console.error("Tool not found:", toolFunctionName);
        return;
      }
      const toolRecord = paramsRef.current[toolId];
      if (!toolRecord) {
        console.error(
          "No chunks provided for tool call",
          toolId,
          toolFunctionName
        );
        return;
      }
      try {
        const paramsString = toolRecord.chunks
          .filter(
            (c) => c.choices[0].delta.tool_calls?.[0]?.function?.arguments
          )
          .map((c) => c.choices[0].delta.tool_calls?.[0]?.function?.arguments)
          .join("");
        console.log("calling with params", paramsString);
        const result = await chosenTool.fn(paramsString);

        console.log("tool result:", result);

        const toolRequestMessage: ChatCompletionMessageParam = {
          role: "assistant",
          content: JSON.stringify({
            id: toolId,
            type: "function",
            function: {
              name: chosenTool.name,
              arguments: paramsString,
            },
          }),
          // name: "assistant",
        };

        // Send the tool result back to the LLM as a tool message
        const toolMessage: ChatCompletionMessageParam = {
          role: "tool",
          content: result,
          tool_call_id: toolId,
        };
        setMessages((prev) => [
          ...prev.slice(0, -1),
          toolRequestMessage,
          toolMessage,
        ]);
        cancelStream();
        // Clear the aggregated params for this tool call
        delete paramsRef.current[toolId];
      } catch (error) {
        console.error("Error executing tool function:", error);
      }
    },
    [cancelStream, setMessages, tools]
  );

  return useCallback(
    async function handleToolCall(
      chunk: OpenAI.Chat.Completions.ChatCompletionChunk
    ) {
      const toolCall = chunk.choices[0].delta.tool_calls?.[0];
      const finishReason = chunk.choices[0].finish_reason;
      if (finishReason === "tool_calls") {
        await executeToolCall(chunk.id);
        return;
      }

      if (!toolCall) {
        console.error("Tool call is missing in chunk:", chunk);
        return;
      }
      // if is first call...
      if (!paramsRef.current[chunk.id]) {
        if (toolCall.function?.name) {
          paramsRef.current[chunk.id] = {
            chunks: [],
            functionName: toolCall.function.name,
            message: chunk.choices[0].delta,
          };
        } else {
          console.error(
            "Tool call function name is missing, cannot create params aggregation object for first streamed response",
            toolCall
          );
          return;
        }
      }
      if (chunk.id) {
        paramsRef.current[chunk.id].chunks.push(chunk);
      } else {
        console.error("Tool call is missing or has no id:", chunk);
      }
    },
    [executeToolCall]
  );
}
