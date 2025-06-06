import type { TRPCRouterRecord } from "@trpc/server";
import { publicProcedure } from "../utils/trpc";
import { z } from "zod";
import { OpenAI } from "openai";
import { ChatOllama } from "@langchain/ollama";
import { BaseMessage } from "@langchain/core/messages";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const ollamaUrl = "http://openwebui.bison-python.ts.net:11434/v1";

export const aiRequestSchema = z.object({
  context: z.string(),
  toolDefinitions: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      parameters: z.record(z.any()).optional(),
    })
  ),
});

export const aiRouter = {
  streamLangchain: publicProcedure
    .input(
      z.object({
        messages: z.array(z.custom<BaseMessage>()),
      })
    )
    .query(async function* ({ input }) {
      const model = new ChatOllama({
        model: "llama3.2",
        baseUrl: ollamaUrl,
      });
      console.log("invoking stream");
      const stream = await model.stream(input.messages);

      for await (const chunk of stream) {
        yield chunk;
      }
    }),
  streamOpenAi: publicProcedure
    .input(
      z.object({
        messages: z.array(z.custom<ChatCompletionMessageParam>()),
        tools: z.array(z.custom<OpenAI.Chat.Completions.ChatCompletionTool>()),
      })
    )
    .mutation(async function* ({
      input,
      ctx,
    }: {
      input: {
        messages: ChatCompletionMessageParam[];
        tools: OpenAI.Chat.Completions.ChatCompletionTool[];
      };
      ctx: { signal?: AbortSignal };
    }) {
      const abortController = ctx?.signal ? undefined : new AbortController();
      const signal = ctx?.signal || abortController?.signal;

      const openai = new OpenAI({
        baseURL: ollamaUrl,
        apiKey: "ollama",
      });

      const stream = await openai.chat.completions.stream({
        model: "qwen3:14b",
        messages: input.messages,
        stream: true,
        tool_choice: "auto",
        tools: [...input.tools],
        signal,
      });

      try {
        for await (const chunk of stream) {
          if (signal?.aborted) break;
          yield chunk;
        }
      } finally {
        abortController?.abort();
      }
    }),
} satisfies TRPCRouterRecord;
