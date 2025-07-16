import type { FC } from "react";
import type { CanvasAssignment } from "../../../server/services/canvas/canvasAssignmentService";
import type { CanvasSubmission } from "../../../server/services/canvas/canvasSubmissionsService";
import { describeTimeDifference } from "../../../utils/timeUtils";

export const StudentSubmissionRow: FC<{
  submission: CanvasSubmission;
  assignment: CanvasAssignment;
}> = ({ submission, assignment }) => {
  const percent =
    submission.score != null && assignment.points_possible
      ? Math.round((submission.score / assignment.points_possible) * 100)
      : null;

  const barColor =
    percent == null
      ? "bg-gray-400"
      : percent < 60
      ? "bg-red-500"
      : percent < 80
      ? "bg-yellow-400"
      : "bg-green-500";

  return (
    <div
      key={submission.id}
      className="submission-details bg-slate-950 p-3 rounded mt-2 min-w-60"
    >
      {/* Grade bar */}
      <div className="w-full h-3 rounded-t mb-2 overflow-hidden bg-slate-800">
        <div
          className={`h-full ${barColor}`}
          style={{ width: percent != null ? `${percent}%` : "0%" }}
        ></div>
      </div>
      <p className="">{submission.user}</p>
      <p className="">
        {percent != null ? `${percent}%` : "N/A"}{" "}
        <span className="text-slate-400"> points</span>
      </p>
      <p className=" text-gray-400">
        {submission.submitted_at
          ? new Date(submission.submitted_at).toLocaleString(undefined, {
              weekday: "long",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A"}
      </p>
      <p className=" ">
        {submission.submitted_at &&
          assignment.due_at &&
          describeTimeDifference(submission.submitted_at, assignment.due_at)}
      </p>
      <p className="">{submission.workflow_state}</p>
    </div>
  );
};
