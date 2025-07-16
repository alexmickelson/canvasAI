import { CanvasTermComponent } from "./components/CanvasTermComponent";
import { SuspenseAndError } from "../../utils/SuspenseAndError";
import SnapshotManagementForTerm from "./snapshot/SnapshotManagementForTerm";
import { useTermContext } from "./termSelection/TermContext";
import { SnapshotProvider } from "./snapshot/SnapshotContext";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "../../server/trpc/trpcClient";
import { Link } from "react-router";

export default function CanvasData() {
  const { term } = useTermContext();
  const trpc = useTRPC();
  const { data: terms } = useSuspenseQuery(trpc.canvas.terms.queryOptions());

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
        <div className="flex flex-wrap gap-4 p-4">
          {terms.map((t) => (
            <Link
              key={t.id}
              to={`/term/${t.name}`}
              className={`
                cursor-pointer rounded-lg border p-4 shadow transition-colors duration-150 min-w-[160px] text-center select-none 
              border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700
              `}
            >
              {t.name}
            </Link>
          ))}
        </div>
      </SnapshotProvider>
    </div>
  );
}
