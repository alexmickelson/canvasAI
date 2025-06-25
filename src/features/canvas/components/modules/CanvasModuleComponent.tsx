import type { FC } from "react";
import type { CanvasAssignment } from "../../../../server/services/canvas/canvasAssignmentService";
import type { CanvasModule } from "../../../../server/services/canvas/canvasModuleService";
import { SuspenseAndError } from "../../../../utils/SuspenseAndError";
import { CanvasAssignmentComponent } from "../assignments/CanvasAssignmentComponent";
import { StudentGradesForModuleChart } from "./StudentGradesChart";
import { Collapse } from "./Collapse";

export const CanvasModuleComponent: FC<{
  module: CanvasModule;
  assignments: CanvasAssignment[];
}> = ({ module, assignments }) => {
  return (
    <div className="rounded bg-slate-900 mb-2">
      <Collapse header={<div>{module.name}</div>}>
        <SuspenseAndError>
          <StudentGradesForModuleChart moduleId={module.id} />
        </SuspenseAndError>
        {assignments.map((assignment) => (
          <SuspenseAndError key={assignment.id}>
            <CanvasAssignmentComponent assignment={assignment} />
          </SuspenseAndError>
        ))}
      </Collapse>
    </div>
  );
};
