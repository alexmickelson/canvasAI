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
  yField: z.union([z.string(), z.array(z.string())]),
  title: z.string(),
  xLabel: z.string().optional(),
  yLabel: z.string().optional(),
});

export const ChartFromSql = ({
  sql,
  chartType,
  xField,
  yField,
  title,
  xLabel,
  yLabel,
}: z.infer<typeof chartFromSqlParamsSchema>) => {
  const trpc = useTRPC();
  const { data, isLoading } = useSuspenseQuery(
    trpc.db.runSQL.queryOptions({ query: sql })
  );

  const rows = data ?? [];
  const xKey = xField;

  const colorPalette = [
    "#4bc0c0",
    "#ff6384",
    "#36a2eb",
    "#ffce56",
    "#9966ff",
    "#ff9f40",
    "#c9cbcf",
  ];
  const borderPalette = [
    "#4bc0c0",
    "#ff6384",
    "#36a2eb",
    "#ffce56",
    "#9966ff",
    "#ff9f40",
    "#c9cbcf",
  ];

  // If yKey is an array, treat as multiple datasets, else single dataset
  const yKeys = Array.isArray(yField) ? yField : [yField];

  const chartConfig: ChartConfiguration = {
    type: chartType,
    data: {
      labels: rows.map((row) => row[xKey]) || [],
      datasets: yKeys.map((key, i) => ({
        label: yKeys.length > 1 ? key : title,
        data: rows.map((row) => row[key]) || [],
        backgroundColor: colorPalette[i % colorPalette.length],
        borderColor: borderPalette[i % borderPalette.length],
        borderWidth: 1,
        showLine: chartType !== "scatter",
      })),
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: title },
      },
      scales:
        chartType === "scatter"
          ? {
              x: {
                type: "linear",
                position: "bottom",
                title: xLabel ? { display: true, text: xLabel } : undefined,
              },
              y: yLabel ? { title: { display: true, text: yLabel } } : {},
            }
          : {
              x: xLabel ? { title: { display: true, text: xLabel } } : {},
              y: yLabel ? { title: { display: true, text: yLabel } } : {},
            },
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
