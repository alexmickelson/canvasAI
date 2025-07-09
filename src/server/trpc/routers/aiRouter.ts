import type { TRPCRouterRecord } from "@trpc/server";
import { publicProcedure } from "../utils/trpc";
import { z } from "zod";
import { OpenAI } from "openai";
import { ChatOllama } from "@langchain/ollama";
import { BaseMessage } from "@langchain/core/messages";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";

// const ollamaUrl = "http://openwebui.bison-python.ts.net:11434/v1";
const ollamaUrl = "http://openwebui.bison-python.ts.net:11434/v1";
import dotenv from "dotenv";

dotenv.config();

const openaiUrl = process.env.OPENAI_URL;
if (!openaiUrl) throw new Error("OPENAI_URL environment variable is not set");
const openaiKey = process.env.OPENAI_KEY;
if (!openaiKey) throw new Error("OPENAI_KEY environment variable is not set");

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

      // const openai = new OpenAI({
      //   baseURL: ollamaUrl,
      //   apiKey: "ollama",
      // });

      const openai = new OpenAI({
        baseURL: openaiUrl,
        apiKey: openaiKey,
      });

      const stream = await openai.chat.completions.stream({
        // model: "llama3.2:latest",
        // model: "deepseek-r1:14b",
        model: "qwen3:14b",
        messages: input.messages,
        stream: true,
        tool_choice: "auto",
        tools: [...input.tools],
        signal,
      });

      try {
        for await (const chunk of stream) {
          if (signal?.aborted) {
            console.log("Stream aborted");
            break;
          }
          // console.log(chunk.choices[0].delta);
          yield chunk;
        }
      } finally {
        console.log("Stream finished, in finally block");
        abortController?.abort();
      }
    }),
} satisfies TRPCRouterRecord;
