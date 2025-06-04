import type { TRPCRouterRecord } from "@trpc/server";
import { publicProcedure } from "../utils/trpc";

export const greetingRouter = {
  hello: publicProcedure.query(() => {
    return "hello world";
  }),
  iterable: publicProcedure.query(async function* () {
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      yield i;
    }
  }),
} satisfies TRPCRouterRecord;
