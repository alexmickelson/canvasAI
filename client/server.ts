import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import morgan from "morgan";
import type { ViteDevServer } from "vite";

const viteDevServer: ViteDevServer | undefined =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const reactRouterHandler = createRequestHandler({
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
    // @ts-expect-error: dynamic import type mismatch, handled at runtime
    : await import("./build/server/index.js") ,
});

const app = express();

app.use(compression());
app.disable("x-powered-by");

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
}

app.use(express.static("build/client", { maxAge: "1h" }));
app.use(morgan("tiny"));

app.all("*", (req: Request, res: Response, next: NextFunction) =>
  reactRouterHandler(req, res, next)
);

const port: number = parseInt(process.env.PORT || "5173", 10);
app.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`)
);
