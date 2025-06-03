import React from "react";
import { WebSocketProvider } from "./websocket/websocketContext";
import { AiChat } from "./AiChat";

export default function Home() {
  return (
    <div className="flex min-h-screen ">
      <div className="flex-1">
        other content
      </div>
      <AiChat />
    </div>
  );
}
