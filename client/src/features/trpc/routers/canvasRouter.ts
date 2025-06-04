import { z } from "zod";
import {
  syncCourseInTerm,
  getAllCoursesFromDatabase,
  CanvasCourseSchema,
} from "../../../services/canvas/canvasCourseService";
import { publicProcedure } from "../utils/trpc";
import {
  getAssignmentsFromDatabaseByCourseId,
  syncAllSubmissionsForCourse,
} from "../../../services/canvas/canvasAssignmentService";
import {
  getTermsFromDatabase,
  syncTerms,
} from "../../../services/canvas/canvasTermService";

export const canvasRouter = {
  sync: publicProcedure.mutation(async () => {
    console.log("syncing canvas");
    await syncCourseInTerm();
  }),
  courses: publicProcedure.query(async () => getAllCoursesFromDatabase()),
  assignments: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(({ input }) => getAssignmentsFromDatabaseByCourseId(input.courseId)),
  syncCourseSubmissions: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(({ input }) => syncAllSubmissionsForCourse(input.courseId)),
  syncTerms: publicProcedure
    .input(z.object({ courses: CanvasCourseSchema.array() }))
    .mutation(async ({ input }) => {
      await syncTerms(input.courses);
      return { success: true };
    }),
  terms: publicProcedure.query(async () => {
    return await getTermsFromDatabase();
  }),
};
