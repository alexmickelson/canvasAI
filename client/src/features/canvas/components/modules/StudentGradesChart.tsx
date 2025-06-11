import { useSuspenseQuery } from "@tanstack/react-query";
import type { ChartConfiguration } from "chart.js";
import { type FC, useMemo } from "react";
import { useTRPC } from "../../../../server/trpc/trpcClient";
import { CustomChart } from "../../../../utils/CustomChart";

export const StudentGradesForModuleChart: FC<{
  moduleId: number;
}> = ({ moduleId }) => {
  const trpc = useTRPC();
  const { data: submissionsByAssignment } = useSuspenseQuery(
    trpc.canvas.moduleSubmissions.queryOptions({
      moduleId,
    })
  );
  console.log("submissions",submissionsByAssignment);

  const chartConfig = useMemo((): ChartConfiguration => {
    if (!submissionsByAssignment)
      return { type: "line", data: { labels: [], datasets: [] } };

    // Collect all unique user IDs
    const userIds = Array.from(
      new Set(
        submissionsByAssignment.flatMap(({ submissions }) =>
          submissions.map((s) => s.user_id)
        )
      )
    );

    // Prepare labels (assignment names)
    const labels = submissionsByAssignment.map(
      ({ assignment }) => assignment.name
    );

    // Prepare a dataset for each user
    const datasets = userIds.map((userId) => {
      return {
        label: `User ${userId}`,
        data: submissionsByAssignment.map(({ assignment, submissions }) => {
          const submission = submissions.find((s) => s.user_id === userId);
          if (!submission || !assignment.points_possible) return null;
          return submission.score != null
            ? (submission.score / assignment.points_possible) * 100
            : null;
        }),
        spanGaps: true,
        fill: false,
        borderColor: `hsl(${(userId * 47) % 360}, 70%, 50%)`,
        backgroundColor: `hsl(${(userId * 47) % 360}, 70%, 70%)`,
        tension: 0.2,
      };
    });


    return {
      type: "line",
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          y: {
            title: { display: true, text: "Grade %" },
            min: 0,
            max: 100,
          },
        },
      },
    };
  }, [submissionsByAssignment]);

  return <CustomChart config={chartConfig} />;
};
