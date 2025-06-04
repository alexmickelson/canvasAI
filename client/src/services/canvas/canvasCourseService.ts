import { db } from "../dbUtils";
import { syncAssignmentsForCourse } from "./canvasAssignmentService";
import { canvasApi, paginatedRequest } from "./canvasServiceUtils";
import { z } from "zod";
import { syncTerms } from "./canvasTermService";
import { syncModulesForCourse } from "./canvasModuleService";

export const CanvasTermSchema = z.object({
  id: z.number(),
  name: z.string(),
  start_at: z.string(),
  end_at: z.string().nullable(),
});

export const CourseProgressSchema = z.object({
  requirement_count: z.number(),
  requirement_completed_count: z.number(),
  next_requirement_url: z.string().nullable(),
  completed_at: z.string().nullable(),
});

export const CalendarLinkSchema = z.object({
  ics: z.string(),
});

export const CanvasCourseSchema = z.object({
  id: z.number(),
  sis_course_id: z.string().nullable(),
  uuid: z.string(),
  integration_id: z.string().nullable(),
  sis_import_id: z.number().optional(),
  name: z.string(),
  course_code: z.string(),
  original_name: z.string().optional(),
  workflow_state: z.enum(["unpublished", "available", "completed", "deleted"]),
  account_id: z.number(),
  root_account_id: z.number(),
  enrollment_term_id: z.number(),
  grading_periods: z.unknown().optional(),
  grading_standard_id: z.number().optional(),
  grade_passback_setting: z.string().optional(),
  created_at: z.string(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  locale: z.string().optional(),
  enrollments: z.unknown().optional(),
  total_students: z.number().optional(),
  calendar: CalendarLinkSchema.nullable(),
  default_view: z.union([
    z.literal("feed"),
    z.literal("wiki"),
    z.literal("modules"),
    z.literal("assignments"),
    z.literal("syllabus"),
    z.string(),
  ]),
  syllabus_body: z.string().optional(),
  needs_grading_count: z.number().optional(),
  term: CanvasTermSchema.nullable(),
  course_progress: CourseProgressSchema.nullable(),
  apply_assignment_group_weights: z.boolean(),
  permissions: z.record(z.boolean()).optional(),
  is_public: z.boolean(),
  is_public_to_auth_users: z.boolean(),
  public_syllabus: z.boolean(),
  public_syllabus_to_auth: z.boolean(),
  public_description: z.string().optional(),
  storage_quota_mb: z.number(),
  storage_quota_used_mb: z.number(),
  hide_final_grades: z.boolean(),
  license: z.string().optional(),
  allow_student_assignment_edits: z.boolean(),
  allow_wiki_comments: z.boolean(),
  allow_student_forum_attachments: z.boolean(),
  open_enrollment: z.boolean(),
  self_enrollment: z.boolean(),
  restrict_enrollments_to_course_dates: z.boolean(),
  course_format: z.string().optional(),
  access_restricted_by_date: z.boolean().optional(),
  time_zone: z.string().optional(),
  blueprint: z.boolean().optional(),
  blueprint_restrictions: z.record(z.boolean()).optional(),
  blueprint_restrictions_by_object_type: z
    .record(z.record(z.boolean()))
    .optional(),
  template: z.boolean().optional(),
});

export type CanvasCourse = z.infer<typeof CanvasCourseSchema>;
export type CanvasTerm = z.infer<typeof CanvasTermSchema>;

async function getAllActiveCanvasCourses(): Promise<CanvasCourse[]> {
  const courses = await paginatedRequest<CanvasCourse[]>({
    url: `${canvasApi}/courses`,
    params: { enrollment_state: "active", include: "term" },
  });

  return courses;
}

async function storeCourseInDatabase(course: CanvasCourse) {
  await db.none(
    `insert into courses (id, name, term_id, original_record)
      values ($<id>, $<name>, $<term_id>, $<json>)
      on conflict (id) do nothing`,
    {
      id: course.id,
      name: course.name,
      term_id: course.enrollment_term_id,
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

export async function syncAllCourses() {
  const courses = await getAllActiveCanvasCourses();
  await syncTerms(courses);
  await Promise.all(
    courses.map(async (c) => {
      await storeCourseInDatabase(c);
      await syncAssignmentsForCourse(c.id);
      await syncModulesForCourse(c.id);
    })
  );
}
