import { Link, useParams } from "react-router";
import { useTRPC } from "../../../server/trpc/trpcClient";
import { useSuspenseQuery } from "@tanstack/react-query";

export const TermPage = () => {
  const { termName } = useParams<{ termName: string }>();
  const trpc = useTRPC();
  const { data: courses } = useSuspenseQuery(
    trpc.canvas.courses.queryOptions()
  );
  const coursesInTerm = courses.filter(
    (course) => course.term.name === termName
  );

  if (!termName) {
    return <div>Term name is missing in the URL.</div>;
  }

  return (
    <div>
      {termName}

      <div className="flex  gap-3">
        {coursesInTerm.map((course) => (
          <Link
            key={course.id}
            to={`/course?courseId=${course.id}`}
            className="p-4 border bordecoration-slate-700 rounded shadow mb-2"
          >
            <h2 className="">{course.name}</h2>
            <div>{course.workflow_state}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};
