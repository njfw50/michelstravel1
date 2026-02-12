
import { getStripeSync } from './stripeClient';
import { db } from './db';
import { bookings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendBookingConfirmationEmail } from './services/emailService';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    const event = JSON.parse(payload.toString());
    await WebhookHandlers.handleEvent(event);
  }

  static async handleEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId || session.client_reference_id;

        if (bookingId) {
          const id = parseInt(bookingId, 10);
          if (!isNaN(id)) {
            const [updated] = await db.update(bookings)
              .set({
                status: 'confirmed',
                stripePaymentStatus: 'paid',
                stripePaymentIntentId: session.payment_intent || session.id,
              })
              .where(eq(bookings.id, id))
              .returning();

            if (updated) {
              console.log(`[WEBHOOK] Booking #${id} confirmed (payment successful)`);

              if (!updated.confirmationEmailSent) {
                sendBookingConfirmationEmail({
                  referenceCode: updated.referenceCode || `MT-${updated.id}`,
                  contactEmail: updated.contactEmail,
                  contactPhone: updated.contactPhone,
                  totalPrice: updated.totalPrice,
                  currency: updated.currency || 'USD',
                  status: 'confirmed',
                  flightData: updated.flightData,
                  passengerDetails: (updated.passengerDetails as any[]) || [],
                  createdAt: updated.createdAt?.toString() || new Date().toISOString(),
                }).then(() => {
                  db.update(bookings)
                    .set({ confirmationEmailSent: true })
                    .where(eq(bookings.id, id))
                    .execute()
                    .catch(() => {});
                }).catch(err => console.error('[WEBHOOK] Email send failed:', err));
              }
            }
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId || session.client_reference_id;

        if (bookingId) {
          const id = parseInt(bookingId, 10);
          if (!isNaN(id)) {
            await db.update(bookings)
              .set({ status: 'expired', stripePaymentStatus: 'expired' })
              .where(eq(bookings.id, id));
            console.log(`[WEBHOOK] Booking #${id} expired (checkout session expired)`);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const [booking] = await db.select().from(bookings)
          .where(eq(bookings.stripePaymentIntentId, paymentIntent.id))
          .limit(1);

        if (booking) {
          await db.update(bookings)
            .set({ stripePaymentStatus: 'failed' })
            .where(eq(bookings.id, booking.id));
          console.log(`[WEBHOOK] Booking #${booking.id} payment failed`);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;

        if (paymentIntentId) {
          const [booking] = await db.select().from(bookings)
            .where(eq(bookings.stripePaymentIntentId, paymentIntentId))
            .limit(1);

          if (booking) {
            await db.update(bookings)
              .set({ status: 'refunded', stripePaymentStatus: 'refunded' })
              .where(eq(bookings.id, booking.id));
            console.log(`[WEBHOOK] Booking #${booking.id} refunded`);
          }
        }
        break;
      }

      default:
        break;
    }
  }
}
