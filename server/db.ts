import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

type Database = NodePgDatabase<typeof schema>;

let pool: pg.Pool | null = null;
let dbInstance: Database | null = null;
let hasWarnedMissingDatabaseUrl = false;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function requireDatabaseUrl() {
  if (!isDatabaseConfigured()) {
    if (!hasWarnedMissingDatabaseUrl) {
      console.warn(
        "[Database] DATABASE_URL is not set. Database-backed routes will stay unavailable until it is configured.",
      );
      hasWarnedMissingDatabaseUrl = true;
    }

    throw new Error("DATABASE_URL must be set before using database-backed features.");
  }

  return process.env.DATABASE_URL;
}

export function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: requireDatabaseUrl() });
  }

  return pool;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }

  return dbInstance;
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop, receiver);

    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { pool };
