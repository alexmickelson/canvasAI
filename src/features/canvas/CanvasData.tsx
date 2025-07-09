import { CanvasTermComponent } from "./components/CanvasTermComponent";
import { SuspenseAndError } from "../../utils/SuspenseAndError";
import SnapshotManagementForTerm from "./snapshot/SnapshotManagementForTerm";
import { useTermContext } from "./termSelection/TermContext";
import { SnapshotProvider } from "./snapshot/SnapshotContext";

export default function CanvasData() {
  const { term } = useTermContext();

  return (
    <div>
      <SnapshotProvider>
        <SuspenseAndError>
          <SnapshotManagementForTerm />
        </SuspenseAndError>
        <div className="px-3">
          <SuspenseAndError>
            <CanvasTermComponent term={term} />
          </SuspenseAndError>
        </div>
      </SnapshotProvider>
    </div>
  );
}
