import { aiRouter } from "../routers/aiRouter";
import { canvasRouter } from "../routers/canvasRouter";
import { greetingRouter } from "../routers/greetings";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  greeting: greetingRouter,
  ai: aiRouter,
  canvas: canvasRouter
});

export type AppRouter = typeof appRouter;
