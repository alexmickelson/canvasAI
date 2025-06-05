import { z } from "zod";
import {
  syncAllCourses,
  getAllCoursesFromDatabase,
  CanvasCourseSchema,
} from "../../services/canvas/canvasCourseService";
import { publicProcedure } from "../utils/trpc";
import {
  getAssignmentsFromDatabaseByCourseId,
  syncAllSubmissionsForCourse,
} from "../../services/canvas/canvasAssignmentService";
import {
  getTermsFromDatabase,
  syncTerms,
} from "../../services/canvas/canvasTermService";
import { getModulesFromDatabase } from "../../services/canvas/canvasModuleService";
import { getSubmissionsFromDatabaseByAssignmentId } from "../../services/canvas/canvasSubmissionsService";

export const canvasRouter = {
  sync: publicProcedure.mutation(async () => {
    console.log("syncing canvas");
    await syncAllCourses();
  }),

  courses: publicProcedure.query(async () => getAllCoursesFromDatabase()),

  assignments: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(({ input }) => getAssignmentsFromDatabaseByCourseId(input.courseId)),

  syncCourseSubmissions: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ input }) => {
      await syncAllSubmissionsForCourse(input.courseId);
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
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => getModulesFromDatabase(input.courseId)),

  submissions: publicProcedure
    .input(z.object({ assignmentId: z.number() }))
    .query(async ({ input }) => {
      return await getSubmissionsFromDatabaseByAssignmentId(input.assignmentId);
    }),
};
