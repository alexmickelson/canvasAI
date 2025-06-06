import { useSearchParams } from "react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "../../server/trpc/trpcClient";
import { Chart } from "chart.js";
import "chart.js/auto";
import { useRef, useEffect } from "react";

export const SubmissionPage = () => {
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get("assignmentId");

  const trpc = useTRPC();
  const { data: submissions, isError } = useSuspenseQuery(
    trpc.canvas.submissions.queryOptions({
      assignmentId: parseInt(assignmentId || "0", 10),
    })
  );

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !submissions) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    const labels = submissions.map((sub) => `User ${sub.user_id}`);
    const scores = submissions.map((sub) => sub.score ?? 0);
    const colors = submissions.map((sub) => {
      if (sub.missing) return "rgba(255, 99, 132, 0.6)";
      if (sub.late) return "rgba(255, 206, 86, 0.6)";
      return "rgba(75, 192, 192, 0.6)";
    });

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Submission Scores",
            data: scores,
            backgroundColor: colors,
            borderColor: colors.map((c) => c.replace("0.6", "1")),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const score = context.parsed.y;
                const user = context.label;
                return `${user}: ${score}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    chartInstanceRef.current = chartInstance;

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [submissions]);

  if (!assignmentId) {
    return <div>Assignment ID is missing in the query string.</div>;
  }

  if (isError) {
    return (
      <div>Error loading submissions. Please check the Assignment ID.</div>
    );
  }

  if (!submissions) {
    return <div>Loading submissions...</div>;
  }

  return (
    <div>
      <h1>Submission Page</h1>
      <p>Details for Assignment ID: {assignmentId}</p>
      <canvas ref={chartRef}></canvas>
      <div className="submission-cards dark:bg-gray-800 dark:text-white p-4 rounded-lg flex flex-wrap gap-4">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="card dark:bg-gray-900 dark:border-gray-700 border border-gray-300 p-4 rounded-lg flex-1 min-w-[200px]"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {submission.user_id}
            </h3>
            <p>
              <strong className="text-gray-700 dark:text-gray-300">
                Score:
              </strong>{" "}
              {submission.score}
            </p>
            <p>
              <strong className="text-gray-700 dark:text-gray-300">
                Status:
              </strong>{" "}
              {submission.missing ? (
                <span className="text-red-500 dark:text-red-400">Missing</span>
              ) : submission.late ? (
                <span className="text-yellow-500 dark:text-yellow-400">
                  Late
                </span>
              ) : (
                <span className="text-green-500 dark:text-green-400">
                  On Time
                </span>
              )}
            </p>
            <p>
              <strong className="text-gray-700 dark:text-gray-300">
                Submitted:
              </strong>{" "}
              {new Date(submission.submitted_at || "").toLocaleString()}
            </p>
            <p>
              <strong className="text-gray-700 dark:text-gray-300">
                Grade:
              </strong>{" "}
              {submission.grade}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
