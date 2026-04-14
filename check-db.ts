
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function checkAndFixSchema() {
  console.log("Checking featured_deals schema...");
  try {
    // Check if columns exist
    const columns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'featured_deals'
    `);
    
    const columnNames = columns.rows.map(r => r.column_name);
    console.log("Current columns:", columnNames);

    if (!columnNames.includes('image_url')) {
      console.log("Adding image_url column...");
      await db.execute(sql`ALTER TABLE featured_deals ADD COLUMN image_url TEXT`);
    }

    if (!columnNames.includes('is_automatic')) {
      console.log("Adding is_automatic column...");
      await db.execute(sql`ALTER TABLE featured_deals ADD COLUMN is_automatic BOOLEAN DEFAULT FALSE`);
    }

    if (!columnNames.includes('is_active')) {
      console.log("Adding is_active column...");
      await db.execute(sql`ALTER TABLE featured_deals ADD COLUMN is_active BOOLEAN DEFAULT TRUE`);
    }

    console.log("Schema check complete.");
    process.exit(0);
  } catch (err) {
    console.error("Schema check failed:", err);
    process.exit(1);
  }
}

checkAndFixSchema();
