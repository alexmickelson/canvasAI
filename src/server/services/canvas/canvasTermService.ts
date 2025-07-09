import { db } from "../dbUtils";
import type { CanvasCourse, CanvasTerm } from "./canvasCourseService";
import { CanvasTermSchema } from "./canvasCourseService";

async function storeTermInDatabase(term: CanvasTerm) {
  await db.none(
    `insert into terms (id, name, original_record)
      values ($<id>, $<name>, $<json>)
      on conflict (id) do update
      set name = excluded.name,
          original_record = excluded.original_record`,
    {
      id: term.id,
      name: term.name,
      json: term,
    }
  );
}

export async function getTermsFromDatabase(): Promise<CanvasTerm[]> {
  const rows = await db.any(
    `select original_record as json
      from terms
      order by id desc`
  );
  return rows.map((row) => CanvasTermSchema.parse(row.json));
}

export async function syncTerms(courses: CanvasCourse[]) {
  const termIds = [...new Set(courses.map((c) => c.enrollment_term_id))];

  const terms = termIds
    .map((id) => courses.find((c) => c.enrollment_term_id === id && c.term))
    .filter((c) => c?.term)
    .map((c) => c!.term!);

  await Promise.all(
    terms.map(async (term) => {
      await storeTermInDatabase(term);
    })
  );
}
