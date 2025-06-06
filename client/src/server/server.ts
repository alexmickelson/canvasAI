import { EventEmitter } from "events";
import compression from "compression";
import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/utils/main";

EventEmitter.defaultMaxListeners = 40;
const app = express();
app.use(compression());

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
    onError({ error, type, path, input }) {
      console.error(
        `[tRPC:${type}] "${String(path)}" failed. Input: ${JSON.stringify(
          input
        )} Error: ${error.message}`
      );
      if (error.cause) {
        console.error(error.cause);
      }
    },
  })
);

const port = parseInt(process.env.PORT || "3000", 10);
app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
