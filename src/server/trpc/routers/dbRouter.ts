import { z } from "zod";
import { executeReadOnlySQL, listDbSchema } from "../../services/dbUtils";
import { publicProcedure } from "../utils/trpc";

export const dbRouter = {
  runSQL: publicProcedure
    .input(
      z.object({
        query: z.string(),
        parameters: z.record(z.any()).optional(),
      })
    )
    .query(async ({ input }) => {
      const result = await executeReadOnlySQL(input.query, input.parameters);
      return result;
    }),

  listDbSchema: publicProcedure.query(async () => {
    return await listDbSchema();
  }),
};
