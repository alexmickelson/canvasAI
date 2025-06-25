import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "../../../server/trpc/trpcClient";
import { CanvasCourseComponent } from "../CanvasCourseComponent";
import type { CanvasTerm } from "../../../server/services/canvas/canvasCourseService";

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
    <div className="term-card rounded-lg mb-4 mx-2">
      <h2 className="term-name font-bold mb-2 border-b-2 border-slate-600">{term.name}</h2>
      <div>
        {currentCoruses.map((course) => (
          <CanvasCourseComponent key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};
