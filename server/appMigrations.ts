import fs from "fs/promises";
import path from "path";
import { pool } from "./db";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "migrations");

export async function runAppMigrations() {
  let migrationFiles: string[];

  try {
    migrationFiles = (await fs.readdir(MIGRATIONS_DIR))
      .filter((file) => file.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      console.warn(`[migrations] directory not found at ${MIGRATIONS_DIR}, skipping SQL migrations`);
      return;
    }

    throw error;
  }

  if (migrationFiles.length === 0) {
    console.log("[migrations] no SQL migrations found");
    return;
  }

  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const { rows } = await client.query<{ name: string }>("SELECT name FROM app_migrations");
    const appliedMigrations = new Set(rows.map((row) => row.name));

    for (const fileName of migrationFiles) {
      if (appliedMigrations.has(fileName)) {
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, fileName);
      const sql = await fs.readFile(filePath, "utf-8");

      console.log(`[migrations] applying ${fileName}`);
      await client.query("BEGIN");

      try {
        if (sql.trim()) {
          await client.query(sql);
        }

        await client.query("INSERT INTO app_migrations (name) VALUES ($1)", [fileName]);
        await client.query("COMMIT");
        console.log(`[migrations] applied ${fileName}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
  }
}
