import pgpromise from "pg-promise";
import pgvector from "pgvector/pg-promise";

const pgp = pgpromise({
  async connect(e) {
    await pgvector.registerTypes(e.client);
  },
});
export const db = pgp("postgres://siteuser:postgresewvraer@db:5432/my_db");

export async function executeReadOnlySQL(sql: string) {
  return db.tx(
    { mode: new pgp.txMode.TransactionMode({ readOnly: true }) },
    async (t) => {
      return t.any(sql);
    }
  );
}

export async function listDbSchema() {
  const sql = `
    SELECT
      table_name,
      (
        SELECT string_agg(column_def, ', ' ORDER BY ordinal_position)
        FROM (
          SELECT
             column_name || ' ' || data_type ||
            COALESCE('(' || character_maximum_length || ')', '') ||
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END AS column_def,
            ordinal_position
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = t.table_name
        ) AS columns
      ) AS ddl
    FROM information_schema.tables t
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  return executeReadOnlySQL(sql);
}
