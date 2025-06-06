import { db } from "../dbUtils";
import { canvasApi, paginatedRequest } from "./canvasServiceUtils";
import { syncSubmissionsForAssignment } from "./canvasSubmissionsService";

export interface CanvasAssignment {
  id: number;
  name: string;
  description?: string;
  due_at?: string;
  unlock_at?: string;
  lock_at?: string;
  course_id: number;
  html_url: string;
  submission_types: string[];
  has_submitted_submissions: boolean;
  grading_type: string;
  points_possible: number;
  grading_standard_id?: number;
  published: boolean;
  muted: boolean;
  context_module_id?: number;
}

async function getAllAssignmentsInCourse(
  courseId: number
): Promise<CanvasAssignment[]> {
  return paginatedRequest<CanvasAssignment[]>({
    url: canvasApi + `/courses/${courseId}/assignments`,
  });
}

async function storeAssignmentInDatabase(assignment: CanvasAssignment) {
  await db.none(
    `insert into assignments (
      id, name, description, due_date, unlock_at, lock_at, course_id, html_url,
      submission_types, grading_type, points_possible, grading_standard_id,
      published, muted, context_module_id, original_record
    ) values (
      $<id>, $<name>, $<description>, $<due_at>, $<unlock_at>, $<lock_at>, $<course_id>, $<html_url>,
      $<submission_types>, $<grading_type>, $<points_possible>, $<grading_standard_id>,
      $<published>, $<muted>, $<context_module_id>, $<json>
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
      original_record = excluded.original_record`,
    {
      ...assignment,
      json: assignment,
    }
  );
}

export async function getAssignmentsFromDatabaseByCourseId(
  courseId: number
): Promise<CanvasAssignment[]> {
  const rows = await db.any(
    `select original_record as json
      from assignments
      where course_id = $<courseId>
      order by due_date asc`,
    { courseId }
  );
  return rows.map((row) => row.json);
}

export async function syncAssignmentsForCourse(courseId: number) {
  const assignments = await getAllAssignmentsInCourse(courseId);
  await Promise.all(
    assignments.map(async (assignment) => {
      await storeAssignmentInDatabase(assignment);
    })
  );
}

export const syncAllSubmissionsForCourse = async (courseId: number) => {
  const assignments = await getAllAssignmentsInCourse(courseId);
  await Promise.all(
    assignments.map(async (assignment) => {
      await syncSubmissionsForAssignment(assignment.id, courseId);
    })
  );
};
