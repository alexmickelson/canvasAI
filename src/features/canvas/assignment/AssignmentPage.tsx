import { useParams } from "react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "../../../server/trpc/trpcClient";
import { type FC } from "react";
import {
  SnapshotProvider,
  useSnapshotContext,
} from "../snapshot/SnapshotContext";
import { describeTimeDifference } from "../../../utils/timeUtils";
import { ChartFromSql } from "../../aiCharting/ChartFromSql";
import { AssignmentPageHeader } from "./AssignmentPageHeader";

const AssignmentPage = () => {
  const { assignmentId } = useParams();

  if (!assignmentId) {
    return <div>Assignment ID is missing in the query string.</div>;
  }

  return (
    <SnapshotProvider>
      <InnerAssignmentPage assignmentId={parseInt(assignmentId)} />
    </SnapshotProvider>
  );
};

const InnerAssignmentPage: FC<{ assignmentId: number }> = ({
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
  const { data: submissions } = useSuspenseQuery(
    trpc.canvas.assignmentSubmissions.queryOptions({
      assignmentId: assignment.id,
    })
  );

  if (!assignment) {
    return <div>Loading assignment...</div>;
  }
  return (
    <div>
      <AssignmentPageHeader assignmentId={assignmentId} />
      <div className="bg-slate-900 p-2 rounded">
        <div className="flex gap-3">
          <div className="flex-1"></div>
          <div className="flex-1">
            {selectedSnapshot && (
              <ChartFromSql
                sql={`
                  SELECT
                    s.id,
                    s.score,
                    a.points_possible,
                    CASE
                      WHEN s.score IS NOT NULL AND a.points_possible IS NOT NULL AND a.points_possible > 0
                      THEN ROUND((s.score / a.points_possible) * 100, 1)
                      ELSE NULL
                    END AS percent_score,
                    s.user_id,
                    e.user->>'name' AS student_name
                  FROM submissions s
                    JOIN assignments a ON s.assignment_id = a.id
                    JOIN enrollments e ON s.user_id = e.user_id AND a.course_id = e.course_id
                  WHERE s.assignment_id = ${assignmentId}
                    AND s.sync_job_id = ${selectedSnapshot.id}
                    AND s.score IS NOT NULL
                `}
                chartType="bar"
                xField="student_name"
                yField="percent_score"
                title="Assignment Score Ratio (%)"
                xLabel="Student Name"
                yLabel="Score (%)"
              />
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {submissions?.map((submission) => (
            <div
              key={submission.id}
              className="submission-details bg-gray-700 p-3 rounded mt-2 min-w-60"
            >
              <p className="">{submission.user}</p>

              <p className="">
                {submission.score != null && assignment.points_possible
                  ? `${Math.round(
                      (submission.score / assignment.points_possible) * 100
                    )}%`
                  : "N/A"}{" "}
                <span className="text-slate-400"> points</span>
              </p>
              <p className=" text-gray-400">
                {submission.submitted_at
                  ? new Date(submission.submitted_at).toLocaleString(
                      undefined,
                      {
                        weekday: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : "N/A"}
              </p>
              <p className=" ">
                {submission.submitted_at &&
                  assignment.due_at &&
                  describeTimeDifference(
                    submission.submitted_at,
                    assignment.due_at
                  )}
              </p>
              <p className="">{submission.workflow_state}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssignmentPage;
