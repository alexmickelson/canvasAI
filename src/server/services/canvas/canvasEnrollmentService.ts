import { db } from "../dbUtils";
import { canvasApi, paginatedRequest } from "./canvasServiceUtils";
import { z } from "zod";
import { getLatestSyncJob } from "./canvasSnapshotService";

export const CanvasEnrollmentSchema = z.object({
  id: z.number(),
  course_id: z.number(),
  sis_course_id: z.string().nullable().optional().default(null),
  course_integration_id: z.string().nullable().optional().default(null),
  course_section_id: z.number().nullable().optional().default(null),
  section_integration_id: z.string().nullable().optional().default(null),
  sis_account_id: z.string().nullable().optional().default(null),
  sis_section_id: z.string().nullable().optional().default(null),
  sis_user_id: z.string().nullable().optional().default(null),
  enrollment_state: z.string().nullable().optional().default(null),
  limit_privileges_to_course_section: z
    .boolean()
    .nullable()
    .optional()
    .default(null),
  sis_import_id: z.number().nullable().optional().default(null),
  root_account_id: z.number().nullable().optional().default(null),
  type: z.string().nullable().optional().default(null),
  user_id: z.number().nullable().optional().default(null),
  associated_user_id: z.number().nullable().optional().default(null),
  role: z.string().nullable().optional().default(null),
  role_id: z.number().nullable().optional().default(null),
  created_at: z.string().nullable().optional().default(null),
  updated_at: z.string().nullable().optional().default(null),
  start_at: z.string().nullable().optional().default(null),
  end_at: z.string().nullable().optional().default(null),
  last_activity_at: z.string().nullable().optional().default(null),
  last_attended_at: z.string().nullable().optional().default(null),
  total_activity_time: z.number().nullable().optional().default(null),
  html_url: z.string().nullable().optional().default(null),
  grades: z.record(z.unknown()).nullable().optional().default(null),
  user: z.record(z.unknown()).nullable().optional().default(null),
  override_grade: z.string().nullable().optional().default(null),
  override_score: z.number().nullable().optional().default(null),
  unposted_current_grade: z.string().nullable().optional().default(null),
  unposted_final_grade: z.string().nullable().optional().default(null),
  unposted_current_score: z.string().nullable().optional().default(null),
  unposted_final_score: z.string().nullable().optional().default(null),
  has_grading_periods: z.boolean().nullable().optional().default(null),
  totals_for_all_grading_periods_option: z
    .boolean()
    .nullable()
    .optional()
    .default(null),
  current_grading_period_title: z.string().nullable().optional().default(null),
  current_grading_period_id: z.number().nullable().optional().default(null),
  current_period_override_grade: z.string().nullable().optional().default(null),
  current_period_override_score: z.number().nullable().optional().default(null),
  current_period_unposted_current_score: z
    .number()
    .nullable()
    .optional()
    .default(null),
  current_period_unposted_final_score: z
    .number()
    .nullable()
    .optional()
    .default(null),
  current_period_unposted_current_grade: z
    .string()
    .nullable()
    .optional()
    .default(null),
  current_period_unposted_final_grade: z
    .string()
    .nullable()
    .optional()
    .default(null),
  original_record: z.record(z.unknown()).nullable().optional().default(null),
  sync_job_id: z.number().nullable().optional().default(null),
});

export type CanvasEnrollment = z.infer<typeof CanvasEnrollmentSchema>;

async function getAllEnrollmentsInCourse(
  courseId: number
): Promise<CanvasEnrollment[]> {
  return paginatedRequest<CanvasEnrollment[]>({
    url: canvasApi + `/courses/${courseId}/enrollments`,
  });
}

