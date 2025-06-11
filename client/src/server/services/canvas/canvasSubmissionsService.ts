import { db } from "../dbUtils";
import {
  CanvasAssignmentSchema,
  type CanvasAssignment,
} from "./canvasAssignmentService";
import { canvasApi, paginatedRequest } from "./canvasServiceUtils";
import { z } from "zod";

export const CanvasSubmissionSchema = z.object({
  id: z.number(),
  assignment_id: z.number(),
  user_id: z.number(),
  submitted_at: z.string().nullable().optional(),
  score: z.number().nullable().optional(),
  grade: z.string().nullable().optional(),
  workflow_state: z.string(),
  attempt: z.number().nullable().optional(),
  late: z.boolean(),
  missing: z.boolean(),
});
export type CanvasSubmission = z.infer<typeof CanvasSubmissionSchema>;

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
  const validated = CanvasSubmissionSchema.parse(submission);
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
      id: validated.id,
      assignment_id: validated.assignment_id,
      user_id: validated.user_id,
      submitted_at: validated.submitted_at,
      score: validated.score,
      grade: validated.grade,
      workflow_state: validated.workflow_state,
      attempt: validated.attempt,
      late: validated.late,
      missing: validated.missing,
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
  return rows.map((row) => CanvasSubmissionSchema.parse(row.json));
}

export async function getSubmissionsFromDatabaseByModuleId(
  moduleId: number
): Promise<
  { assignment: CanvasAssignment; submissions: CanvasSubmission[] }[]
> {
  const assignmentSubmissions = await db.any(
    `SELECT 
      a.original_record AS assignment,
      COALESCE(json_agg(s.original_record), '[]') AS submissions
     FROM assignments a
      JOIN module_items mi ON mi.content_id = a.id AND mi.type = 'Assignment'
      JOIN modules m ON mi.module_id = m.id
      LEFT JOIN submissions s ON s.assignment_id = a.id
     WHERE m.id = $<moduleId>
     GROUP BY a.original_record`,
    { moduleId }
  );
  // console.log(submissions);
  return assignmentSubmissions.map((row) => ({
    submissions: row.submissions.map((s: unknown) =>
      CanvasSubmissionSchema.parse(s)
    ),
    assignment: CanvasAssignmentSchema.parse(row.assignment),
  }));
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
    userSubmission: result.rows[0]?.user_submission
      ? CanvasSubmissionSchema.parse(result.rows[0].user_submission)
      : null,
    classAverage: result.rows[0]?.class_average,
  };
}
