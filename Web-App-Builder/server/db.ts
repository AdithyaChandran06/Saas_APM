import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as baseSchema from "@shared/schema";
import * as extendedSchema from "@shared/schema-extended";

const { Pool } = pg;

function getSqlState(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const directCode = (error as { code?: string }).code;
  if (directCode) {
    return directCode;
  }

  const causeCode = (error as { cause?: { code?: string } }).cause?.code;
  return causeCode;
}

export let hasDatabase = Boolean(process.env.DATABASE_URL);
export let pool = hasDatabase
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

if (pool) {
  // Prevent unhandled 'error' events from crashing the process when Postgres restarts.
  pool.on("error", (error) => {
    console.warn("Postgres pool emitted an error. Existing connections will be retried as needed.", error);
  });
}

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

export type AppDb = NonNullable<typeof db>;

export async function verifyDatabaseConnection(): Promise<boolean> {
  if (!pool) {
    return false;
  }

  try {
    await pool.query("SELECT 1");
    if (db) {
      try {
        await migrate(db, { migrationsFolder: "migrations" });
      } catch (migrationError) {
        if (getSqlState(migrationError) !== "42P07") {
          throw migrationError;
        }
        console.warn("Database tables already exist; skipping initial migration replay.");
      }
    }
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
