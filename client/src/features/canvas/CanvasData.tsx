import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useTRPC } from "../trpc/trpcClient";
import { CanvasCourseComponent } from "./CanvasCourseComponent";

export default function CanvasData() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: courses } = useSuspenseQuery(trpc.canvas.courses.queryOptions());
  const syncMutation = useMutation(
    trpc.canvas.sync.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.canvas.courses.pathKey(),
        }),
    })
  );

  const currentCoruses = courses.filter(c => c.workflow_state === "available");
  return (
    <div>
      {currentCoruses.map((course) => (
        <CanvasCourseComponent key={course.id} course={course} />
      ))}
      <button
        className="mt-4 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition disabled:opacity-50"
        onClick={() => {
          syncMutation.mutate();
        }}
        disabled={syncMutation.isPending}
      >
        {syncMutation.isPending ? "Syncing..." : "Sync Canvas"}
      </button>
    </div>
  );
}
