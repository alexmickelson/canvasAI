import { z } from "zod";
import {
  syncAllCourses,
  getAllCoursesFromDatabase,
  CanvasCourseSchema,
} from "../../services/canvas/canvasCourseService";
import { publicProcedure } from "../utils/trpc";
import {
  getAssignmentsFromDatabaseByAssignmentId,
  getAssignmentsFromDatabaseByCourseId,
} from "../../services/canvas/canvasAssignmentService";
import {
  getTermsFromDatabase,
  syncTerms,
} from "../../services/canvas/canvasTermService";
import { getModulesFromDatabase } from "../../services/canvas/canvasModuleService";
import {
  getSubmissionsFromDatabaseByAssignmentId,
  getSubmissionsFromDatabaseByModuleId,
} from "../../services/canvas/canvasSubmissionsService";
import { snapshotCanvasDataForTerm } from "../../services/canvas/canvasSnapshotService";
import { getEnrollmentsFromDatabaseByCourseId } from "../../services/canvas/canvasEnrollmentService";

export const canvasRouter = {
  sync: publicProcedure.mutation(async () => {
    console.log("syncing canvas");
    await syncAllCourses();
  }),

  courses: publicProcedure.query(async () => await getAllCoursesFromDatabase()),

  course: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const courses = await getAllCoursesFromDatabase();
      return courses.find((course) => course.id === input.courseId);
    }),

  assignments: publicProcedure
    .input(
      z.object({ courseId: z.number(), snapshotId: z.number().optional() })
    )
    .query(({ input }) =>
      getAssignmentsFromDatabaseByCourseId(input.courseId, input.snapshotId)
    ),

  assignment: publicProcedure
    .input(
      z.object({ assignmentId: z.number(), snapshotId: z.number().optional() })
    )
    .query(async ({ input }) => {
      const assignment = await getAssignmentsFromDatabaseByAssignmentId(
        input.assignmentId,
        input.snapshotId
      );

      return assignment;
    }),

  grabSnapshot: publicProcedure
    .input(z.object({ termName: z.string() }))
    .mutation(async ({ input }) => {
      await snapshotCanvasDataForTerm(input.termName);
    }),

  syncTerms: publicProcedure
    .input(z.object({ courses: CanvasCourseSchema.array() }))
    .mutation(async ({ input }) => {
      await syncTerms(input.courses);
      return { success: true };
    }),

  terms: publicProcedure.query(async () => {
    const terms = await getTermsFromDatabase();
    return terms.sort((a, b) => b.id - a.id);
  }),

  modules: publicProcedure
    .input(
      z.object({ courseId: z.number(), snapshotId: z.number().optional() })
    )
    .query(async ({ input }) =>
      getModulesFromDatabase(input.courseId, input.snapshotId)
    ),

  assignmentSubmissions: publicProcedure
    .input(
      z.object({
        assignmentId: z.number(),
        snapshotId: z.coerce.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getSubmissionsFromDatabaseByAssignmentId(
        input.assignmentId,
        input.snapshotId
      );
    }),
  moduleSubmissions: publicProcedure
    .input(
      z.object({
        moduleId: z.number(),
        snapshotId: z.coerce.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getSubmissionsFromDatabaseByModuleId(
        input.moduleId,
        input.snapshotId
      );
    }),

  enrollments: publicProcedure
    .input(
      z.object({ courseId: z.number(), snapshotId: z.number().optional() })
    )
    .query(async ({ input }) => {
      return await getEnrollmentsFromDatabaseByCourseId(
        input.courseId,
        input.snapshotId
      );
    }),
};
