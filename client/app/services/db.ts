import pgpromise from "pg-promise";
import pgvector from "pgvector/pg-promise";
import { z } from "zod";


const pgp = pgpromise({
  async connect(e) {
    await pgvector.registerTypes(e.client);
  },
});
const db = pgp("postgres://siteuser:postgresewvraer@db:5432/my_db");