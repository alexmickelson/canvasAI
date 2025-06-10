import { db } from "../dbUtils";
import { syncAssignmentsAndSubmissionsForCourse } from "./canvasAssignmentService";
import {
  getAllCoursesFromDatabase,
  syncAllCourses,
} from "./canvasCourseService";
import { syncEnrollmentsForCourse } from "./canvasEnrollmentService";
import { syncModulesForCourse } from "./canvasModuleService";
import { getTermsFromDatabase } from "./canvasTermService";
import { z } from "zod";

export async function snapshotCanvasDataForTerm(termName: string) {
  const termCourses = await syncPrep(termName);
  const syncJob = await createSyncJob(termName);
  await Promise.all(
    termCourses.map(async (c) => {
      await syncEnrollmentsForCourse(c.id, syncJob.id);
      await syncModulesForCourse(c.id, syncJob.id);
      await syncAssignmentsAndSubmissionsForCourse(c.id, syncJob.id);
    })
  );
}

async function syncPrep(termName: string) {
  await syncAllCourses();
  const courses = await getAllCoursesFromDatabase();

  const terms = await getTermsFromDatabase();
  const term = terms.find((t) => t.name === termName);
  if (!term) {
    throw new Error(`Term with name "${termName}" not found`);
  }

  const termCourses = courses.filter(
    (course) => course.enrollment_term_id === term?.id
  );
  return termCourses;
}

const syncJobStatusEnum = z.enum(["started", "completed", "failed"]);
export type SyncJobStatus = z.infer<typeof syncJobStatusEnum>;

export const SyncJobSchema = z.object({
  id: z.number(),
  job_name: z.string(),
  status: syncJobStatusEnum,
  started_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable(),
  error_message: z.string().nullable(),
});
export type SyncJob = z.infer<typeof SyncJobSchema>;

export async function createSyncJob(jobName: string): Promise<SyncJob> {
  const result = await db.any<SyncJob>(
    `INSERT INTO sync_job (job_name, status) 
     VALUES ($<jobName>, $<status>) 
     RETURNING *`,
    { jobName, status: "started" }
  );
  return result[0];
}

export async function updateSyncJobStatus(
  jobId: number,
  status: SyncJobStatus,
  errorMessage: string | null = null
): Promise<SyncJob> {
  if (status === "completed") {
    const result = await db.any<SyncJob>(
      `UPDATE sync_job
        SET 
          status = $<status>,
          completed_at = NOW()
        WHERE id = $<jobId>
        RETURNING *`,
      { jobId, status, errorMessage }
    );
    return result[0];
  } else {
    const result = await db.any<SyncJob>(
      `UPDATE sync_job
        SET status = $<status>
        WHERE id = $<jobId>
        RETURNING *`,
      { jobId, status, errorMessage }
    );
    return result[0];
  }
}

export async function setJobMessage(
  jobId: number,
  message: string | null = null
): Promise<SyncJob> {
  const result = await db.any<SyncJob>(
    `UPDATE sync_job
        SET message = $<errorMessage>
        WHERE id = $<jobId>
        RETURNING *`,
    { jobId, message }
  );
  return result[0];
}
