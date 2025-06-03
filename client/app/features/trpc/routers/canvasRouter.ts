import { getAllActiveCanvasCourses } from "~/services/canvasSyncService";
import { publicProcedure } from "../utils/trpc";

export const canvasRouter = {
  courses: publicProcedure.query(async () => {
    return await getAllActiveCanvasCourses();
  }),
};
