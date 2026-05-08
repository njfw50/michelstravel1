import { getPool } from "../server/db.js";

async function checkMigrations() {
  try {
    const res = await getPool().query('SELECT * FROM app_migrations');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Error checking migrations:", err.message);
  } finally {
    process.exit();
  }
}

checkMigrations();
