import { useState, type FC } from "react";
import type { CanvasCourse } from "../../server/services/canvas/canvasCourseService";
import { useTRPC } from "../../server/trpc/trpcClient";
import {
  useMutation,
  useSuspenseQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { SuspenseAndError } from "../../utils/SuspenseAndError";
import { CanvasAssignmentComponent } from "../../server/services/canvas/CanvasAssignmentComponent";

export const CanvasCourseComponent: FC<{ course: CanvasCourse }> = ({
  course,
}) => {
  const [showAssignments, setShowAssignments] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: assignments } = useSuspenseQuery(
    trpc.canvas.assignments.queryOptions({ courseId: course.id })
  );

  const { data: modules } = useSuspenseQuery(
    trpc.canvas.modules.queryOptions({ courseId: course.id })
  );

  const syncSubmissionsMutation = useMutation(
    trpc.canvas.syncCourseSubmissions.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.canvas.submissions.queryKey(),
        });
      },
    })
  );

  const assignmentsByModule = modules?.map((module) => {
    const itemsInModule = module.items?.map((item) => item.content_id);
    return {
      module,
      assignments:
        assignments?.filter((assignment) =>
          itemsInModule?.includes(assignment.id)
        ) || [],
    };
  });

  return (
    <>
      <div className="bg-slate-900 m-2 p-2 rounded">
        <div>{course.original_name ?? course.name}</div>
        <button
          className="m-3"
          onClick={() => setShowAssignments(!showAssignments)}
        >
          {showAssignments ? "Hide Assignments" : "Show Assignments"}
        </button>
        <button
          className="m-3"
          onClick={() => {
            console.log(course, course.id);
            syncSubmissionsMutation.mutate({ courseId: course.id });
          }}
          disabled={syncSubmissionsMutation.isPending}
        >
          {syncSubmissionsMutation.isPending
            ? "Syncing..."
            : "Sync Submissions"}
        </button>
        {showAssignments && (
          <>
            {assignmentsByModule?.map(({ module, assignments }) => (
              <div key={module.id} className="module-section">
                <h3 className="module-title">{module.name}</h3>
                <div className="ps-5">
                  {assignments.map((assignment) => (
                    <SuspenseAndError key={assignment.id}>
                      <CanvasAssignmentComponent assignment={assignment} />
                    </SuspenseAndError>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
};
