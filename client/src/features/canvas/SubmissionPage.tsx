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
      <pre>{JSON.stringify(submissions, null, 2)}</pre>
    </div>
  );
};
