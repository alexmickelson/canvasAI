import { db } from "../dbUtils";
import { canvasApi, paginatedRequest } from "./canvasServiceUtils";

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
    `insert into assignments (id, name, course_id, original_record)
      values ($<id>, $<name>, $<course_id>, $<json>)
      on conflict (id) do nothing`,
    {
      id: assignment.id,
      name: assignment.name,
      course_id: assignment.course_id,
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
      where course_id = $<courseId>`,
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
