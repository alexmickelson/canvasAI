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
    .map(
      (t) => `#### ${t.table}\n\n\`\`\`sql
${t.ddl}
\`\`\``
    )
    .join("\n");

  const systemPrompt = `You are a data analyst for a college professor. Use the database schema provided to you to answer questions about the data and create charts.

<details>
<summary>Database Schema</summary>

${schemaString}
</details>


<details>
<summary>Multiple Courses With Similar Names</summary>
When a user asks about a course and your search yields multiple classes with similar or matching names:
    Retrieve all classes/courses that match the search query.
    For each matching course, also retrieve its associated term (e.g., Fall 2023, Spring 2024) using the enrollment_term_id from the courses table and the name from the terms table.
    
    If there is only one course in the most recent term, automatically use that course without asking the user.
    
    If there are multiple courses in the most recent term, present the user with a clearly formatted list, showing both the course name and its term (and, if useful, the course ID).
    Ask the user to specify which course they mean before proceeding with any data retrieval or reporting.

    Never proceed by picking a course automatically when multiple courses are in the same recent term.
    Automatically select a course only when there is exactly one course in the most recent term.
    Only continue once the user confirms their choice or a single course from the most recent term is automatically selected.
</details>


`;

  const [chartConfig, setChartConfig] = useState<
    z.infer<typeof chartFromSqlParamsSchema> | undefined
  >();

  const tools = [
    createAiTool({
      name: "sql_chart",
      description: "Set the SQL query to use to create a chart.",
      paramsSchema: chartFromSqlParamsSchema,
      fn: async (params) => {
        setChartConfig(params);
        console.log("Setting SQL with params:", params);
        return {
          status: "success",
          params: params,
        };
      },
    }),
    createAiTool({
      name: "run_sql_query",
      description: `
Write and execute SQL queries in read-only mode. Returns the query result as JSON. Write PostgreSQL queries. 
Use this tool proactively to verify your knowledge of the data.

- never select * from a table, always select specific columns.
- To find available options or unique values in a column, use the DISTINCT keyword in your SQL query. For example:
      SELECT DISTINCT column_name FROM table_name;
  Use this approach to explore possible values for filtering or grouping.
- This lets you get each student's name from the enrollments.user JSONB for results based on course and user:
    JOIN enrollments e ON submissions.user_id = e.user_id AND submissions.course_id = e.course_id; then SELECT e.user->>'name' AS student_name. 
- When calculating grades as a percentage, use the formula:
    For each student in a course, join the submissions table to assignments.
    Sum submissions.score as earned_points.
    Sum assignments.points_possible for the same assignment_ids as possible_points.
    Calculate percentage as earned_points / possible_points * 100.
    Optionally, join enrollments to get student names from enrollments.user->>'name'.
- Set datasetGroup to a column name (such as student_name) to display separate lines or bars for each unique value in that column,
    helping you compare groups (e.g., each student's grades over time) within the chart.
`,
      paramsSchema: z.object({
        query: z.string().describe("SQL query to run"),
      }),
      fn: async ({ query }) => {
        const result = await trpcClient.db.runSQL.query({ query });
        if (result.length === 0) {
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
