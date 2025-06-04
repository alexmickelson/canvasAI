import pgpromise from "pg-promise";
import pgvector from "pgvector/pg-promise";


const pgp = pgpromise({
  async connect(e) {
    await pgvector.registerTypes(e.client);
  },
});
export const db = pgp("postgres://siteuser:postgresewvraer@db:5432/my_db");


