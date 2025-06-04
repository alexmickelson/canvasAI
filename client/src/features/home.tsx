import { AiChat } from "./AiChat";
import CanvasData from "./canvas/CanvasData";

export default function Home() {
  return (
    <div className="flex h-screen ">
      <div className="flex-1 overflow-auto">
        <CanvasData />
      </div>
      <div className="p-1">
        <AiChat />
      </div>
    </div>
  );
}
