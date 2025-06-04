import { db } from "../dbUtils";
import { syncAssignmentsForCourse } from "./canvasAssignmentService";
import { canvasApi, paginatedRequest } from "./canvasServiceUtils";

export interface Term {
  id: number;
  name: string;
  start_at: string;
  end_at: string | null;
}

export interface CourseProgress {
  requirement_count: number;
  requirement_completed_count: number;
  next_requirement_url: string | null;
  completed_at: string | null;
}

export interface CalendarLink {
  ics: string;
}

export interface CanvasCourse {
  id: number;
  sis_course_id?: string | null;
  uuid: string;
  integration_id?: string | null;
  sis_import_id?: number;
  name: string;
  course_code: string;
  original_name?: string;
  workflow_state: "unpublished" | "available" | "completed" | "deleted";
  account_id: number;
  root_account_id: number;
  enrollment_term_id: number;
  grading_periods?: unknown;
  grading_standard_id?: number;
  grade_passback_setting?: string;
  created_at: string;
  start_at?: string;
  end_at?: string;
  locale?: string;
  enrollments?: unknown;
  total_students?: number;
  calendar?: CalendarLink | null;
  default_view:
    | "feed"
    | "wiki"
    | "modules"
    | "assignments"
    | "syllabus"
    | string;
  syllabus_body?: string;
  needs_grading_count?: number;
  term?: Term | null;
  course_progress?: CourseProgress | null;
  apply_assignment_group_weights: boolean;
  permissions?: Record<string, boolean>;
  is_public: boolean;
  is_public_to_auth_users: boolean;
  public_syllabus: boolean;
  public_syllabus_to_auth: boolean;
  public_description?: string;
  storage_quota_mb: number;
  storage_quota_used_mb: number;
  hide_final_grades: boolean;
  license?: string;
  allow_student_assignment_edits: boolean;
  allow_wiki_comments: boolean;
  allow_student_forum_attachments: boolean;
  open_enrollment: boolean;
  self_enrollment: boolean;
  restrict_enrollments_to_course_dates: boolean;
  course_format?: string;
  access_restricted_by_date?: boolean;
  time_zone?: string;
  blueprint?: boolean;
  blueprint_restrictions?: Record<string, boolean>;
  blueprint_restrictions_by_object_type?: Record<
    string,
    Record<string, boolean>
  >;
  template?: boolean;
}

async function getAllActiveCanvasCourses(): Promise<CanvasCourse[]> {
  const courses = await paginatedRequest<CanvasCourse[]>({
    url: `${canvasApi}/courses`,
    params: { enrollment_state: "active" },
  });

  return courses;
}

async function storeCourseInDatabase(course: CanvasCourse) {
  await db.none(
    `insert into courses (id, name, original_record)
      values ($<id>, $<name>, $<json>)
      on conflict (id) do nothing`,
    {
      id: course.id,
      name: course.name,
      json: course,
    }
  );
}

export async function getAllCoursesFromDatabase(): Promise<CanvasCourse[]> {
  const rows = await db.any(
    `select original_record as json
      from courses`
  );
  return rows.map((row) => row.json);
}

export async function syncCanvas() {
  const courses = await getAllActiveCanvasCourses();
  await Promise.all(
    courses.map(async (c) => {
      await storeCourseInDatabase(c);
      await syncAssignmentsForCourse(c.id);
    })
  );
}
