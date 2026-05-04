
import { db } from "../server/db.js";
import { customers } from "../shared/schema.js";

async function getTarget() {
  try {
    const all = await db.select().from(customers).limit(1);
    if (all.length > 0) {
      console.log(`TARGET_ID:${all[0].id}`);
    } else {
      console.log("NO_CUSTOMERS_FOUND");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
getTarget();
