import { useSuspenseQuery } from "@tanstack/react-query";
import type { FC } from "react";
import { useSnapshotContext } from "../snapshot/SnapshotContext";
import { useTRPC } from "../../../server/trpc/trpcClient";
import { Link } from "react-router";

export const AssignmentPageHeader: FC<{ assignmentId: number }> = ({
  assignmentId,
}) => {
  const { selectedSnapshot } = useSnapshotContext();
  const trpc = useTRPC();
  const { data: assignment } = useSuspenseQuery(
    trpc.canvas.assignment.queryOptions({
      assignmentId: assignmentId,
      snapshotId: selectedSnapshot?.id,
    })
  );

  const { data: allAssignments } = useSuspenseQuery(
    trpc.canvas.assignments.queryOptions({
      courseId: assignment.course_id,
      snapshotId: selectedSnapshot?.id,
    })
  );

  let prevAssignment, nextAssignment;
  if (assignment && allAssignments) {
    const idx = allAssignments.findIndex((a) => a.id === assignment.id);
    prevAssignment = idx > 0 ? allAssignments[idx - 1] : undefined;
    nextAssignment =
      idx >= 0 && idx < allAssignments.length - 1
        ? allAssignments[idx + 1]
        : undefined;
  }

  return (
    <div className="flex justify-between p-3 gap-4 items-center">
      {prevAssignment && (
        <Link
          to={`/assignment/${prevAssignment.id}`}
          className="text-blue-400 hover:underline"
        >
          ← Previous: {prevAssignment.name}
        </Link>
      )}
      <h1 className="">{assignment.name}</h1>
      {nextAssignment && (
        <Link
          to={`/assignment/${nextAssignment.id}`}
          className="text-blue-400 hover:underline"
        >
          Next: {nextAssignment.name} →
        </Link>
      )}
    </div>
  );
};
