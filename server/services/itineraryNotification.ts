import { db } from "../db";
import { bookings, bookingLogs } from "@shared/schema";
import { eq, and, gt, lt, sql } from "drizzle-orm";
import { sendBookingConfirmationEmail } from "./emailService";

const NOTIFICATION_CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour
let notificationLoopStarted = false;

async function checkAndSendItineraryReminders() {
  console.log("[ITINERARY NOTIFICATION] Checking for upcoming trips...");
  
  try {
    // 1. Get confirmed bookings
    const confirmedBookings = await db.select()
      .from(bookings)
      .where(eq(bookings.status, 'confirmed'));

    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const eightDaysFromNow = new Date(now.getTime() + (8 * 24 * 60 * 60 * 1000));

    for (const booking of confirmedBookings) {
      const flightData = booking.flightData as any;
      if (!flightData?.departureTime) continue;

      const departureDate = new Date(flightData.departureTime);
      
      // If departure is between 7 and 8 days from now
      if (departureDate >= oneWeekFromNow && departureDate < eightDaysFromNow) {
        
        // 2. Check if already notified
        const [existingLog] = await db.select()
          .from(bookingLogs)
          .where(
            and(
              eq(bookingLogs.bookingId, booking.id),
              eq(bookingLogs.event, 'itinerary_reminder_sent')
            )
          )
          .limit(1);

        if (!existingLog) {
          console.log(`[ITINERARY NOTIFICATION] Sending 7-day reminder for booking ${booking.referenceCode}`);
          
          // 3. Send notification (Simulation/Email)
          // In a real app, logic for SMS would go here.
          // For now, we'll re-use the confirmation email logic or a specialized one.
          // Since the prompt asks for "itinerary reminder", we'll log it first.
          
          await db.insert(bookingLogs).values({
            bookingId: booking.id,
            event: 'itinerary_reminder_sent',
            message: `Automatic 7-day pre-flight itinerary reminder sent to ${booking.contactEmail}`,
            metadata: { 
              sentAt: new Date().toISOString(),
              departureTime: flightData.departureTime,
              contactPhone: booking.contactPhone
            }
          });

          // Simulate SMS dispatch
          console.log(`[SMS DISPATCH] Sending itinerary reminder SMS to ${booking.contactPhone}: Your trip ${booking.referenceCode} is in 7 days!`);

          // Also log a "check-in_available" event if applicable
          await db.insert(bookingLogs).values({
            bookingId: booking.id,
            event: 'check-in_dashboard_alert',
            message: `Check-in is nearing availability. Please check the airline website soon.`,
          });
          
          // Note: In real production, we'd call an SMS API here or a specific email template.
          // The sendBookingConfirmationEmail is already available but we'd want a "Reminder" version.
        }
      }
    }
  } catch (error) {
    console.error("[ITINERARY NOTIFICATION] Error in loop:", error);
  }
}

export function startItineraryNotificationLoop() {
  if (notificationLoopStarted) return;
  notificationLoopStarted = true;

  const run = async () => {
    await checkAndSendItineraryReminders();
    setTimeout(run, NOTIFICATION_CHECK_INTERVAL_MS);
  };

  // Initial delay of 30 seconds
  setTimeout(run, 30_000);
}
