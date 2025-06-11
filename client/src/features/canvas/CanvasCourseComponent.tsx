import { useState, type FC } from "react";
import type { CanvasCourse } from "../../server/services/canvas/canvasCourseService";
import { useTRPC } from "../../server/trpc/trpcClient";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CanvasModuleComponent } from "./components/modules/CanvasModuleComponent";

export const CanvasCourseComponent: FC<{ course: CanvasCourse }> = ({
  course,
}) => {
  const [showModules, setShowModules] = useState(false);
  const trpc = useTRPC();

  const { data: assignments } = useSuspenseQuery(
    trpc.canvas.assignments.queryOptions({ courseId: course.id })
  );

  const { data: modules } = useSuspenseQuery(
    trpc.canvas.modules.queryOptions({ courseId: course.id })
  );

  const assignmentsByModule = modules?.map((module) => {
    const itemsInModule = module.items?.map((item) => item.content_id);
    return {
      module,
      assignments:
        assignments?.filter((assignment) =>
          itemsInModule?.includes(assignment.id)
        ) || [],
    };
  });

  return (
    <>
      <div className="bg-slate-900 m-2 p-2 rounded">
        <div>{course.name}</div>
        <button className="m-3" onClick={() => setShowModules(!showModules)}>
          {showModules ? "Hide Modules" : "Show Modules"}
        </button>

        {showModules && (
          <>
            {assignmentsByModule?.map(({ module, assignments }) => (
              <CanvasModuleComponent
                key={module.id}
                module={module}
                assignments={assignments}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
};
