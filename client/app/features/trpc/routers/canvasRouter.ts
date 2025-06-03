import {
  getAllCoursesFromDatabase,
  syncCanvas,
} from "~/services/canvas/canvasCourseService";
import { publicProcedure } from "../utils/trpc";

export const canvasRouter = {
  sync: publicProcedure.mutation(async () => {
    await syncCanvas();
  }),
  courses: publicProcedure.query(getAllCoursesFromDatabase),
};
