import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./app.css";
import { TRPCReactProvider } from "./trpc/trpcClient.tsx";
import { Toaster } from "react-hot-toast";
import { SuspenseAndError } from "./utils/SuspenseAndError.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster />
    <SuspenseAndError>
      <TRPCReactProvider>
        <App />
      </TRPCReactProvider>
    </SuspenseAndError>
  </StrictMode>
);
