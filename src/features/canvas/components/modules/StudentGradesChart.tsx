import { useSuspenseQuery } from "@tanstack/react-query";
import type { ChartConfiguration } from "chart.js";
import { type FC, useMemo } from "react";
import { useTRPC } from "../../../../server/trpc/trpcClient";
import { CustomChart } from "../../../../utils/CustomChart";
import { useSnapshotContext } from "../../snapshot/SnapshotContext";

export const StudentGradesForModuleChart: FC<{
  moduleId: number;
}> = ({ moduleId }) => {
  const trpc = useTRPC();
  const { selectedSnapshot } = useSnapshotContext();
  const { data: submissionsByAssignment } = useSuspenseQuery(
    trpc.canvas.moduleSubmissions.queryOptions({
      moduleId,
      snapshotId: selectedSnapshot?.id,
    })
  );

  const chartConfig = useMemo((): ChartConfiguration => {
    if (!submissionsByAssignment)
      return { type: "line", data: { labels: [], datasets: [] } };

    const userIds = Array.from(
      new Set(
        submissionsByAssignment.flatMap(({ submissions }) =>
          submissions.map((s) => s.user_id)
        )
      )
    );

    const labels = submissionsByAssignment.map(
      ({ assignment }) => assignment.name
    );

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
