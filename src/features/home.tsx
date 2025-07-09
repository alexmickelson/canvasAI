import z from "zod";
import CanvasData from "./canvas/CanvasData";
import { TermProvider } from "./canvas/termSelection/TermContext";
import { createAiTool } from "../utils/createAiTool";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "../server/trpc/trpcClient";
import { AiChatProvider } from "./aiChat/AiChatContext";
import { AiChatDisplay } from "./aiChat/AiChatDisplay";

export default function Home() {
  const [title, setTitle] = useState("AI Chat");
  const navigate = useNavigate();
  const trpcQuery = useTRPC();
  const { data: tableDdls } = useSuspenseQuery(
    trpcQuery.db.listDbSchema.queryOptions()
  );
  const trpc = useTRPCClient();
  return (
    <TermProvider>
      <AiChatProvider
        systemPrompt={`You are an AI assistant, use the tools available to you when appropriate. 
- Proactively assist your user, after making a tool call, check if you need to make another tool call based on the result.
- Tool results are not provided by the user, but an automated system. Be sure to summerize tool call results to the user in a concise manner.
`}
        tools={[
          createAiTool({
            name: "set_title",
            description: "Set the title of the chat",
            paramsSchema: z.object({ title: z.string() }),
            fn: async ({ title }) => {
              setTitle(title);
              console.log("Setting title with params:", title);
              return `Title set to: ${title}`;
            },
          }),
          createAiTool({
            name: "navigate_page",
            description: `Navigate to a specific page in the app.
Pages:
  '/' (Home: main dashboard),
  '/course' (CoursePage: view course details, requires query param: courseId),
  '/assignment' (AssignmentPage: view assignments, requires query param: assignmentId),
  '/submission' (SubmissionPage: view and submit assignments, requires query param: assignmentId).

Required query parameters:
  - /course: courseId (string or number)
  - /assignment: assignmentId (string or number)
  - /submission: assignmentId (string or number)`,
            paramsSchema: z.object({
              path: z.string(),
              query: z.string(),
            }),
            fn: async ({ path, query }) => {
              const url = path + "?" + query;
              navigate(url);
              return `Navigated to ${url}`;
            },
          }),
          createAiTool({
            name: "get_classes",
            description:
              "Get a list of available classes (courses). Returns an array of objects with id and name.",
            paramsSchema: z.object({}),
            fn: async () => {
              const classes = await trpc.canvas.courses.query();
              const simplifiedClasses = classes.map(({ id, name }) => ({
                id,
                name,
              }));
              return JSON.stringify(simplifiedClasses);
            },
          }),
          createAiTool({
            name: "run_sql_query",
            description: `
Write and execute SQL queries in read-only mode. Returns the query result as JSON. Write PostgreSQL queries. 
Use this tool proactively to verify your knowledge.

${tableDdls.join("\n")}

This is the catch-all tool for retrieving information. When another tool is not available, use this tool to get the data you need.

never select * from a table, always select specific columns.
`,
            paramsSchema: z.object({ query: z.string() }),
            fn: async ({ query }) => {
              const schema = await trpc.db.runSQL.query({ query });
              return JSON.stringify(schema);
            },
          }),
        ]}
      >
        <div className="flex p-3 h-screen">
          <div className="h-full flex-1 overflow-auto">
            <CanvasData />
          </div>
          <div className="h-full overflow-auto">
            <AiChatDisplay title={title} />
          </div>
        </div>
      </AiChatProvider>
    </TermProvider>
  );
}
