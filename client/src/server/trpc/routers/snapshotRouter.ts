import { z } from "zod";
import { publicProcedure } from "../utils/trpc";
import {
  listAllSyncJobs,
  snapshotCanvasDataForTerm,
} from "../../services/canvas/canvasSnapshotService";

export const snapshotRouter = {
  runSnapshotForTerm: publicProcedure
    .input(z.object({ termName: z.string() }))
    .mutation(async ({ input }) => {
      await snapshotCanvasDataForTerm(input.termName);
    }),

  getSnapshots: publicProcedure.query(async () => {
    return await listAllSyncJobs();
  }),
};
