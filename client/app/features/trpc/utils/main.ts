import { aiRouter } from "../routers/aiRouter";
import { greetingRouter } from "../routers/greetings";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  greeting: greetingRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
