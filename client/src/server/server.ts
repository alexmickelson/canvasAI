import { EventEmitter } from "events";
import compression from "compression";
import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/utils/main";
import cron from "node-cron";
import { snapshotCanvasDataForTerm } from "./services/canvas/canvasSnapshotService";

cron.schedule("0 2 * * *", async () => {
  console.log("running a task every night at 2 am");
  await snapshotCanvasDataForTerm("Spring 2025");
});

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
