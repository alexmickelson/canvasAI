import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "../../server/trpc/trpcClient";
import { CanvasCourseComponent } from "./CanvasCourseComponent";
import type { CanvasTerm } from "../../server/services/canvas/canvasCourseService";

export const CanvasTermComponent: React.FC<{ term: CanvasTerm }> = ({
  term,
}) => {
  const trpc = useTRPC();
  const { data: courses } = useSuspenseQuery(
    trpc.canvas.courses.queryOptions()
  );

  const currentCoruses = courses.filter(
    (c) => c.workflow_state === "available" && c.enrollment_term_id === term.id
  );
  return (
    <div className="term-card bg-gray-800 text-white shadow-md rounded-lg p-4 mb-4">
      <h2 className="term-name text-xl font-bold mb-2">{term.name}</h2>
      <p className="term-id text-gray-400">ID: {term.id}</p>
      {term.start_at && (
        <p className="term-start text-gray-400">Start Date: {term.start_at}</p>
      )}
      {term.end_at && (
        <p className="term-end text-gray-400">End Date: {term.end_at}</p>
      )}
      {currentCoruses.map((course) => (
        <CanvasCourseComponent key={course.id} course={course} />
      ))}
    </div>
  );
};
