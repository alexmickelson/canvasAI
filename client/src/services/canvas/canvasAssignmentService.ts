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
    `insert into assignments (id, name, course_id, due_date, original_record)
      values ($<id>, $<name>, $<course_id>, $<due_date>, $<json>)
      on conflict (id) do update
      set name = excluded.name,
          course_id = excluded.course_id,
          due_date = excluded.due_date,
          original_record = excluded.original_record`,
    {
      id: assignment.id,
      name: assignment.name,
      course_id: assignment.course_id,
      due_date: assignment.due_at ? new Date(assignment.due_at) : null,
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
