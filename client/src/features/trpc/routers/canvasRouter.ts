import { z } from "zod";
import {
  syncCanvas,
  getAllCoursesFromDatabase,
} from "../../../services/canvas/canvasCourseService";
import { publicProcedure } from "../utils/trpc";
import { getAssignmentsFromDatabaseByCourseId } from "../../../services/canvas/canvasAssignmentService";

export const canvasRouter = {
  sync: publicProcedure.mutation(async () => {
    console.log("syncing canvas");
    await syncCanvas();
  }),
  courses: publicProcedure.query(async () => getAllCoursesFromDatabase()),
  assignments: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(({ input }) => getAssignmentsFromDatabaseByCourseId(input.courseId)),
};
