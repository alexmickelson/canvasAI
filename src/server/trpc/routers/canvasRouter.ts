import { z } from "zod";
import {
  syncAllCourses,
  getAllCoursesFromDatabase,
  CanvasCourseSchema,
} from "../../services/canvas/canvasCourseService";
import { publicProcedure } from "../utils/trpc";
import { getAssignmentsFromDatabaseByCourseId } from "../../services/canvas/canvasAssignmentService";
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
    .input(z.object({ courseId: z.number(), syncJobId: z.number().optional() }))
    .query(({ input }) =>
      getAssignmentsFromDatabaseByCourseId(input.courseId, input.syncJobId)
    ),

  assignment: publicProcedure
    .input(
      z.object({ assignmentId: z.number(), syncJobId: z.number().optional() })
    )
    .query(async ({ input }) => {
      const assignments = await getAssignmentsFromDatabaseByCourseId(
        input.assignmentId,
        input.syncJobId
      );
      return assignments.find(
        (assignment) => assignment.id === input.assignmentId
      );
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
    return await getTermsFromDatabase();
  }),

  modules: publicProcedure
    .input(z.object({ courseId: z.number(), syncJobId: z.number().optional() }))
    .query(async ({ input }) =>
      getModulesFromDatabase(input.courseId, input.syncJobId)
    ),

  assignmentSubmissions: publicProcedure
    .input(
      z.object({
        assignmentId: z.number(),
        syncJobId: z.coerce.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getSubmissionsFromDatabaseByAssignmentId(
        input.assignmentId,
        input.syncJobId
      );
    }),
  moduleSubmissions: publicProcedure
    .input(
      z.object({
        moduleId: z.number(),
        syncJobId: z.coerce.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getSubmissionsFromDatabaseByModuleId(
        input.moduleId,
        input.syncJobId
      );
    }),

  enrollments: publicProcedure
    .input(z.object({ courseId: z.number(), syncJobId: z.number().optional() }))
    .query(async ({ input }) => {
      return await getEnrollmentsFromDatabaseByCourseId(
        input.courseId,
        input.syncJobId
      );
    }),
};
