import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "../../server/trpc/trpcClient";
import { useState } from "react";
import { createAiTool } from "../../utils/createAiTool";
import z from "zod";
import { ChartFromSql, chartFromSqlParamsSchema } from "./ChartFromSql";
import { AiChatProvider } from "../aiChat/AiChatContext";
import { AiChatDisplay } from "../aiChat/AiChatDisplay";

export const AiCharting = () => {
  const trpcQuery = useTRPC();
  const trpcClient = useTRPCClient();
  const { data: tableDdls } = useSuspenseQuery(
    trpcQuery.db.listDbSchema.queryOptions()
  );
  const schemaString = tableDdls
    .map((t) => `#### ${t.table}\n\n- ${t.ddl}`)
    .join("\n");

  const systemPrompt = `You are a data analyst for a college professor. Use the database schema provided to you to answer questions about the data and create charts.

<details>
<summary>Database Schema</summary>
<schema>
${schemaString}
</schema>
</details>
`;

  const [chartConfig, setChartConfig] = useState<
    z.infer<typeof chartFromSqlParamsSchema> | undefined
  >();

  const tools = [
    createAiTool({
      name: "set_sql",
      description: "Set the SQL query to run",
      paramsSchema: chartFromSqlParamsSchema,
      fn: async (params) => {
        setChartConfig(params);
        console.log("Setting SQL with params:", params);
        return `SQL set to: ${params.sql}`;
      },
    }),
    createAiTool({
      name: "run_sql_query",
      description: `
Write and execute SQL queries in read-only mode. Returns the query result as JSON. Write PostgreSQL queries. 
Use this tool proactively to verify your knowledge of the data.

- When selecting, only select the first 3 rows to help you undestand the data.
- never select * from a table, always select specific columns.
`,
      paramsSchema: z.object({
        query: z.string().describe("SQL query to run"),
      }),
      fn: async ({ query }) => {
        const result = await trpcClient.db.runSQL.query({ query });
        if(result.length === 0) {
          return "No results found for the query.";
        }

        return result;
      },
    }),
  ];
  return (
    <AiChatProvider systemPrompt={systemPrompt} tools={tools}>
      <div className="h-screen flex p-3">
        <div className="h-full overscroll-y-auto flex-shrink-1 flex-grow-1 ">
          {chartConfig && <ChartFromSql {...chartConfig} />}
        </div>
        <div className="h-full overscroll-y-auto w-[500px]">
          <AiChatDisplay title={"Data Chat"} />
        </div>
      </div>
    </AiChatProvider>
  );
};
