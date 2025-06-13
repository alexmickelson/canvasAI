import { Route, Routes, useNavigate } from "react-router";
import Home from "./features/home";
import CoursePage from "./features/canvas/CoursePage";
import AssignmentPage from "./features/canvas/AssignmentPage";
import { SubmissionPage } from "./features/canvas/SubmissionPage";
import { ChatDisplay } from "./features/AiChat";
import { useState } from "react";
import z from "zod";
import { AiChatProvider } from "./features/AiChatContext";
import { useTRPCClient } from "./server/trpc/trpcClient";

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
  // const trpcQuery = useTRPC();
  // const { data: schema } = useSuspenseQuery(
  //   trpcQuery.db.listDbSchema.queryOptions()
  // );
  const trpc = useTRPCClient();
  // console.log("schema", schema);

  const sqlDescription = `
Write and execute SQL queries in read-only mode. Returns the query result as JSON. Write PostgreSQL queries. 
Use this tool proactively to verify your knowledge.

CREATE TABLE terms (
  id BIGINT PRIMARY KEY,
  name TEXT
);

CREATE TABLE courses (
  id BIGINT PRIMARY KEY,
  sis_course_id TEXT,
  uuid TEXT,
  integration_id TEXT,
  name TEXT,
  course_code TEXT,
  workflow_state TEXT,
  enrollment_term_id BIGINT REFERENCES terms(id),
  created_at TIMESTAMP,
  start_at TIMESTAMP,
  end_at TIMESTAMP,
  total_students INTEGER,
  default_view TEXT,
  needs_grading_count INTEGER,
  public_description TEXT,
  hide_final_grades BOOLEAN
);

CREATE TABLE assignments (
  id BIGINT PRIMARY KEY,
  name TEXT,
  description TEXT,
  due_date TIMESTAMP,
  unlock_at TIMESTAMP,
  lock_at TIMESTAMP,
  course_id BIGINT REFERENCES courses(id),
  html_url TEXT,
  submission_types TEXT[],
  grading_type TEXT,
  points_possible NUMERIC,
  grading_standard_id BIGINT,
  published BOOLEAN,
  muted BOOLEAN,
  context_module_id BIGINT
);

CREATE TABLE submissions (
  id BIGINT PRIMARY KEY,
  assignment_id BIGINT REFERENCES assignments(id),
  user_id BIGINT,
  submitted_at TIMESTAMP,
  score NUMERIC,
  grade TEXT,
  workflow_state TEXT,
  attempt BIGINT,
  late BOOLEAN,
  missing BOOLEAN
);

CREATE TABLE modules (
  id BIGINT PRIMARY KEY,
  name TEXT,
  position BIGINT,
  unlock_at TIMESTAMP,
  require_sequential_progress BOOLEAN,
  publish_final_grade BOOLEAN,
  published BOOLEAN,
  course_id BIGINT REFERENCES courses(id)
);

Example SQL queries:

-- Get all submissions for all assignments in a course, including assignment and course info (replace :courseId with the actual course id)
  SELECT 
    submissions.id AS submission_id,
    submissions.user_id,
    submissions.submitted_at,
    submissions.score,
    submissions.grade,
    submissions.workflow_state,
    submissions.attempt,
    submissions.late,
    submissions.missing,
    assignments.id AS assignment_id,
    assignments.name AS assignment_name,
    assignments.due_date,
    courses.id AS course_id,
    courses.name AS course_name
  FROM submissions
  JOIN assignments ON submissions.assignment_id = assignments.id
  JOIN courses ON assignments.course_id = courses.id
  WHERE courses.id = :courseId;

-- Get all assignments grouped by module in a course, including course and term info (replace :courseId with the actual course id)
  SELECT 
    modules.id AS module_id,
    modules.name AS module_name,
    assignments.id AS assignment_id,
    assignments.name AS assignment_name,
    assignments.description,
    assignments.due_date,
    assignments.unlock_at,
    assignments.lock_at,
    assignments.course_id,
    assignments.html_url,
    assignments.submission_types,
    assignments.grading_type,
    assignments.points_possible,
    assignments.grading_standard_id,
    assignments.published,
    assignments.muted,
    assignments.context_module_id,
    courses.name AS course_name,
    terms.name AS term_name
  FROM modules
  LEFT JOIN assignments ON assignments.context_module_id = modules.id
  JOIN courses ON modules.course_id = courses.id
  LEFT JOIN terms ON courses.enrollment_term_id = terms.id
  WHERE modules.course_id = :courseId
  ORDER BY modules.position, assignments.id;

-- Get all distinct course names and their terms
SELECT DISTINCT 
  courses.name AS course_name,
  terms.name AS term_name
FROM courses
LEFT JOIN terms ON courses.enrollment_term_id = terms.id;

This is the catch-all tool for retrieving information. When another tool is not available, use this tool to get the data you need.
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
