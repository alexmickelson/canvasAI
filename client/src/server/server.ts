import compression from "compression";
import express from "express";
import { appRouter } from "../trpc/utils/main";
import * as trpcExpress from "@trpc/server/adapters/express";

const app = express();
app.use(compression());

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
    onError({ error, type, path, input, ctx: _ctx }) {
      // 1) Basic console.error
      console.error(
        `[tRPC:${type}] "${String(path)}" failed. ` +
          `Input: ${JSON.stringify(input)} ` +
          `Error: ${error.message}`
      );
      if (error.cause) {
        console.error(error.cause);
      }
    },
  })
);

const port: number = parseInt(process.env.PORT || "3000", 10);
app.listen(port, () => console.log(`Express server listening at port ${port}`));
