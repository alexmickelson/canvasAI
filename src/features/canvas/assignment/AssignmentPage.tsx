import { useParams } from "react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "../../../server/trpc/trpcClient";
import { type FC } from "react";
import DOMPurify from "dompurify";
import {
  SnapshotProvider,
  useSnapshotContext,
} from "../snapshot/SnapshotContext";
import { ChartFromSql } from "../../aiCharting/ChartFromSql";
import { AssignmentPageHeader } from "./AssignmentPageHeader";
import { StudentSubmissionRow } from "./StudentSubmissionRow";

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
          <div className="flex-1">
            <div
              className="canvas-description max-h-[500px] overflow-y-auto bg-gray-950 rounded p-3"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(assignment.description ?? ""),
              }}
            />
          </div>
          <div className="flex-1 max-h-[500px] flex justify-center">
            {selectedSnapshot && (
              <ChartFromSql
                sql={`
                  SELECT
                    CASE
                      WHEN s.score IS NOT NULL AND a.points_possible IS NOT NULL AND a.points_possible > 0 AND ROUND((s.score / a.points_possible) * 100, 1) < 60 THEN '0-59'
                      WHEN s.score IS NOT NULL AND a.points_possible IS NOT NULL AND a.points_possible > 0 AND ROUND((s.score / a.points_possible) * 100, 1) < 80 THEN '60-79'
                      WHEN s.score IS NOT NULL AND a.points_possible IS NOT NULL AND a.points_possible > 0 THEN '80-100'
                      ELSE 'N/A'
                    END AS score_bucket,
                    COUNT(*) AS student_count
                  FROM submissions s
                    JOIN assignments a ON s.assignment_id = a.id
                    JOIN enrollments e ON s.user_id = e.user_id AND a.course_id = e.course_id
                  WHERE s.assignment_id = $<assignmentId>
                    AND s.sync_job_id = $<snapshotId>
                    AND s.score IS NOT NULL
                  GROUP BY score_bucket
                  ORDER BY score_bucket
                `}
                parameters={{
                  assignmentId: assignmentId,
                  snapshotId: selectedSnapshot.id,
                }}
                chartType="pie"
                xField="score_bucket"
                yField="student_count"
                title="Assignment Score Buckets"
                xLabel="Score Bucket"
                yLabel="Student Count"
              />
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {submissions?.map((submission) => (
            <StudentSubmissionRow
              key={submission.id}
              submission={submission}
              assignment={assignment}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssignmentPage;
