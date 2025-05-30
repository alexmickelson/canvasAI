import type { TRPCRouterRecord } from "@trpc/server";
import { publicProcedure } from "../utils/trpc";
import { z } from "zod";
import { OpenAI } from "openai";
import { ChatOllama } from "@langchain/ollama";
import {
  HumanMessage,
  SystemMessage,
  BaseMessage,
} from "@langchain/core/messages";
import ollama from "ollama";
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
      // return stream;
    }),
  streamOpenAi: publicProcedure
    .input(
      z.object({
        messages: z.array(z.custom<ChatCompletionMessageParam>()),
      })
    )
    .query(async function* ({ input }) {
      const openai = new OpenAI({
        baseURL: ollamaUrl,
        apiKey: "ollama",
      });

      const stream = await openai.chat.completions.create({
        model: "llama3.2",
        messages: input.messages,
        stream: true,
      });

      let textContent = "";
      for await (const chunk of stream) {
        textContent += chunk.choices[0].delta.content || "";
        yield chunk;
      }
      // yield {
      //   type: "final",
      //   content: textContent,
      // }
    }),
} satisfies TRPCRouterRecord;
