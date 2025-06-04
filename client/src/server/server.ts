import compression from "compression";
import express from "express";
import { appRouter } from "../features/trpc/utils/main";
import * as trpcExpress from "@trpc/server/adapters/express";

const app = express();
app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  })
);

app.use(compression());

const port: number = parseInt(process.env.PORT || "3000", 10);
app.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`)
);
