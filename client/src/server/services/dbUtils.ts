import pgpromise from "pg-promise";
import pgvector from "pgvector/pg-promise";

const pgp = pgpromise({
  async connect(e) {
    await pgvector.registerTypes(e.client);
  },
});
export const db = pgp("postgres://siteuser:postgresewvraer@db:5432/my_db");


db.$config.options.error = (err, e) => {
  console.error("Database error:", err);
  if (e && e.query) {
    console.error("Failed query:", e.query);
    if (e.params) {
      console.error("Query parameters:", e.params);
    }
  }
};

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
    SELECT *
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
  `;
  return executeReadOnlySQL(sql);
}
