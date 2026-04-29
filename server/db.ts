import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Force bypass for self-signed certificates in all environments (handles local proxy/antivirus and Supabase SSL strictness)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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
    const connectionString = requireDatabaseUrl();
    const isLocal = connectionString?.includes("localhost") || connectionString?.includes("127.0.0.1");
    
    // Explicitly set SSL for cloud environments to handle self-signed certs (Supabase)
    const sslConfig = isLocal ? false : { 
      rejectUnauthorized: false
    };

    console.log(`[Database] Initializing pool with SSL: ${!isLocal}`);
    
    pool = new Pool({ 
      connectionString,
      ssl: sslConfig,
      max: 10, // Limit connections for Pooler compatibility
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
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
