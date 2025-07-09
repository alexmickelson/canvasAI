import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "../../server/trpc/trpcClient";
import type { CanvasCourse } from "../../server/services/canvas/canvasCourseService";
import { CanvasModuleComponent } from "./components/modules/CanvasModuleComponent";
import { Collapse } from "./components/modules/Collapse";
import { type FC } from "react";

export const CanvasCourseComponent: FC<{ course: CanvasCourse }> = ({
  course,
}) => {
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
    <div className="bg-slate-900 m-2 p-2 rounded">
      <Collapse header={<div className="">{course.name}</div>} headerClassName="bg-slate-800 p-3 rounded">
        {assignmentsByModule?.map(({ module, assignments }) => (
          <CanvasModuleComponent
            key={module.id}
            module={module}
            assignments={assignments}
          />
        ))}
      </Collapse>
    </div>
  );
};
