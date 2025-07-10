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
  xLabel: z.string(),
  yLabel: z.string(),
  datasetGroup: z
    .string()
    .optional()
    .describe(
      "sql column to group datasets by, grouping will cause different datasets to have differenc colors"
    ),
});

export const ChartFromSql = ({
  sql,
  chartType,
  xField,
  yField,
  title,
  xLabel,
  yLabel,
  datasetGroup,
}: z.infer<typeof chartFromSqlParamsSchema>) => {
  const trpc = useTRPC();
  const { data, isLoading } = useSuspenseQuery(
    trpc.db.runSQL.queryOptions({ query: sql })
  );

  const rows = data ?? [];
  const borderPalette = [
    "rgba(75, 192, 192, 1)",
    "rgba(255, 99, 132, 1)",
    "rgba(54, 162, 235, 1)",
    "rgba(255, 206, 86, 1)",
    "rgba(153, 102, 255, 1)",
    "rgba(255, 159, 64, 1)",
    "rgba(201, 203, 207, 1)",
    "rgba(231, 76, 60, 1)",
    "rgba(52, 152, 219, 1)",
    "rgba(46, 204, 113, 1)",
    "rgba(243, 156, 18, 1)",
    "rgba(155, 89, 182, 1)",
    "rgba(26, 188, 156, 1)",
    "rgba(52, 73, 94, 1)",
    "rgba(230, 126, 34, 1)",
    "rgba(149, 165, 166, 1)",
    "rgba(241, 196, 15, 1)",
    "rgba(142, 68, 173, 1)",
    "rgba(22, 160, 133, 1)",
    "rgba(44, 62, 80, 1)",
    "rgba(211, 84, 0, 1)",
    "rgba(127, 140, 141, 1)",
    "rgba(39, 174, 96, 1)",
    "rgba(41, 128, 185, 1)",
  ];

  const createDatasets = () => {
    if (datasetGroup) {
      const uniqueXValues = getUniqueLabels(rows, xField);
      console.log("uniqueXValues", uniqueXValues);

      const groupedData: Record<string, Record<string, unknown>[]> =
        rows.reduce((acc, row) => {
          const groupValue = String(row[datasetGroup]);
          return {
            ...acc,
            [groupValue]: [...(acc[groupValue] || []), row],
          };
        }, {} as Record<string, Record<string, unknown>[]>);

      return Object.entries(groupedData).map(([groupValue, groupRows], i) => {
        const sortedRows = [...groupRows]
          .sort((a, b) => {
            const aValue = String(a[xField]);
            const bValue = String(b[xField]);
            return compareLabelsForSorting(aValue, bValue);
          })
          .map((row) => row[yField]);

        return {
          label: groupValue,
          data: sortedRows,
          backgroundColor: borderPalette[i % borderPalette.length].replace(
            "1)",
            "0.25)"
          ),
          borderColor: borderPalette[i % borderPalette.length],
          borderWidth: 1,
          showLine: chartType !== "scatter",
          tension: 0.1,
        };
      });
    } else {
      return {
        label: yField,
        data: rows.map((row) => row[yField]) || [],
        backgroundColor: borderPalette[0].replace("1)", "0.25)"),
        borderColor: borderPalette[0],
        borderWidth: 1,
        showLine: chartType !== "scatter",
      };
    }
  };

  const createLabels = () => {
    if (datasetGroup) {
      return getUniqueLabels(rows, xField);
    } else {
      return rows.map((row) => row[xField]) || [];
    }
  };

  const chartConfig: ChartConfiguration = {
    type: chartType,
    data: {
      labels: createLabels(),
      // @ts-expect-error types are wrong
      datasets: createDatasets(),
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
  // console.log("chart config", chartConfig);

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

const compareLabelsForSorting = (a: string, b: string) => {
  // Try to sort as dates first, then as numbers, then as strings
  const dateA = new Date(a);
  const dateB = new Date(b);
  if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
    return dateA.getTime() - dateB.getTime();
  }
  const numA = Number(a);
  const numB = Number(b);
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }
  return a.localeCompare(b);
};

const getUniqueLabels = (data: Record<string, unknown>[], xField: string) => {
  return [...new Set(data.map((row) => String(row[xField])))].sort(
    compareLabelsForSorting
  );
};
