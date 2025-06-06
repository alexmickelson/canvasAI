import { db } from "../dbUtils";
import { syncAssignmentsForCourse } from "./canvasAssignmentService";
import { canvasApi, paginatedRequest } from "./canvasServiceUtils";
import { z } from "zod";
import { syncTerms } from "./canvasTermService";
import { syncModulesForCourse } from "./canvasModuleService";

export const CanvasTermSchema = z.object({
  id: z.number(),
  name: z.string(),
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
});

export const CanvasCourseSchema = z.object({
  id: z.number(),
  sis_course_id: z.string().nullable().default(null),
  uuid: z.string(),
  integration_id: z.string().nullable().default(null),
  name: z.string(),
  course_code: z.string(),
  workflow_state: z.enum(["unpublished", "available", "completed", "deleted"]),
  enrollment_term_id: z.number(),
  created_at: z.string(),
  start_at: z.string().nullable().default(null),
  end_at: z.string().nullable().default(null),
  total_students: z.number().nullable().default(null),
  default_view: z.string(),
  needs_grading_count: z.number().nullable().default(null),
  public_description: z.string().nullable().default(null),
  hide_final_grades: z.boolean(),
  original_record: z.any(),
});

export type CanvasCourse = z.infer<typeof CanvasCourseSchema>;
export type CanvasTerm = z.infer<typeof CanvasTermSchema>;

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

async function getAllActiveCanvasCourses(): Promise<CanvasCourse[]> {
  const courses = await paginatedRequest<CanvasCourse[]>({
    url: `${canvasApi}/courses`,
    params: { enrollment_state: "active", include: "term" },
  });

  return courses;
}

async function storeCourseInDatabase(course: CanvasCourse) {
  await db.none(
    `insert into courses (
      id,
      sis_course_id,
      uuid,
      integration_id,
      name,
      course_code,
      workflow_state,
      enrollment_term_id,
      created_at,
      start_at,
      end_at,
      total_students,
      default_view,
      needs_grading_count,
      public_description,
      hide_final_grades,
      original_record
    ) values (
      $<id>,
      $<sis_course_id>,
      $<uuid>,
      $<integration_id>,
      $<name>,
      $<course_code>,
      $<workflow_state>,
      $<enrollment_term_id>,
      $<created_at>,
      $<start_at>,
      $<end_at>,
      $<total_students>,
      $<default_view>,
      $<needs_grading_count>,
      $<public_description>,
      $<hide_final_grades>,
      $<json>
    ) on conflict (id) do update set
      sis_course_id = excluded.sis_course_id,
      uuid = excluded.uuid,
      integration_id = excluded.integration_id,
      name = excluded.name,
      course_code = excluded.course_code,
      workflow_state = excluded.workflow_state,
      enrollment_term_id = excluded.enrollment_term_id,
      created_at = excluded.created_at,
      start_at = excluded.start_at,
      end_at = excluded.end_at,
      total_students = excluded.total_students,
      default_view = excluded.default_view,
      needs_grading_count = excluded.needs_grading_count,
      public_description = excluded.public_description,
      hide_final_grades = excluded.hide_final_grades,
      original_record = excluded.original_record`,
    {
      ...CanvasCourseSchema.parse(course),
      json: course,
    }
  );
}
