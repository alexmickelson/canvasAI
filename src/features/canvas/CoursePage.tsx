import { useSearchParams } from "react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "../../server/trpc/trpcClient";
import { CanvasCourseComponent } from "./components/CanvasCourseComponent";
import { SnapshotProvider } from "./snapshot/SnapshotContext";

const CoursePage = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");

  const trpc = useTRPC();
  const { data: course, isError } = useSuspenseQuery(
    trpc.canvas.course.queryOptions({ courseId: parseInt(courseId || "0", 10) })
  );

  if (!courseId) {
    return <div>Course ID is missing in the query string.</div>;
  }

  if (isError) {
    return <div>Error loading course data. Please check the Course ID.</div>;
  }

  if (!course) {
    return <div>Loading course...</div>;
  }

  return (
    <div>
      <SnapshotProvider>
        <h1>Course Page</h1>
        <CanvasCourseComponent course={course} />
      </SnapshotProvider>
    </div>
  );
};

export default CoursePage;
