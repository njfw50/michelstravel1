import crypto from "crypto";
import { db } from "./db";
import { bookings } from "@shared/schema";
import { eq } from "drizzle-orm";

function verifyDuffelSignature(
  payload: Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    const pairs = signatureHeader.split(",").map((p) => p.split("="));
    const timestamp = pairs.find((p) => p[0] === "t")?.[1];
    const v1 = pairs.find((p) => p[0] === "v1")?.[1];

    if (!timestamp || !v1) {
      console.error("[DUFFEL WEBHOOK] Missing t or v1 in signature header");
      return false;
    }

    const signedPayload = Buffer.concat([
      Buffer.from(timestamp),
      Buffer.from("."),
      payload,
    ]);

    const expectedSignature = crypto
      .createHmac("sha256", Buffer.from(secret))
      .update(signedPayload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(v1, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch (err: any) {
    console.error("[DUFFEL WEBHOOK] Signature verification error:", err.message);
    return false;
  }
}

async function handleOrderCreated(event: any): Promise<void> {
  const order = event.data?.object;
  if (!order) return;

  const duffelOrderId = order.id;
  const bookingReference = order.booking_reference;

  console.log(
    `[DUFFEL WEBHOOK] order.created: ${duffelOrderId}, ref: ${bookingReference}`
  );

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.duffelOrderId, duffelOrderId))
    .limit(1);

  if (booking) {
    const ticketNumbers: string[] = [];
    if (order.documents) {
      for (const doc of order.documents) {
        if (doc.unique_identifier) {
          ticketNumbers.push(doc.unique_identifier);
        }
      }
    }

    await db
      .update(bookings)
      .set({
        ticketStatus: "issued",
        duffelBookingReference:
          bookingReference || booking.duffelBookingReference,
        ...(ticketNumbers.length > 0
          ? { ticketNumber: ticketNumbers.join(", ") }
          : {}),
        lastDuffelWebhookAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    console.log(
      `[DUFFEL WEBHOOK] Booking #${booking.id} ticket status updated to 'issued'`
    );
  } else {
    console.log(
      `[DUFFEL WEBHOOK] No booking found for Duffel order ${duffelOrderId}`
    );
  }
}

async function handleAirlineInitiatedChange(event: any): Promise<void> {
  const order = event.data?.object;
  if (!order) return;

  const duffelOrderId = order.id;
  console.log(
    `[DUFFEL WEBHOOK] airline_initiated_change_detected: ${duffelOrderId}`
  );

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.duffelOrderId, duffelOrderId))
    .limit(1);

  if (booking) {
    const existingChanges =
      (booking.airlineInitiatedChanges as any[]) || [];
    const changeRecord = {
      detectedAt: new Date().toISOString(),
      eventId: event.id,
      slices: order.slices?.map((s: any) => ({
        origin: s.origin?.iata_code,
        destination: s.destination?.iata_code,
        segments: s.segments?.map((seg: any) => ({
          carrier: seg.marketing_carrier?.iata_code,
          flightNumber: seg.marketing_carrier_flight_number,
          departing: seg.departing_at,
          arriving: seg.arriving_at,
          origin: seg.origin?.iata_code,
          destination: seg.destination?.iata_code,
        })),
      })),
    };

    await db
      .update(bookings)
      .set({
        ticketStatus: "schedule_changed",
        airlineInitiatedChanges: [...existingChanges, changeRecord],
        lastDuffelWebhookAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    console.log(
      `[DUFFEL WEBHOOK] Booking #${booking.id} marked as schedule_changed`
    );
  } else {
    console.log(
      `[DUFFEL WEBHOOK] No booking found for Duffel order ${duffelOrderId}`
    );
  }
}

async function handleOrderCancellationCreated(event: any): Promise<void> {
  const cancellation = event.data?.object;
  if (!cancellation) return;

  const duffelOrderId = cancellation.order_id;
  console.log(
    `[DUFFEL WEBHOOK] order_cancellation.created: order ${duffelOrderId}`
  );

  if (!duffelOrderId) return;

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.duffelOrderId, duffelOrderId))
    .limit(1);

  if (booking) {
    await db
      .update(bookings)
      .set({
        ticketStatus: "cancelled",
        status: "cancelled",
        lastDuffelWebhookAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    console.log(
      `[DUFFEL WEBHOOK] Booking #${booking.id} cancelled via Duffel webhook`
    );
  }
}

async function handlePaymentCreated(event: any): Promise<void> {
  const payment = event.data?.object;
  if (!payment) return;

  const duffelOrderId = payment.order_id;
  console.log(
    `[DUFFEL WEBHOOK] payment.created: order ${duffelOrderId}, amount: ${payment.amount} ${payment.currency}`
  );

  if (!duffelOrderId) return;

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.duffelOrderId, duffelOrderId))
    .limit(1);

  if (booking) {
    await db
      .update(bookings)
      .set({
        lastDuffelWebhookAt: new Date(),
      })
      .where(eq(bookings.id, booking.id));

    console.log(
      `[DUFFEL WEBHOOK] Payment recorded for booking #${booking.id}`
    );
  }
}

export class DuffelWebhookHandlers {
  static async processWebhook(
    payload: Buffer,
    signatureHeader: string
  ): Promise<{ success: boolean; message: string }> {
    const secret = process.env.DUFFEL_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[DUFFEL WEBHOOK] DUFFEL_WEBHOOK_SECRET not configured");
      return { success: false, message: "Webhook secret not configured" };
    }

    if (!verifyDuffelSignature(payload, signatureHeader, secret)) {
      console.error("[DUFFEL WEBHOOK] Signature verification failed");
      return { success: false, message: "Invalid signature" };
    }

    const event = JSON.parse(payload.toString());
    console.log(
      `[DUFFEL WEBHOOK] Received event: ${event.type} (id: ${event.id})`
    );

    try {
      switch (event.type) {
        case "order.created":
          await handleOrderCreated(event);
          break;

        case "order.airline_initiated_change_detected":
          await handleAirlineInitiatedChange(event);
          break;

        case "order_cancellation.created":
          await handleOrderCancellationCreated(event);
          break;

        case "payment.created":
          await handlePaymentCreated(event);
          break;

        case "ping.triggered":
          console.log("[DUFFEL WEBHOOK] Ping received successfully");
          break;

        default:
          console.log(
            `[DUFFEL WEBHOOK] Unhandled event type: ${event.type}`
          );
          break;
      }

      return { success: true, message: `Processed ${event.type}` };
    } catch (err: any) {
      console.error(
        `[DUFFEL WEBHOOK] Error processing ${event.type}:`,
        err.message
      );
      return { success: false, message: err.message };
    }
  }
}
