import { db } from "../dbUtils";
import { canvasApi, paginatedRequest } from "./canvasServiceUtils";

export interface CanvasEnrollment {
  id: number;
  course_id: number;
  sis_course_id?: string;
  course_integration_id?: string;
  course_section_id?: number;
  section_integration_id?: string;
  sis_account_id?: string;
  sis_section_id?: string;
  sis_user_id?: string;
  enrollment_state?: string;
  limit_privileges_to_course_section?: boolean;
  sis_import_id?: number;
  root_account_id?: number;
  type?: string;
  user_id?: number;
  associated_user_id?: number;
  role?: string;
  role_id?: number;
  created_at?: string;
  updated_at?: string;
  start_at?: string;
  end_at?: string;
  last_activity_at?: string;
  last_attended_at?: string;
  total_activity_time?: number;
  html_url?: string;
  grades?: Record<string, unknown>;
  user?: Record<string, unknown>;
  override_grade?: string;
  override_score?: number;
  unposted_current_grade?: string;
  unposted_final_grade?: string;
  unposted_current_score?: string;
  unposted_final_score?: string;
  has_grading_periods?: boolean;
  totals_for_all_grading_periods_option?: boolean;
  current_grading_period_title?: string;
  current_grading_period_id?: number;
  current_period_override_grade?: string;
  current_period_override_score?: number;
  current_period_unposted_current_score?: number;
  current_period_unposted_final_score?: number;
  current_period_unposted_current_grade?: string;
  current_period_unposted_final_grade?: string;
}

async function getAllEnrollmentsInCourse(
  courseId: number
): Promise<CanvasEnrollment[]> {
  return paginatedRequest<CanvasEnrollment[]>({
    url: canvasApi + `/courses/${courseId}/enrollments`,
  });
}

export async function storeEnrollmentInDatabase(
  enrollment: CanvasEnrollment,
  syncJobId: number
) {
  await db.none(
    `insert into enrollments (
      id, course_id, sis_course_id, course_integration_id, course_section_id, section_integration_id, sis_account_id, sis_section_id, sis_user_id, enrollment_state, limit_privileges_to_course_section, sis_import_id, root_account_id, type, user_id, associated_user_id, role, role_id, created_at, updated_at, start_at, end_at, last_activity_at, last_attended_at, total_activity_time, html_url, grades, user, override_grade, override_score, unposted_current_grade, unposted_final_grade, unposted_current_score, unposted_final_score, has_grading_periods, totals_for_all_grading_periods_option, current_grading_period_title, current_grading_period_id, current_period_override_grade, current_period_override_score, current_period_unposted_current_score, current_period_unposted_final_score, current_period_unposted_current_grade, current_period_unposted_final_grade, sync_job_id, original_record
    ) values (
      $<id>, $<course_id>, $<sis_course_id>, $<course_integration_id>, $<course_section_id>, $<section_integration_id>, $<sis_account_id>, $<sis_section_id>, $<sis_user_id>, $<enrollment_state>, $<limit_privileges_to_course_section>, $<sis_import_id>, $<root_account_id>, $<type>, $<user_id>, $<associated_user_id>, $<role>, $<role_id>, $<created_at>, $<updated_at>, $<start_at>, $<end_at>, $<last_activity_at>, $<last_attended_at>, $<total_activity_time>, $<html_url>, $<grades>, $<user>, $<override_grade>, $<override_score>, $<unposted_current_grade>, $<unposted_final_grade>, $<unposted_current_score>, $<unposted_final_score>, $<has_grading_periods>, $<totals_for_all_grading_periods_option>, $<current_grading_period_title>, $<current_grading_period_id>, $<current_period_override_grade>, $<current_period_override_score>, $<current_period_unposted_current_score>, $<current_period_unposted_final_score>, $<current_period_unposted_current_grade>, $<current_period_unposted_final_grade>, $<sync_job_id>, $<json>
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
      sis_import_id = excluded.sis_import_id,
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
      grades = excluded.grades,
      user = excluded.user,
      override_grade = excluded.override_grade,
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
      ...enrollment,
      sync_job_id: syncJobId,
      json: enrollment,
    }
  );
}

export async function getEnrollmentsFromDatabaseByCourseId(
  courseId: number
): Promise<CanvasEnrollment[]> {
  const rows = await db.any(
    `select original_record as json from enrollments where course_id = $<courseId>`,
    { courseId }
  );
  return rows.map((row) => row.json);
}

export async function syncEnrollmentsForCourse(
  courseId: number,
  syncJobId: number
) {
  const enrollments = await getAllEnrollmentsInCourse(courseId);
  await Promise.all(
    enrollments.map(async (enrollment) => {
      await storeEnrollmentInDatabase(enrollment, syncJobId);
    })
  );
}
