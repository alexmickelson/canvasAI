import React from "react";
import { WebSocketProvider } from "./websocket/websocketContext";
import { AiChat } from "./AiChat";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen ">
        <AiChat />
    </div>
  );
}
