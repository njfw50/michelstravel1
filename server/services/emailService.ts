import nodemailer from "nodemailer";

const AGENCY_NAME = "Michels Travel";
const AGENCY_EMAIL = "reservastrens@gmail.com";
const AGENCY_PHONE = "+55 (86) 2350-1161";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[EMAIL] SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Emails will be logged only.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function formatCurrency(amount: string | number, currency: string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${currency} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return dateStr;
  }
}

interface BookingEmailData {
  referenceCode: string;
  contactEmail: string;
  contactPhone?: string | null;
  totalPrice: string;
  currency: string;
  status: string;
  flightData: any;
  passengerDetails: any[];
  createdAt: string | Date;
}

function buildConfirmationHTML(booking: BookingEmailData): string {
  const fd = booking.flightData;
  const passengers = booking.passengerDetails || [];
  const slices = fd?.slices || [];

  let flightHTML = "";
  if (slices.length > 0) {
    slices.forEach((slice: any, i: number) => {
      const label = i === 0 ? "Outbound" : "Return";
      flightHTML += `
        <div style="margin-bottom:16px;">
          <div style="font-weight:bold;color:#0074DE;font-size:13px;margin-bottom:6px;">${label}: ${slice.originCode || ""} &rarr; ${slice.destinationCode || ""}</div>
          ${(slice.segments || []).map((seg: any) => `
            <div style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
              <div style="font-size:14px;">
                <strong>${formatTime(seg.departureTime)}</strong> ${seg.originCode}
                &rarr;
                <strong>${formatTime(seg.arrivalTime)}</strong> ${seg.destinationCode}
              </div>
              <div style="font-size:12px;color:#888;margin-top:2px;">
                ${seg.carrierName || fd.airline || ""} ${seg.flightNumber || ""}
                ${seg.aircraftType ? `(${seg.aircraftType})` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      `;
    });
  } else {
    flightHTML = `
      <div style="padding:8px 0;">
        <div style="font-size:14px;">
          <strong>${fd?.airline || ""}</strong> ${fd?.flightNumber || ""}
        </div>
        <div style="font-size:14px;margin-top:4px;">
          ${fd?.origin || ""} &rarr; ${fd?.destination || ""}
        </div>
        ${fd?.departureTime ? `<div style="font-size:12px;color:#888;margin-top:2px;">${formatDate(fd.departureTime)} at ${formatTime(fd.departureTime)}</div>` : ""}
      </div>
    `;
  }

  let passengerHTML = passengers.map((p: any, i: number) => `
    <div style="padding:8px 12px;background:#f8f9fa;border-radius:8px;margin-bottom:6px;">
      <div style="font-weight:600;font-size:14px;">${p.givenName} ${p.familyName}</div>
      <div style="font-size:12px;color:#888;">${p.type === "child" ? "Child" : p.type === "infant_without_seat" ? "Infant" : "Adult"} &bull; ${p.email || ""}</div>
    </div>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      
      <div style="background:#0074DE;padding:32px 24px;text-align:center;">
        <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:28px;color:white;">&#10003;</span>
        </div>
        <h1 style="color:white;font-size:22px;margin:0;">Booking Confirmed!</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Your flight has been booked successfully</p>
      </div>

      <div style="padding:24px;">
        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px;text-align:center;margin-bottom:20px;">
          <div style="font-size:12px;color:#3B82F6;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Reference Code</div>
          <div style="font-size:28px;font-weight:bold;color:#1D4ED8;font-family:monospace;margin-top:4px;">${booking.referenceCode}</div>
          <div style="font-size:11px;color:#6B7280;margin-top:6px;">Save this code to check your booking anytime</div>
        </div>

        <h3 style="font-size:14px;color:#374151;margin:0 0 8px;font-weight:bold;">Flight Details</h3>
        ${flightHTML}

        <hr style="border:none;border-top:1px solid #f0f0f0;margin:16px 0;" />

        <h3 style="font-size:14px;color:#374151;margin:0 0 8px;font-weight:bold;">Passengers (${passengers.length})</h3>
        ${passengerHTML}

        <hr style="border:none;border-top:1px solid #f0f0f0;margin:16px 0;" />

        <div style="background:#EFF6FF;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:12px;color:#3B82F6;font-weight:bold;">Total Paid</div>
          <div style="font-size:24px;font-weight:bold;color:#1D4ED8;">${formatCurrency(booking.totalPrice, booking.currency)}</div>
        </div>

        <hr style="border:none;border-top:1px solid #f0f0f0;margin:16px 0;" />

        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:14px;">
          <h4 style="font-size:13px;color:#92400E;margin:0 0 8px;font-weight:bold;">Important Information</h4>
          <ul style="margin:0;padding:0 0 0 16px;font-size:12px;color:#78350F;line-height:1.8;">
            <li>Check in online 24-48 hours before departure</li>
            <li>Arrive at the airport at least 2-3 hours before international flights</li>
            <li>Bring a valid photo ID or passport</li>
            <li>Check your airline's baggage policy for carry-on and checked bag limits</li>
          </ul>
        </div>

        <hr style="border:none;border-top:1px solid #f0f0f0;margin:16px 0;" />

        <div style="text-align:center;">
          <h4 style="font-size:13px;color:#374151;margin:0 0 8px;">Need Help?</h4>
          <div style="font-size:13px;color:#6B7280;">
            <strong>${AGENCY_NAME}</strong><br />
            <a href="mailto:${AGENCY_EMAIL}" style="color:#0074DE;">${AGENCY_EMAIL}</a> &bull;
            <a href="tel:+558623501161" style="color:#0074DE;">${AGENCY_PHONE}</a><br />
            <span style="font-size:11px;">Brasil</span>
          </div>
        </div>
      </div>

      <div style="background:#f8f9fa;padding:16px;text-align:center;font-size:11px;color:#9CA3AF;">
        &copy; ${new Date().getFullYear()} ${AGENCY_NAME}. All rights reserved.<br />
        This is an automated confirmation. Please do not reply to this email.
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendBookingConfirmationEmail(booking: BookingEmailData): Promise<boolean> {
  const transporter = getTransporter();

  const html = buildConfirmationHTML(booking);
  const subject = `Booking Confirmed - ${booking.referenceCode} | ${AGENCY_NAME}`;

  if (!transporter) {
    console.log(`[EMAIL] (No SMTP configured) Would send confirmation to: ${booking.contactEmail}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Reference: ${booking.referenceCode}`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"${AGENCY_NAME}" <${process.env.SMTP_USER}>`,
      to: booking.contactEmail,
      subject,
      html,
    });
    console.log(`[EMAIL] Confirmation sent to ${booking.contactEmail} (Ref: ${booking.referenceCode})`);
    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send confirmation:", error);
    return false;
  }
}
