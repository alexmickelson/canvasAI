import { useSearchParams } from "react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "../../server/trpc/trpcClient";
import { CanvasAssignmentComponent } from "./CanvasAssignmentComponent";

const AssignmentPage = () => {
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get("assignmentId");

  const trpc = useTRPC();
  const { data: assignment } = useSuspenseQuery(
    trpc.canvas.assignment.queryOptions({
      assignmentId: parseInt(assignmentId || "0", 10),
    })
  );

  if (!assignmentId) {
    return <div>Assignment ID is missing in the query string.</div>;
  }

  if (!assignment) {
    return <div>Loading assignment...</div>;
  }

  return (
    <div>
      <h1>Assignment Page</h1>
      <CanvasAssignmentComponent assignment={assignment} />
    </div>
  );
};

export default AssignmentPage;
