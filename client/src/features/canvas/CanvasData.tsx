import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useTRPC } from "../../server/trpc/trpcClient";
import { CanvasTermComponent } from "./CanvasTermComponent";
import SnapshotManagement from "./SnapshotManagement";

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
      <SnapshotManagement />
      <hr />
      {terms.map((term) => (
        <CanvasTermComponent key={term.id} term={term} />
      ))}

    </div>
  );
}
