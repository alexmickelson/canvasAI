import type { FC, ReactNode } from "react";
import { useState } from "react";

interface CollapseProps {
  header: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export const Collapse: FC<CollapseProps> = ({
  header,
  children,
  defaultOpen = false,
}) => {
  const [expanded, setExpanded] = useState(defaultOpen);

  return (
    <div className=" p-3 rounded">
      <div
        className="flex items-center cursor-pointer focus:outline-none"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        role="button"
      >
        <span
          className={`transition-transform duration-300 mr-2 ${
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
        <div className="flex-1">{header}</div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          expanded ? "min-h-0 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="ps-5">{children}</div>
      </div>
    </div>
  );
};
