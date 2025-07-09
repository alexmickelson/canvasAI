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

const aiUrl = process.env.AI_URL;
if (!aiUrl) throw new Error("AI_URL environment variable is not set");
const aiKey = process.env.AI_KEY;
if (!aiKey) throw new Error("AI_KEY environment variable is not set");
const aiModel = process.env.AI_MODEL;
if (!aiModel) throw new Error("AI_MODEL environment variable is not set");

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
        baseURL: aiUrl,
        apiKey: aiKey,
      });

      try {
        const stream = openai.chat.completions.stream({
          model: aiModel,
          messages: input.messages,
          stream: true,
          tool_choice: "auto",
          tools: [...input.tools],
          signal,
        });

        for await (const chunk of stream) {
          if (signal?.aborted) {
            console.log("Stream aborted");
            break;
          }
          // console.log(chunk.choices[0].delta);
          yield chunk;
        }
      } catch (e) {
        console.log("stream config", {
          model: aiModel,
          messages: input.messages,
          stream: true,
          tool_choice: "auto",
          tools: [...input.tools],
          signal,
        });
        throw e;
      } finally {
        console.log("Stream finished, in finally block");
        abortController?.abort();
      }
    }),
} satisfies TRPCRouterRecord;
