import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useTRPC, invalidateQueries } from "../../../server/trpc/trpcClient";
import { useTermContext } from "../termSelection/TermContext";
import type { SyncJob } from "../../../server/services/canvas/canvasSnapshotService";

export default function SnapshotManagementForTerm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { term } = useTermContext();

  // Only fetch snapshots for the selected term
  const { data: snapshots } = useSuspenseQuery(
    trpc.snapshot.getSnapshots.queryOptions()
  );
  const snapshotsForTerm = snapshots.filter(
    (snap: SyncJob) => snap.job_name === term.name
  );

  const runSnapshotMutation = useMutation(
    trpc.snapshot.runSnapshotForTerm.mutationOptions({
      onSuccess: () => {
        invalidateQueries(queryClient, [
          trpc.canvas.courses,
          trpc.canvas.terms,
          trpc.canvas.assignments,
          trpc.canvas.modules,
          trpc.canvas.assignmentSubmissions,
          trpc.canvas.enrollments,
          trpc.snapshot.getSnapshots,
        ]);
      },
    })
  );

  return (
    <div className="p-3 bg-white dark:bg-gray-900 rounded shadow max-w-3xl mx-auto m-2">
      <div>
        <h5 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
          Snapshot History for{" "}
          <span className="text-blue-700 dark:text-blue-300">{term.name}</span>
        </h5>
        <div className="flex flex-col gap-2">
          <div className="flex font-semibold bg-gray-100 dark:bg-gray-800 rounded-t">
            <div className="flex-1 px-3 py-2">Job Name</div>
            <div className="w-28 px-3 py-2">Status</div>
            <div className="w-40 px-3 py-2">Started</div>
            <div className="w-40 px-3 py-2">Completed</div>
            <div className="flex-1 px-3 py-2">Message</div>
          </div>
          {Array.isArray(snapshotsForTerm) && snapshotsForTerm.length > 0 ? (
            snapshotsForTerm.map((snap: SyncJob) => (
              <div
                key={snap.id}
                className="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 items-center"
              >
                <div className="flex-1 px-3 py-2 text-gray-900 dark:text-gray-100 truncate">
                  {snap.job_name}
                </div>
                <div className="w-28 px-3 py-2">
                  <span
                    className={
                      snap.status === "completed"
                        ? "text-green-600 dark:text-green-400"
                        : snap.status === "failed"
                        ? "text-red-600 dark:text-red-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }
                  >
                    {snap.status}
                  </span>
                </div>
                <div className="w-40 px-3 py-2 text-gray-700 dark:text-gray-300 truncate">
                  {snap.started_at
                    ? new Date(snap.started_at).toLocaleString()
                    : "-"}
                </div>
                <div className="w-40 px-3 py-2 text-gray-700 dark:text-gray-300 truncate">
                  {snap.completed_at
                    ? new Date(snap.completed_at).toLocaleString()
                    : "-"}
                </div>
                <div className="flex-1 px-3 py-2 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                  {snap.message || "-"}
                </div>
              </div>
            ))
          ) : (
            <div className="flex text-center text-gray-500 dark:text-gray-400 px-3 py-4">
              <div className="flex-1">No snapshots found.</div>
            </div>
          )}
        </div>
        <form
          className="flex flex-col sm:flex-row gap-2 mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            runSnapshotMutation.mutate({ termName: term.name });
          }}
        >
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            disabled={runSnapshotMutation.isPending}
          >
            {runSnapshotMutation.isPending
              ? "Running..."
              : `Run Snapshot for ${term.name}`}
          </button>
        </form>
      </div>
    </div>
  );
}
