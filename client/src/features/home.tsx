import { AiChat } from "./AiChat";
import CanvasData from "./canvas/CanvasData";

export default function Home() {
  return (
    <div className="flex h-screen ">
      home here
      <div className="flex-1">
        <CanvasData />
      </div>
      <div className="p-1">
        <AiChat />
      </div>
    </div>
  );
}
