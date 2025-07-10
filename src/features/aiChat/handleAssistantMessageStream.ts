import type { ChatCompletionChunk } from "openai/resources/index.mjs";

export async function handleAssistantMessageStream(
  firstChunk: ChatCompletionChunk,
  stream: AsyncIterable<ChatCompletionChunk, void, unknown>,
  setCurrentMessage: React.Dispatch<React.SetStateAction<string>>
) {
  let incomingMessage = firstChunk.choices[0].delta.content || "";
  setCurrentMessage(incomingMessage);

  for await (const currentChunk of stream) {
    if (!currentChunk.choices[0]) return "";

    if (currentChunk.id !== firstChunk.id) {
      console.error("detected new message chunk:", firstChunk.id, currentChunk);
    } else {
      const deltaContent = currentChunk.choices[0].delta.content || "";
      if (deltaContent) {
        incomingMessage += deltaContent;
        setCurrentMessage(incomingMessage);
      }
    }
  }
  return incomingMessage;
}
