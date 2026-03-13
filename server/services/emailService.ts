import nodemailer from "nodemailer";

const AGENCY_NAME = "Michels Travel";
const AGENCY_EMAIL = "reservastrens@gmail.com";
const AGENCY_PHONE = "+1 (862) 350-1161";

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
      const label = i === 0 ? "Outbound Flight" : "Return Flight";
      const firstSegment = slice.segments?.[0];
      const lastSegment = slice.segments?.[slice.segments.length - 1];
      const departureDate = firstSegment?.departureTime ? formatDate(firstSegment.departureTime) : '';
      
      flightHTML += `
        <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div style="font-weight:bold;color:#0074DE;font-size:15px;">${label}</div>
            <div style="font-size:12px;color:#6B7280;">${departureDate}</div>
          </div>
          ${(slice.segments || []).map((seg: any, idx: number) => `
            <div style="padding:12px 0;${idx < slice.segments.length - 1 ? 'border-bottom:1px dashed #E5E7EB;' : ''}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="text-align:left;">
                  <div style="font-size:20px;font-weight:bold;color:#111827;">${formatTime(seg.departureTime)}</div>
                  <div style="font-size:14px;color:#374151;font-weight:600;margin-top:2px;">${seg.originCode}</div>
                  <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">${seg.originCity || ''}</div>
                  ${seg.originTerminal ? `<div style="font-size:10px;color:#6B7280;margin-top:2px;">Terminal ${seg.originTerminal}</div>` : ''}
                </div>
                <div style="text-align:center;flex:1;padding:0 16px;">
                  <div style="font-size:11px;color:#6B7280;margin-bottom:4px;">✈️</div>
                  <div style="height:2px;background:#E5E7EB;position:relative;">
                    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:0 8px;">
                      <span style="font-size:10px;color:#9CA3AF;">${seg.duration || ''}</span>
                    </div>
                  </div>
                  <div style="font-size:11px;color:#0074DE;margin-top:4px;font-weight:600;">${seg.carrierName || fd.airline || ''}</div>
                  <div style="font-size:10px;color:#6B7280;">${seg.flightNumber || ''} ${seg.aircraftType ? `• ${seg.aircraftType}` : ''}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:20px;font-weight:bold;color:#111827;">${formatTime(seg.arrivalTime)}</div>
                  <div style="font-size:14px;color:#374151;font-weight:600;margin-top:2px;">${seg.destinationCode}</div>
                  <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">${seg.destinationCity || ''}</div>
                  ${seg.destinationTerminal ? `<div style="font-size:10px;color:#6B7280;margin-top:2px;">Terminal ${seg.destinationTerminal}</div>` : ''}
                </div>
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

        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:16px;">
          <h4 style="font-size:14px;color:#92400E;margin:0 0 12px;font-weight:bold;display:flex;align-items:center;">
            <span style="font-size:18px;margin-right:8px;">ℹ️</span> Important Travel Information
          </h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="background:white;border-radius:8px;padding:10px;">
              <div style="font-size:11px;color:#92400E;font-weight:bold;margin-bottom:4px;">✓ CHECK-IN</div>
              <div style="font-size:11px;color:#78350F;line-height:1.6;">Online check-in opens 24-48 hours before departure</div>
            </div>
            <div style="background:white;border-radius:8px;padding:10px;">
              <div style="font-size:11px;color:#92400E;font-weight:bold;margin-bottom:4px;">⏰ ARRIVAL TIME</div>
              <div style="font-size:11px;color:#78350F;line-height:1.6;">Arrive 2-3 hours before international flights</div>
            </div>
            <div style="background:white;border-radius:8px;padding:10px;">
              <div style="font-size:11px;color:#92400E;font-weight:bold;margin-bottom:4px;">🛂 DOCUMENTS</div>
              <div style="font-size:11px;color:#78350F;line-height:1.6;">Valid passport required for international travel</div>
            </div>
            <div style="background:white;border-radius:8px;padding:10px;">
              <div style="font-size:11px;color:#92400E;font-weight:bold;margin-bottom:4px;">🧳 BAGGAGE</div>
              <div style="font-size:11px;color:#78350F;line-height:1.6;">Check airline policy for size and weight limits</div>
            </div>
          </div>
        </div>

        <div style="background:#DCFCE7;border:1px solid #86EFAC;border-radius:12px;padding:14px;margin-top:12px;">
          <h4 style="font-size:13px;color:#166534;margin:0 0 8px;font-weight:bold;display:flex;align-items:center;">
            <span style="font-size:16px;margin-right:6px;">💡</span> Travel Tips
          </h4>
          <ul style="margin:0;padding:0 0 0 16px;font-size:11px;color:#15803D;line-height:1.8;">
            <li>Download your airline's mobile app for real-time flight updates</li>
            <li>Take photos of your luggage and keep important documents in carry-on</li>
            <li>Arrive early to avoid stress and enjoy airport amenities</li>
            <li>Stay hydrated and move around during long flights</li>
          </ul>
        </div>

        <hr style="border:none;border-top:1px solid #f0f0f0;margin:16px 0;" />

        <div style="text-align:center;">
          <h4 style="font-size:13px;color:#374151;margin:0 0 8px;">Need Help?</h4>
          <div style="font-size:13px;color:#6B7280;">
            <strong>${AGENCY_NAME}</strong><br />
            <a href="mailto:${AGENCY_EMAIL}" style="color:#0074DE;">${AGENCY_EMAIL}</a> &bull;
            <a href="tel:+18623501161" style="color:#0074DE;">${AGENCY_PHONE}</a><br />
            <span style="font-size:11px;">New Jersey, USA</span>
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

export async function sendChatEscalationEmail(sessionId: number, chatLog: string): Promise<boolean> {
  const transporter = getTransporter();
  
  const subject = `[URGENTE] Cliente solicitou atendimento humano - Chat #${sessionId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Cliente Precisa de Atendimento</h2>
      </div>
      <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Um cliente no chatbot solicitou falar com um atendente humano.</p>
        <p><strong>Chat ID:</strong> #${sessionId}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR", { timeZone: "America/New_York" })}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <h3>Histórico da Conversa:</h3>
        <pre style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap; font-size: 13px; line-height: 1.5;">${chatLog.replace("[ESCALATE]", "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        <p style="margin-top: 16px; color: #6b7280; font-size: 13px;">
          Acesse o painel admin em www.michelstravel.agency/admin para ver e resolver esta solicitação.
        </p>
        <p style="margin-top: 8px; color: #6b7280; font-size: 13px;">
          O cliente foi direcionado para usar a seção de Mensagens internas no site.
        </p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log(`[EMAIL-ESCALATION] SMTP not configured. Escalation for Chat #${sessionId}:`);
    console.log(`[EMAIL-ESCALATION] Chat log:\n${chatLog}`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"${AGENCY_NAME}" <${process.env.SMTP_USER}>`,
      to: AGENCY_EMAIL,
      subject,
      html,
    });
    console.log(`[EMAIL] Escalation notification sent for Chat #${sessionId}`);
    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send escalation:", error);
    return false;
  }
}
