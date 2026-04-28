import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as baseSchema from "@shared/schema";
import * as extendedSchema from "@shared/schema-extended";

const { Pool } = pg;

export let hasDatabase = Boolean(process.env.DATABASE_URL);
export let pool = hasDatabase
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

// In local/dev fallback mode we run without a database.
export let db =
  hasDatabase && pool
    ? drizzle(pool, {
        schema: {
          ...baseSchema,
          ...extendedSchema,
        },
      })
    : null;

export async function verifyDatabaseConnection(): Promise<boolean> {
  if (!pool) {
    return false;
  }

  try {
    await pool.query("SELECT 1");
    return true;
  } catch (err) {
    console.warn("Postgres is unavailable, falling back to in-memory storage.", err);
    hasDatabase = false;
    db = null;
    try {
      await pool.end();
    } catch {
      // ignore pool teardown errors
    }
    pool = null;
    return false;
  }
}
