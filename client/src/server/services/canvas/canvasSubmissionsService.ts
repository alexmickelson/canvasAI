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
  assignmentId: number,
  courseId: number
): Promise<CanvasSubmission[]> {
  return paginatedRequest<CanvasSubmission[]>({
    url:
      canvasApi +
      `/courses/${courseId}/assignments/${assignmentId}/submissions`,
  });
}

async function storeSubmissionInDatabase(
  submission: CanvasSubmission,
  syncJobId: number
) {
  await db.none(
    `insert into submissions (
      id,
      assignment_id,
      user_id,
      submitted_at,
      score,
      grade,
      workflow_state,
      attempt,
      late,
      missing,
      sync_job_id,
      original_record
    ) values (
      $<id>,
      $<assignment_id>,
      $<user_id>,
      $<submitted_at>,
      $<score>,
      $<grade>,
      $<workflow_state>,
      $<attempt>,
      $<late>,
      $<missing>,
      $<sync_job_id>,
      $<json>
    ) on conflict (id) do update
    set 
      assignment_id = excluded.assignment_id,
      user_id = excluded.user_id,
      submitted_at = excluded.submitted_at,
      score = excluded.score,
      grade = excluded.grade,
      workflow_state = excluded.workflow_state,
      attempt = excluded.attempt,
      late = excluded.late,
      missing = excluded.missing,
      sync_job_id = excluded.sync_job_id,
      original_record = excluded.original_record`,
    {
      id: submission.id,
      assignment_id: submission.assignment_id,
      user_id: submission.user_id,
      submitted_at: submission.submitted_at,
      score: submission.score,
      grade: submission.grade,
      workflow_state: submission.workflow_state,
      attempt: submission.attempt,
      late: submission.late,
      missing: submission.missing,
      sync_job_id: syncJobId,
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

export async function syncSubmissionsForAssignment(
  assignmentId: number,
  courseId: number,
  syncJobId: number
) {
  const submissions = await getAllSubmissionsForAssignment(
    assignmentId,
    courseId
  );
  await Promise.all(
    submissions.map(async (submission) => {
      await storeSubmissionInDatabase(submission, syncJobId);
    })
  );
}

export async function getSubmissionScoreAndClassAverage(
  submissionId: number
): Promise<{
  userSubmission: CanvasSubmission | null;
  classAverage: number | null;
}> {
  const result = await db.query(
    `SELECT 
      (SELECT original_record FROM submissions WHERE id = $<submissionId>) AS user_submission,
      (SELECT COALESCE(AVG(score), 0) FROM submissions WHERE assignment_id = (SELECT assignment_id FROM submissions WHERE id = $<submissionId>)) AS class_average`,
    { submissionId }
  );

  return {
    userSubmission: result.rows[0]?.user_submission ?? null,
    classAverage: result.rows[0]?.class_average,
  };
}
