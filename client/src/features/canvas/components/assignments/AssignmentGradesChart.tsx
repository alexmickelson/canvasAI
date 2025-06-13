import type { ChartConfiguration } from "chart.js";
import { useMemo, type FC } from "react";
import { CustomChart } from "../../../../utils/CustomChart";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { CanvasAssignment } from "../../../../server/services/canvas/canvasAssignmentService";
import { useTRPC } from "../../../../server/trpc/trpcClient";
import { useSnapshotContext } from "../../snapshot/SnapshotContext";

export const AssignmentGradesChart: FC<{
  assignment: CanvasAssignment;
}> = ({ assignment }) => {
  const { selectedSnapshot } = useSnapshotContext();
  const trpc = useTRPC();
  const { data: submissions } = useSuspenseQuery(
    trpc.canvas.assignmentSubmissions.queryOptions({
      assignmentId: assignment.id,
      syncJobId: selectedSnapshot?.id,
    })
  );

  const chartConfig = useMemo((): ChartConfiguration => {
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

    return {
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
    };
  }, [assignment.points_possible, submissions]);

  return <CustomChart config={chartConfig} />;
};
