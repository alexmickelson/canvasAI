import { useSuspenseQuery } from "@tanstack/react-query";
import { CustomChart } from "../../utils/CustomChart";
import type { ChartConfiguration } from "chart.js";
import { useTRPC } from "../../server/trpc/trpcClient";
import Spinner from "../../utils/Spinner";
import { z } from "zod";

export const chartFromSqlParamsSchema = z.object({
  sql: z.string(),
  chartType: z.enum(["bar", "line", "scatter"]),
  xField: z.string(),
  yField: z.string(),
  title: z.string(),
});

export const ChartFromSql = ({
  sql,
  chartType,
  xField,
  yField,
  title,
}: z.infer<typeof chartFromSqlParamsSchema>) => {
  const trpc = useTRPC();
  const { data, isLoading } = useSuspenseQuery(
    trpc.db.runSQL.queryOptions({ query: sql })
  );

  const rows = data ?? [];
  const xKey = xField;
  const yKey = yField;

  const chartConfig: ChartConfiguration = {
    type: chartType,
    data: {
      labels: rows.map((row) => row[xKey]) || [],
      datasets: [
        {
          label: title,
          data: rows.map((row) => row[yKey]) || [],
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
          showLine: chartType !== "scatter",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: title },
      },
      scales:
        chartType === "scatter"
          ? { x: { type: "linear", position: "bottom" } }
          : {},
    },
  };

  if (isLoading)
    return (
      <div>
        Loading chart...
        <Spinner />
      </div>
    );
  if (!data || !rows.length) return <div>No data for chart.</div>;

  return <CustomChart config={chartConfig} />;
};
