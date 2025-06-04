import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./app.css";
import { TRPCReactProvider } from "./features/trpc/trpcClient.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TRPCReactProvider>
      <App />
    </TRPCReactProvider>
  </StrictMode>
);
