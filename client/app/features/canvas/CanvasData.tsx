import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "../trpc/trpcClient";

export const CanvasData = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.canvas.courses.queryOptions());
  console.log(data);
  return (
    <div>
      {data.map((course) => (
        <div key={course.id}>
          <div>
            {course.name} - {course.id}
          </div>
        </div>
      ))}
    </div>
  );
};
