import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useTRPC } from "../trpc/trpcClient";

export default function CanvasData() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(trpc.canvas.courses.queryOptions());
  const syncMutation = useMutation(
    trpc.canvas.sync.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.canvas.courses.pathKey(),
        }),
    })
  );
  return (
    <div>
      {data.map((course) => (
        <div key={course.id}>
          <div>
            {course.name} - {course.id}
          </div>
        </div>
      ))}
      <button
        className="mt-4 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition disabled:opacity-50"
        onClick={() => {
          console.log("click");
          syncMutation.mutate();
        }}
        disabled={syncMutation.isPending}
      >
        {syncMutation.isPending ? "Syncing..." : "Sync Canvas"}
      </button>
    </div>
  );
}
