import { Route, Routes, useNavigate } from "react-router";
import Home from "./features/home";
import CoursePage from "./features/canvas/CoursePage";
import AssignmentPage from "./features/canvas/AssignmentPage";
import { SubmissionPage } from "./features/canvas/SubmissionPage";
import { ChatDisplay } from "./features/AiChat";
import { useState } from "react";
import z from "zod";
import { AiChatProvider } from "./features/AiChatContext";
import { useTRPC, useTRPCClient } from "./server/trpc/trpcClient";
import { VoicePage } from "./features/voice/VoicePage";
import { useSuspenseQuery } from "@tanstack/react-query";

function createTool<T>({
  name,
  description,
  paramsSchema,
  fn,
}: {
  name: string;
  description: string;
  paramsSchema: z.ZodType<T>;
  fn: (params: T) => unknown;
}) {
  return {
    name,
    description,
    paramsSchema,
    fn: (params: string) => {
      const parsedParams = paramsSchema.parse(JSON.parse(params));
      return fn(parsedParams);
    },
  };
}

function App() {
  const [title, setTitle] = useState("AI Chat");
  const navigate = useNavigate();
  const trpcQuery = useTRPC();
  const { data: tableDdls } = useSuspenseQuery(
    trpcQuery.db.listDbSchema.queryOptions()
  );
  const trpc = useTRPCClient();
  // console.log("schema", tableDdls);

  const sqlDescription = `
Write and execute SQL queries in read-only mode. Returns the query result as JSON. Write PostgreSQL queries. 
Use this tool proactively to verify your knowledge.

${tableDdls.join("\n")}

This is the catch-all tool for retrieving information. When another tool is not available, use this tool to get the data you need.

never select * from a table, always select specific columns.
`;
  const tools = [
    createTool({
      name: "set_title",
      description: "Set the title of the chat",
      paramsSchema: z.object({ title: z.string() }),
      fn: ({ title }) => {
        setTitle(title);
        console.log("Setting title with params:", title);
        return `Title set to: ${title}`;
      },
    }),
    createTool({
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
      fn: ({ path, query }) => {
        const url = path + "?" + query;
        navigate(url);
        return `Navigated to ${url}`;
      },
    }),
    createTool({
      name: "get_classes",
      description:
        "Get a list of available classes (courses). Returns an array of objects with id and name.",
      paramsSchema: z.object({}),
      fn: async () => {
        const classes = await trpc.canvas.courses.query();
        const simplifiedClasses = classes.map(({ id, name }) => ({ id, name }));
        return JSON.stringify(simplifiedClasses);
      },
    }),
    createTool({
      name: "run_sql_query",
      description: sqlDescription,
      paramsSchema: z.object({ query: z.string() }),
      fn: async ({ query }) => {
        const schema = await trpc.db.runSQL.query({ query });
        return JSON.stringify(schema);
      },
    }),
  ];
  return (
    <>
      <AiChatProvider tools={tools}>
        <div className="flex h-screen ">
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/course" element={<CoursePage />} />
              <Route path="/assignment" element={<AssignmentPage />} />
              <Route path="/submission" element={<SubmissionPage />} />
              <Route path="/voice" element={<VoicePage />} />
            </Routes>
          </div>
          <div className="p-1">
            <ChatDisplay title={title} />
          </div>
        </div>
      </AiChatProvider>
    </>
  );
}

export default App;
