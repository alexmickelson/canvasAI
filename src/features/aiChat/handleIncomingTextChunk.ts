import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
} from "openai/resources/index.mjs";

export async function handleIncomingTextChunk(
  chunk: ChatCompletionChunk,
  stream: AsyncIterable<ChatCompletionChunk, void, unknown>,
  setMessages: React.Dispatch<
    React.SetStateAction<ChatCompletionMessageParam[]>
  >
): Promise<ChatCompletionChunk> {
  let currentChunk = chunk;
  let currentMessageId = chunk.id;

  setMessages((prev) => [
    ...prev,
    {
      role: "assistant",
      content: currentChunk.choices[0].delta.content || "",
    },
  ]);
  for await (currentChunk of stream) {
    if (!currentChunk.choices[0]) return currentChunk;

    if (currentChunk.id !== currentMessageId) {
      console.log("detected new message chunk:", currentChunk);
      currentMessageId = currentChunk.id;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: currentChunk.choices[0].delta.content || "",
        },
      ]);
    }

    const deltaContent = currentChunk.choices[0].delta.content || "";
    if (deltaContent) {
      setMessages((prev) => {
        const latestMessage = prev[prev.length - 1];

        return [
          ...prev.slice(0, -1),
          {
            ...latestMessage,
            content: latestMessage.content + deltaContent,
          },
        ];
      });
    }
  }
  return currentChunk;
}
