import { useSearchParams } from "react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "../../server/trpc/trpcClient";

export const SubmissionPage = () => {
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get("assignmentId");

  const trpc = useTRPC();
  const { data: submissions, isError } = useSuspenseQuery(
    trpc.canvas.submissions.queryOptions({
      assignmentId: parseInt(assignmentId || "0", 10),
    })
  );

  if (!assignmentId) {
    return <div>Assignment ID is missing in the query string.</div>;
  }

  if (isError) {
    return (
      <div>Error loading submissions. Please check the Assignment ID.</div>
    );
  }

  if (!submissions) {
    return <div>Loading submissions...</div>;
  }

  return (
    <div>
      <h1>Submission Page</h1>
      <p>Details for Assignment ID: {assignmentId}</p>
      <pre>{JSON.stringify(submissions, null, 2)}</pre>
    </div>
  );
};
