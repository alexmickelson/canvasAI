import { db } from "../dbUtils";
import { canvasApi, paginatedRequest } from "./canvasServiceUtils";

export interface CanvasSubmission {
  id: number;
  assignment_id: number;
  user_id: number;
  submitted_at?: string;
  score?: number;
  grade?: string;
  workflow_state: string;
  attempt: number;
  late: boolean;
  missing: boolean;
}

async function getAllSubmissionsForAssignment(
  assignmentId: number
): Promise<CanvasSubmission[]> {
  return paginatedRequest<CanvasSubmission[]>({
    url: canvasApi + `/course/${courseId}/assignments/${assignmentId}/submissions`,
  });
}

async function storeSubmissionInDatabase(submission: CanvasSubmission) {
  await db.none(
    `insert into submissions (id, assignment_id, user_id, original_record)
      values ($<id>, $<assignment_id>, $<user_id>, $<json>)
      on conflict (id) do nothing`,
    {
      id: submission.id,
      assignment_id: submission.assignment_id,
      user_id: submission.user_id,
      json: submission,
    }
  );
}

export async function getSubmissionsFromDatabaseByAssignmentId(
  assignmentId: number
): Promise<CanvasSubmission[]> {
  const rows = await db.any(
    `select original_record as json
      from submissions
      where assignment_id = $<assignmentId>`,
    { assignmentId }
  );
  return rows.map((row) => row.json);
}

export async function syncSubmissionsForAssignment(assignmentId: number) {
  const submissions = await getAllSubmissionsForAssignment(assignmentId);
  await Promise.all(
    submissions.map(async (submission) => {
      await storeSubmissionInDatabase(submission);
    })
  );
}