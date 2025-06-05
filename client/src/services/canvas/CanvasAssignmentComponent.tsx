import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { useTRPC } from "../../trpc/trpcClient";
import type { CanvasAssignment } from "./canvasAssignmentService";
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

  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);
  const [showSubmissions, setShowSubmissions] = useState(false);

  useEffect(() => {
    if (chartRef.current && submissions) {
      const ctx = chartRef.current.getContext("2d");

      if (ctx) {
        // Sort submissions by grade percentage in ascending order
        const sortedSubmissions = submissions
          .map((submission) => {
            const percentage =
              submission.score && assignment.points_possible
                ? (submission.score / assignment.points_possible) * 100
                : 0;
            return { user: `User ${submission.user_id}`, percentage };
          })
          .sort((a, b) => a.percentage - b.percentage);

        const labels = sortedSubmissions.map((item) => item.user);
        const data = sortedSubmissions.map((item) => item.percentage);

        chartInstanceRef.current = new ChartJS(ctx, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Grade Percentage",
                data,
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: "top",
              },
            },
          },
        });
      }
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [submissions, assignment.points_possible]);

  return (
    <div className="bg-gray-800 text-white p-4 rounded shadow-md">
      <div className="text-lg font-bold">{assignment.name}</div>
      <div className="ms-4">
        <p className="text-sm text-gray-400">Due: {assignment.due_at}</p>
        <p className="text-sm text-gray-400">
          Points: {assignment.points_possible}
        </p>
        <div className="mt-6">
          <h4 className="text-md font-semibold">Grade Distribution:</h4>
          <canvas ref={chartRef} className="mt-4"></canvas>
        </div>
        <button
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => setShowSubmissions(!showSubmissions)}
        >
          {showSubmissions ? "Hide Submissions" : "Show Submissions"}
        </button>
        {showSubmissions && (
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
        )}
      </div>
    </div>
  );
};
