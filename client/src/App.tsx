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
  const { data: schema } = useSuspenseQuery(
    trpcQuery.db.listDbSchema.queryOptions()
  );
  const trpc = useTRPCClient();
  // console.log("schema", schema);

  const sqlDescription = `Write and execute SQL queries in read-only mode. Returns the query result as JSON. Write PostgreSQL queries. 
Use postgres json fuctions when working with the original_record field:
JSONB Field/Element Access:
  ->: Access JSON array element or object field (returns JSON/JSONB).
  ->>: Access JSON array element or object field as text.
  #>: Access JSON object at a specified path (returns JSON/JSONB).
  #>>: Access JSON object at a specified path as text.
JSONB Containment and Existence (JSONB only):
  @>: Check if the left JSON contains the right JSON.
  <@: Check if the left JSON is contained in the right JSON.
  ?: Check if a key exists at the top level.
  ?|: Check if any keys in an array exist at the top level.
  ?&: Check if all keys in an array exist at the top level.
JSONB Modification:
  ||: Concatenate two JSONB values.
  -: Remove a key or array element.
  #-: Remove a field or element at a specified path.
JSONB Convert Data to JSON:
  to_json / to_jsonb: Convert any data type to JSON/JSONB.
  array_to_json: Convert an array to a JSON array.
  row_to_json: Convert a row to a JSON object.
JSONB Build JSON Objects:
  json_build_object / jsonb_build_object: Build a JSON object from key-value pairs.
  json_object: Build a JSON object from a text array or two separate arrays for keys and values.
JSONB Expand JSON:
  json_each / jsonb_each: Expand a JSON object into key-value pairs.
  json_array_elements / jsonb_array_elements: Expand a JSON array into individual elements.
JSONB Extract Information:
  json_object_keys: Get the keys of a JSON object.
  json_typeof: Get the type of the outermost JSON value.

${JSON.stringify(schema)}
        `;
  // console.log(sqlDescription);
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
