import { db } from "../dbUtils";
import { syncAssignmentsForCourse } from "./canvasAssignmentService";
import { canvasApi, paginatedRequest } from "./canvasServiceUtils";
import { z } from "zod";
import { syncTerms } from "./canvasTermService";
import { syncModulesForCourse } from "./canvasModuleService";

const CanvasTermSchema = z.object({
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
  account_id: z.number(),
  root_account_id: z.number(),
  enrollment_term_id: z.number(),
  grading_periods: z.any().nullable().default(null),
  grading_standard_id: z.number().nullable().default(null),
  grade_passback_setting: z.string().nullable().default(null),
  created_at: z.string(),
  start_at: z.string().nullable().default(null),
  end_at: z.string().nullable().default(null),
  enrollments: z.any().nullable().default(null),
  total_students: z.number().nullable().default(null),
  calendar: z
    .object({
      ics: z.string(),
    })
    .nullable()
    .default(null),
  default_view: z.string(),
  syllabus_body: z.string().nullable().default(null),
  needs_grading_count: z.number().nullable().default(null),
  term: CanvasTermSchema.nullable().default(null),
  course_progress: z
    .object({
      requirement_count: z.number(),
      requirement_completed_count: z.number(),
      next_requirement_url: z.string().nullable(),
      completed_at: z.string().nullable(),
    })
    .nullable()
    .default(null),
  apply_assignment_group_weights: z.boolean(),
  permissions: z.record(z.string(), z.boolean()).nullable().default(null),
  is_public: z.boolean(),
  is_public_to_auth_users: z.boolean(),
  public_syllabus: z.boolean(),
  public_syllabus_to_auth: z.boolean(),
  public_description: z.string().nullable().default(null),
  storage_quota_mb: z.number(),
  storage_quota_used_mb: z.number().nullable().default(null),
  hide_final_grades: z.boolean(),
  license: z.string().nullable().default(null),
  allow_student_assignment_edits: z.boolean().nullable().default(null),
  allow_wiki_comments: z.boolean().nullable().default(null),
  allow_student_forum_attachments: z.boolean().nullable().default(null),
  open_enrollment: z.boolean().nullable().default(null),
  self_enrollment: z.boolean().nullable().default(null),
  restrict_enrollments_to_course_dates: z.boolean(),
  course_format: z.string().nullable().default(null),
  access_restricted_by_date: z.boolean().nullable().default(null),
  time_zone: z.string().nullable().default(null),
  blueprint: z.boolean().nullable().default(null),
  blueprint_restrictions: z
    .record(z.string(), z.boolean())
    .nullable()
    .default(null),
  blueprint_restrictions_by_object_type: z
    .record(z.string(), z.any())
    .nullable()
    .default(null),
  template: z.boolean().nullable().default(null),
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
      account_id,
      root_account_id,
      enrollment_term_id,
      grading_standard_id,
      grade_passback_setting,
      created_at,
      start_at,
      end_at,
      total_students,
      default_view,
      syllabus_body,
      needs_grading_count,
      apply_assignment_group_weights,
      is_public,
      is_public_to_auth_users,
      public_syllabus,
      public_syllabus_to_auth,
      public_description,
      storage_quota_mb,
      storage_quota_used_mb,
      hide_final_grades,
      license,
      allow_student_assignment_edits,
      allow_wiki_comments,
      allow_student_forum_attachments,
      open_enrollment,
      self_enrollment,
      restrict_enrollments_to_course_dates,
      course_format,
      access_restricted_by_date,
      time_zone,
      blueprint,
      template,
      original_record
    ) values (
      $<id>,
      $<sis_course_id>,
      $<uuid>,
      $<integration_id>,
      $<name>,
      $<course_code>,
      $<workflow_state>,
      $<account_id>,
      $<root_account_id>,
      $<enrollment_term_id>,
      $<grading_standard_id>,
      $<grade_passback_setting>,
      $<created_at>,
      $<start_at>,
      $<end_at>,
      $<total_students>,
      $<default_view>,
      $<syllabus_body>,
      $<needs_grading_count>,
      $<apply_assignment_group_weights>,
      $<is_public>,
      $<is_public_to_auth_users>,
      $<public_syllabus>,
      $<public_syllabus_to_auth>,
      $<public_description>,
      $<storage_quota_mb>,
      $<storage_quota_used_mb>,
      $<hide_final_grades>,
      $<license>,
      $<allow_student_assignment_edits>,
      $<allow_wiki_comments>,
      $<allow_student_forum_attachments>,
      $<open_enrollment>,
      $<self_enrollment>,
      $<restrict_enrollments_to_course_dates>,
      $<course_format>,
      $<access_restricted_by_date>,
      $<time_zone>,
      $<blueprint>,
      $<template>,
      $<json>
    ) on conflict (id) do update set
      sis_course_id = excluded.sis_course_id,
      uuid = excluded.uuid,
      integration_id = excluded.integration_id,
      name = excluded.name,
      course_code = excluded.course_code,
      workflow_state = excluded.workflow_state,
      account_id = excluded.account_id,
      root_account_id = excluded.root_account_id,
      enrollment_term_id = excluded.enrollment_term_id,
      grading_standard_id = excluded.grading_standard_id,
      grade_passback_setting = excluded.grade_passback_setting,
      created_at = excluded.created_at,
      start_at = excluded.start_at,
      end_at = excluded.end_at,
      total_students = excluded.total_students,
      default_view = excluded.default_view,
      syllabus_body = excluded.syllabus_body,
      needs_grading_count = excluded.needs_grading_count,
      apply_assignment_group_weights = excluded.apply_assignment_group_weights,
      is_public = excluded.is_public,
      is_public_to_auth_users = excluded.is_public_to_auth_users,
      public_syllabus = excluded.public_syllabus,
      public_syllabus_to_auth = excluded.public_syllabus_to_auth,
      public_description = excluded.public_description,
      storage_quota_mb = excluded.storage_quota_mb,
      storage_quota_used_mb = excluded.storage_quota_used_mb,
      hide_final_grades = excluded.hide_final_grades,
      license = excluded.license,
      allow_student_assignment_edits = excluded.allow_student_assignment_edits,
      allow_wiki_comments = excluded.allow_wiki_comments,
      allow_student_forum_attachments = excluded.allow_student_forum_attachments,
      open_enrollment = excluded.open_enrollment,
      self_enrollment = excluded.self_enrollment,
      restrict_enrollments_to_course_dates = excluded.restrict_enrollments_to_course_dates,
      course_format = excluded.course_format,
      access_restricted_by_date = excluded.access_restricted_by_date,
      time_zone = excluded.time_zone,
      blueprint = excluded.blueprint,
      template = excluded.template,
      original_record = excluded.original_record
    `,
    {
      ...CanvasCourseSchema.parse(course),
      json: course,
    }
  );
}
