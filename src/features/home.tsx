import CanvasData from "./canvas/CanvasData";
import { TermProvider } from "./canvas/termSelection/TermContext";

export default function Home() {
  return (
    <TermProvider>
      <CanvasData />
    </TermProvider>
  );
}
