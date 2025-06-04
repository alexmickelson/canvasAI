import { useState, type FC } from "react";
import type { CanvasCourse } from "../../services/canvas/canvasCourseService";
import { useTRPC } from "../../trpc/trpcClient";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import type { CanvasAssignment } from "../../services/canvas/canvasAssignmentService";

export const CanvasCourseComponent: FC<{ course: CanvasCourse }> = ({
  course,
}) => {
  const [showAssignments, setShowAssignments] = useState(false);
  const trpc = useTRPC();
  const { data: assignments } = useSuspenseQuery(
    trpc.canvas.assignments.queryOptions({ courseId: course.id })
  );

  const { data: modules } = useSuspenseQuery(
    trpc.canvas.modules.queryOptions({ courseId: course.id })
  );

  const syncSubmissionsMutation = useMutation(
    trpc.canvas.syncCourseSubmissions.mutationOptions()
  );

  
  const assignmentsByModule = modules?.map((module) => ({
    module,
    assignments:
    assignments?.filter(
      (assignment) => assignment.context_module_id === module.id
    ) || [],
  }));
  
  console.log("modules",assignments, assignmentsByModule);

  return (
    <>
      <div>
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
                {assignments.map((assignment) => (
                  <CanvasAssignmentComponent
                    key={assignment.id}
                    assignment={assignment}
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
};

const CanvasAssignmentComponent: FC<{ assignment: CanvasAssignment }> = ({
  assignment,
}) => {
  return (
    <div>
      <div>{assignment.name}</div>
      <div className="ms-4">
        <p>Due: {assignment.due_at}</p>
        <p>Points: {assignment.points_possible}</p>
      </div>
    </div>
  );
};