export async function storeEnrollmentInDatabase(
  enrollment: CanvasEnrollment,
  snapshotId: number
) {
  const validated = CanvasEnrollmentSchema.parse(enrollment);
  await db.none(
    `insert into enrollments (
      id,
      course_id,
      sis_course_id,
      course_integration_id,
      course_section_id,
      section_integration_id,
      sis_account_id,
      sis_section_id,
      sis_user_id,
      enrollment_state,
      limit_privileges_to_course_section,
      root_account_id,
      type,
      user_id,
      associated_user_id,
      role,
      role_id,
      created_at,
      updated_at,
      start_at,
      end_at,
      last_activity_at,
      last_attended_at,
      total_activity_time,
      html_url,
      "user",
      override_score,
      unposted_current_grade,
      unposted_final_grade,
      unposted_current_score,
      unposted_final_score,
      has_grading_periods,
      totals_for_all_grading_periods_option,
      current_grading_period_title,
      current_grading_period_id,
      current_period_override_grade,
      current_period_override_score,
      current_period_unposted_current_score,
      current_period_unposted_final_score,
      current_period_unposted_current_grade,
      current_period_unposted_final_grade,
      sync_job_id,
      original_record
    ) values (
      $<id>,
      $<course_id>,
      $<sis_course_id>,
      $<course_integration_id>,
      $<course_section_id>,
      $<section_integration_id>,
      $<sis_account_id>,
      $<sis_section_id>,
      $<sis_user_id>,
      $<enrollment_state>,
      $<limit_privileges_to_course_section>,
      $<root_account_id>,
      $<type>,
      $<user_id>,
      $<associated_user_id>,
      $<role>,
      $<role_id>,
      $<created_at>,
      $<updated_at>,
      $<start_at>,
      $<end_at>,
      $<last_activity_at>,
      $<last_attended_at>,
      $<total_activity_time>,
      $<html_url>,
      $<user>,
      $<override_score>,
      $<unposted_current_grade>,
      $<unposted_final_grade>,
      $<unposted_current_score>,
      $<unposted_final_score>,
      $<has_grading_periods>,
      $<totals_for_all_grading_periods_option>,
      $<current_grading_period_title>,
      $<current_grading_period_id>,
      $<current_period_override_grade>,
      $<current_period_override_score>,
      $<current_period_unposted_current_score>,
      $<current_period_unposted_final_score>,
      $<current_period_unposted_current_grade>,
      $<current_period_unposted_final_grade>,
      $<sync_job_id>,
      $<json>
    ) on conflict (id) do update
    set 
      course_id = excluded.course_id,
      sis_course_id = excluded.sis_course_id,
      course_integration_id = excluded.course_integration_id,
      course_section_id = excluded.course_section_id,
      section_integration_id = excluded.section_integration_id,
      sis_account_id = excluded.sis_account_id,
      sis_section_id = excluded.sis_section_id,
      sis_user_id = excluded.sis_user_id,
      enrollment_state = excluded.enrollment_state,
      limit_privileges_to_course_section = excluded.limit_privileges_to_course_section,
      root_account_id = excluded.root_account_id,
      type = excluded.type,
      user_id = excluded.user_id,
      associated_user_id = excluded.associated_user_id,
      role = excluded.role,
      role_id = excluded.role_id,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      start_at = excluded.start_at,
      end_at = excluded.end_at,
      last_activity_at = excluded.last_activity_at,
      last_attended_at = excluded.last_attended_at,
      total_activity_time = excluded.total_activity_time,
      html_url = excluded.html_url,
      "user" = excluded.user,
      override_score = excluded.override_score,
      unposted_current_grade = excluded.unposted_current_grade,
      unposted_final_grade = excluded.unposted_final_grade,
      unposted_current_score = excluded.unposted_current_score,
      unposted_final_score = excluded.unposted_final_score,
      has_grading_periods = excluded.has_grading_periods,
      totals_for_all_grading_periods_option = excluded.totals_for_all_grading_periods_option,
      current_grading_period_title = excluded.current_grading_period_title,
      current_grading_period_id = excluded.current_grading_period_id,
      current_period_override_grade = excluded.current_period_override_grade,
      current_period_override_score = excluded.current_period_override_score,
      current_period_unposted_current_score = excluded.current_period_unposted_current_score,
      current_period_unposted_final_score = excluded.current_period_unposted_final_score,
      current_period_unposted_current_grade = excluded.current_period_unposted_current_grade,
      current_period_unposted_final_grade = excluded.current_period_unposted_final_grade,
      sync_job_id = excluded.sync_job_id,
      original_record = excluded.original_record`,
    {
      ...validated,
      sync_job_id: snapshotId,
      json: enrollment,
    }
  );
}

export async function getEnrollmentsFromDatabaseByCourseId(
  courseId: number,
  snapshotId?: number
): Promise<CanvasEnrollment[]> {
  const latestSyncId = snapshotId ? snapshotId : (await getLatestSyncJob()).id;
  const rows = await db.any(
    `select * 
      from enrollments 
      where course_id = $<courseId> 
        and sync_job_id = $<snapshotId>
    `,
    { courseId, snapshotId: latestSyncId }
  );
  return rows.map((row) => CanvasEnrollmentSchema.parse(row.json));
}

export async function syncEnrollmentsForCourse(
  courseId: number,
  snapshotId: number
) {
  const enrollments = await getAllEnrollmentsInCourse(courseId);
  await Promise.all(
    enrollments.map(async (enrollment) => {
      await storeEnrollmentInDatabase(enrollment, snapshotId);
    })
  );
}
