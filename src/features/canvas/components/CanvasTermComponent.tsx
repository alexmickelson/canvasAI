import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "../../../server/trpc/trpcClient";
import { CanvasCourseComponent } from "../CanvasCourseComponent";
import type { CanvasTerm } from "../../../server/services/canvas/canvasCourseService";
import type { FC } from "react";
import { useSnapshotContext } from "../snapshot/SnapshotContext";

export const CanvasTermComponent: FC<{ term: CanvasTerm }> = ({ term }) => {
  const { selectedSnapshot } = useSnapshotContext();
  const trpc = useTRPC();
  const { data: courses } = useSuspenseQuery(
    trpc.canvas.courses.queryOptions()
  );

  const currentCourses = courses.filter(
    (c) => c.enrollment_term_id === term.id
  );

  if (!selectedSnapshot) {
    return <div>no snapshot selected</div>;
  }
  return (
    <div className="term-card rounded-lg mb-4 mx-2">
      <h2 className="term-name font-bold mb-2 border-b-2 border-slate-600">
        {term.name}
      </h2>
      <div>
        {currentCourses.map((course) => (
          <CanvasCourseComponent key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};
