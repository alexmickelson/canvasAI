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
    trpc.canvas.submissions.queryOptions({ assignmentId: assignment.id })
  );

  const [showSubmissions, setShowSubmissions] = useState(false);

  return (
    <div className="bg-gray-800 rounded shadow-md outline-1 outline-slate-600 p-2 m-2">
      <div className="flex justify-between">
        <div>
          <div className="">{assignment.name}</div>
          <div className="text-sm text-gray-400">
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
          <p className="text-sm text-gray-400">
            {assignment.points_possible} points
          </p>
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
            <div className="mt-4">
              {submissions?.map((submission) => (
                <div
                  key={submission.id}
                  className="submission-details bg-gray-700 p-3 rounded mt-2"
                >
                  <p className="text-sm">User ID: {submission.user_id}</p>
                  <p className="text-sm">Score: {submission.score ?? "N/A"}</p>
                  <p className="text-sm">Grade: {submission.grade ?? "N/A"}</p>
                  <p className="text-sm">
                    Submitted At: {submission.submitted_at ?? "N/A"}
                  </p>
                  <p className="text-sm">
                    Workflow State: {submission.workflow_state}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
