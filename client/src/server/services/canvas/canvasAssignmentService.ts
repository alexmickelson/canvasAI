import { db } from "../dbUtils";
import { canvasApi, paginatedRequest } from "./canvasServiceUtils";
import { getLatestSyncJob } from "./canvasSnapshotService";
import { syncSubmissionsForAssignment } from "./canvasSubmissionsService";
import { z } from "zod";

export const CanvasAssignmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().default(null),
  due_at: z.string().nullable().default(null),
  unlock_at: z.string().nullable().default(null),
  lock_at: z.string().nullable().default(null),
  course_id: z.number(),
  html_url: z.string(),
  submission_types: z.array(z.string()),
  has_submitted_submissions: z.boolean(),
  grading_type: z.string(),
  points_possible: z.number().nullable().default(null),
  grading_standard_id: z.number().nullable().default(null),
  published: z.boolean(),
  muted: z.boolean(),
  context_module_id: z.number().nullable().default(null),
});

export type CanvasAssignment = z.infer<typeof CanvasAssignmentSchema>;

async function getAllAssignmentsInCourse(
  courseId: number
): Promise<CanvasAssignment[]> {
  return paginatedRequest<CanvasAssignment[]>({
    url: canvasApi + `/courses/${courseId}/assignments`,
  });
}

async function storeAssignmentInDatabase(
  assignment: CanvasAssignment,
  syncJobId: number
) {
  await db.none(
    `insert into assignments (
      id, name, description, due_date, unlock_at, lock_at, course_id, html_url,
      submission_types, grading_type, points_possible, grading_standard_id,
      published, muted, context_module_id, sync_job_id, original_record
    ) values (
      $<id>, $<name>, $<description>, $<due_at>, $<unlock_at>, $<lock_at>, $<course_id>, $<html_url>,
      $<submission_types>, $<grading_type>, $<points_possible>, $<grading_standard_id>,
      $<published>, $<muted>, $<context_module_id>, $<sync_job_id>, $<json>
    ) on conflict (id) do update
    set 
      name = excluded.name,
      description = excluded.description,
      due_date = excluded.due_date,
      unlock_at = excluded.unlock_at,
      lock_at = excluded.lock_at,
      course_id = excluded.course_id,
      html_url = excluded.html_url,
      submission_types = excluded.submission_types,
      grading_type = excluded.grading_type,
      points_possible = excluded.points_possible,
      grading_standard_id = excluded.grading_standard_id,
      published = excluded.published,
      muted = excluded.muted,
      context_module_id = excluded.context_module_id,
      sync_job_id = excluded.sync_job_id,
      original_record = excluded.original_record`,
    {
      ...CanvasAssignmentSchema.parse(assignment),
      sync_job_id: syncJobId,
      json: assignment,
    }
  );
}
export async function getAssignmentsFromDatabaseByCourseId(
  courseId: number,
  syncJobId?: number
): Promise<CanvasAssignment[]> {
  const latestSyncId = syncJobId ? syncJobId : await getLatestSyncJob();
  const rows = await db.any(
    `select original_record as json
      from assignments
      where course_id = $<courseId>
        and sync_job_id = $<syncJobId>
      order by due_date asc`,
    { courseId, syncJobId: latestSyncId }
  );
  return rows.map((row) => row.json);
}

export async function syncAssignmentsAndSubmissionsForCourse(
  courseId: number,
  syncJobId: number
) {
  const assignments = await getAllAssignmentsInCourse(courseId);
  await Promise.all(
    assignments.map(async (assignment) => {
      await storeAssignmentInDatabase(assignment, syncJobId);
      await syncSubmissionsForAssignment(assignment.id, courseId, syncJobId);
    })
  );
}
