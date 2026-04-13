
import { db } from "../server/db";
import { bookings } from "../shared/schema";

async function test() {
  try {
    console.log("Testing booking insert...");
    const result = await db.insert(bookings).values({
      referenceCode: "TEST-" + Math.random().toString(36).substring(7).toUpperCase(),
      flightData: { test: true },
      passengerDetails: [{ givenName: "Test", familyName: "User" }],
      totalPrice: "100.00",
      currency: "USD",
      contactEmail: "test@example.com",
      status: "pending"
    }).returning();
    console.log("Insert successful:", result);
  } catch (err: any) {
    console.error("Insert failed!");
    console.error("Error message:", err.message);
    console.error("Error details:", err);
  } finally {
    process.exit();
  }
}

test();
