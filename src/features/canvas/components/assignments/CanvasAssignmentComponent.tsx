import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { FC } from "react";
import { useTRPC } from "../../../../server/trpc/trpcClient";
import type { CanvasAssignment } from "../../../../server/services/canvas/canvasAssignmentService";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController,
} from "chart.js";
import { AssignmentGradesChart } from "./AssignmentGradesChart";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);

export const CanvasAssignmentComponent: FC<{
  assignment: CanvasAssignment;
}> = ({ assignment }) => {
  const trpc = useTRPC();
  const { data: submissions } = useSuspenseQuery(
    trpc.canvas.assignmentSubmissions.queryOptions({
      assignmentId: assignment.id,
    })
  );

  const [showSubmissions, setShowSubmissions] = useState(false);

  return (
    <div className="bg-gray-800 rounded shadow-md outline-1 outline-slate-600 p-2 m-2">
      <div className="flex justify-between">
        <div>
          <div className="">{assignment.name}</div>
          <div className=" text-gray-400">
            {assignment.due_at
              ? new Date(assignment.due_at).toLocaleString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "No due date"}
          </div>
          <p className=" text-gray-400">{assignment.points_possible} points</p>
        </div>
        <div>
          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => setShowSubmissions(!showSubmissions)}
          >
            {showSubmissions ? "Hide Submissions" : "Show Submissions"}
          </button>
        </div>
      </div>
      <div className="ms-4">
        {showSubmissions && (
          <div className="bg-slate-900 p-2 rounded">
            <AssignmentGradesChart assignment={assignment} />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {submissions?.map((submission) => (
                <div
                  key={submission.id}
                  className="submission-details bg-gray-700 p-3 rounded mt-2 min-w-60"
                >
                  <p className="">{submission.user}</p>

                  <p className="">
                    {" "}
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
                    {submission.submitted_at && assignment.due_at ? (
                      <SubmissionTimeDisplay
                        submittedAt={submission.submitted_at}
                        dueAt={assignment.due_at}
                      />
                    ) : (
                      ""
                    )}
                  </p>
                  <p className="">{submission.workflow_state}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function SubmissionTimeDisplay({
  submittedAt,
  dueAt,
}: {
  submittedAt: string;
  dueAt: string;
}) {
  const { days, hours, minutes, lateOrEarly, isExact } = getSubmissionTiming(
    submittedAt,
    dueAt
  );
  return (
    <span className="text-gray-200">
      {isExact ? (
        "Submitted on time"
      ) : (
        <>
          {days && (
            <>
              <span>{days}</span>{" "}
              <span className="text-gray-400">days</span>
              {hours !== 0 || minutes !== 0 ? ", " : " "}
            </>
            )}
            {hours && (
            <>
              <span>{hours}</span>{" "}
              <span className="text-gray-400">hours</span>
              {minutes !== 0 ? ", " : " "}
            </>
            )}
            {minutes && (
            <>
              <span>{minutes}</span>{" "}
              <span className="text-gray-400">minutes</span>{" "}
            </>
          )}
          {lateOrEarly}
        </>
      )}
    </span>
  );
}
function getSubmissionTiming(submittedAt: string, dueAt: string) {
  const submitted = new Date(submittedAt).getTime();
  const due = new Date(dueAt).getTime();
  const diffMs = submitted - due;
  const absDiffMs = Math.abs(diffMs);

  let diffDays = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
  let diffHours = Math.floor((absDiffMs / (1000 * 60 * 60)) % 24);
  let diffMinutes = Math.floor((absDiffMs / (1000 * 60)) % 60);

  // Remove leading 0s
  if (diffDays === 0) diffDays = undefined as unknown as number;
  if (diffDays === undefined && diffHours === 0) diffHours = undefined as unknown as number;
  if (diffDays === undefined && diffHours === undefined && diffMinutes === 0) diffMinutes = undefined as unknown as number;

  const lateOrEarly = diffMs > 0 ? "late" : "early";

  return {
    days: diffDays,
    hours: diffHours,
    minutes: diffMinutes,
    lateOrEarly,
    isExact: diffMs === 0,
  };
}
