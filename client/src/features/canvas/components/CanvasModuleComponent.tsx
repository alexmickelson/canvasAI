import type { FC } from "react";
import { useState } from "react";
import type { CanvasAssignment } from "../../../server/services/canvas/canvasAssignmentService";
import type { CanvasModule } from "../../../server/services/canvas/canvasModuleService";
import { SuspenseAndError } from "../../../utils/SuspenseAndError";
import { CanvasAssignmentComponent } from "./assignments/CanvasAssignmentComponent";

export const CanvasModuleComponent: FC<{
  module: CanvasModule;
  assignments: CanvasAssignment[];
}> = ({ module, assignments }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-slate-800 p-3 rounded">
      <div
        className="flex items-center focus:outline-none "
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        role="button"
      >
        <span
          className={`transition-transform duration-300 ${
            expanded ? "rotate-360" : "rotate-270"
          }`}
          aria-hidden="true"
        >
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="inline"
          >
            <polyline
              points="6 8 10 12 14 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="inline">{module.name}</p>
      </div>
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          expanded ? "min-h-0 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="ps-5">
          {assignments.map((assignment) => (
            <SuspenseAndError key={assignment.id}>
              <CanvasAssignmentComponent assignment={assignment} />
            </SuspenseAndError>
          ))}
        </div>
      </div>
    </div>
  );
};
