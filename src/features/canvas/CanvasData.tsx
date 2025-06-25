import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useTRPC } from "../../server/trpc/trpcClient";
import { CanvasTermComponent } from "./components/CanvasTermComponent";
import { SuspenseAndError } from "../../utils/SuspenseAndError";
import SnapshotManagement from "./snapshot/SnapshotManagement";
import { Collapse } from "./components/modules/Collapse";

export default function CanvasData() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: terms } = useSuspenseQuery(trpc.canvas.terms.queryOptions());

  const syncMutation = useMutation(
    trpc.canvas.sync.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.canvas.courses.pathKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.canvas.terms.pathKey(),
        });
      },
    })
  );

  const mostRecentTerm = terms
    .filter((term) => term.name.toLowerCase() !== "the end of time")
    .sort((a, b) => {
      const aDate = a.end_at ? new Date(a.end_at).getTime() : 0;
      const bDate = b.end_at ? new Date(b.end_at).getTime() : 0;
      return bDate - aDate;
    })[0];

  return (
    <div>
      <button
        className="mt-4 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition disabled:opacity-50"
        onClick={() => {
          syncMutation.mutate();
        }}
        disabled={syncMutation.isPending}
      >
        {syncMutation.isPending ? "Syncing..." : "Sync courses and terms"}
      </button>
      <SuspenseAndError>
        <SnapshotManagement />
      </SuspenseAndError>
      <div className="px-3">
        <SuspenseAndError>
          <CanvasTermComponent term={mostRecentTerm} />

          <div className="mt-4 bg-slate-900 rounded">
            <Collapse header={<span>Show all terms</span>}>
              <div className=" bg-slate-900 m-2 rounded ">
                {terms.map((term) => (
                  <CanvasTermComponent key={term.id} term={term} />
                ))}
              </div>
            </Collapse>
          </div>
        </SuspenseAndError>
      </div>
    </div>
  );
}
