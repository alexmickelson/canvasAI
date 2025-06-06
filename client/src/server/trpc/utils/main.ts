import { aiRouter } from "../routers/aiRouter";
import { canvasRouter } from "../routers/canvasRouter";
import { dbRouter } from "../routers/dbRouter";
import { greetingRouter } from "../routers/greetings";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  greeting: greetingRouter,
  ai: aiRouter,
  canvas: canvasRouter,
  db: dbRouter,
});

export type AppRouter = typeof appRouter;
