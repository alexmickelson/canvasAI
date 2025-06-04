import {
  syncCanvas,
  getAllCoursesFromDatabase,
} from "../../../services/canvas/canvasCourseService";
import { publicProcedure } from "../utils/trpc";

export const canvasRouter = {
  sync: publicProcedure.mutation(async () => {
    console.log("syncing canvas");
    await syncCanvas();
  }),
  courses: publicProcedure.query(async () => getAllCoursesFromDatabase()),
};
