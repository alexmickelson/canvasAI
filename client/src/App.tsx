import { Route, Routes, useNavigate } from "react-router";
import Home from "./features/home";
import CoursePage from "./features/canvas/CoursePage";
import AssignmentPage from "./features/canvas/AssignmentPage";
import { SubmissionPage } from "./features/canvas/SubmissionPage";
import { ChatDisplay } from "./features/AiChat";
import { useState } from "react";
import z from "zod";
import { AiChatProvider } from "./features/AiChatContext";
import { useTRPCClient } from "./trpc/trpcClient";

function App() {
  const [title, setTitle] = useState("AI Chat");
  const navigate = useNavigate();
  const trpc = useTRPCClient();
  const tools = [
    {
      name: "set_title",
      description: "Set the title of the chat",
      paramsSchema: z.object({ title: z.string() }),
      fn: (params: string) => {
        const parsed = z
          .object({ title: z.string() })
          .parse(JSON.parse(params));
        setTitle(parsed.title);
        console.log("Setting title with params:", parsed.title);
        return `Title set to: ${parsed.title}`;
      },
    },
    {
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
        path: z
          .string()
          .describe(
            "The path to navigate to, e.g., '/', '/course', '/assignment', or '/submission'"
          ),
        query: z
          .string()
          .describe(
            "query parameters to add to the end of the url e.g. courseId=123 or courseid=123&assignmentId=456, set as an empty string if no query params are needed"
          ),
      }),
      fn: (params: string) => {
        const { path, query } = z
          .object({
            path: z
              .string()
              .describe(
                "The path to navigate to, e.g., '/', '/course', '/assignment', or '/submission'"
              ),
            query: z
              .string()
              .describe(
                "query parameters to add to the end of the url e.g. courseId=123 or courseid=123&assignmentId=456, set as an empty string if no query params are needed"
              ),
          })
          .parse(JSON.parse(params));
        const url = path + "?" + query;
        navigate(url);
        return `Navigated to ${url}`;
      },
    },
    {
      name: "get_classes",
      description:
        "Get a list of available classes (courses). Returns an array of objects with id and name.",
      paramsSchema: z.object({}),
      fn: async () => {
        const classes = await trpc.canvas.courses.query();
        const simplifiedClasses = classes.map(({ id, name }) => ({ id, name }));
        return JSON.stringify(simplifiedClasses);
      },
    },
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
