import { desc } from "drizzle-orm";

import { db } from "../db";
import { storage } from "../storage";
import { customerProfiles, users } from "@shared/models/auth";
import { bookings, liveSessions, internalMessages } from "@shared/schema";


export type OwnerDeskAction =
  | "open-live-desk"
  | "open-bookings"
  | "focus-inbox"
  | "call"
  | "whatsapp"
  | "email";

export interface OwnerDeskTimelineItem {
  id: string;
  type: "booking" | "live" | "inbox" | "escalation" | "account";
  title: string;
  summary: string;
  status: string;
  createdAt: string;
}

export interface OwnerDeskCase {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  preferredLanguage: string | null;
  serviceMode: "standard" | "senior";
  needsHumanHelp: boolean;
  route: string | null;
  sourceLabel: string;
  stage: string;
  stageLabel: string;
  priorityBand: "hot" | "warm" | "watch";
  heatScore: number;
  nextBestAction: {
    action: OwnerDeskAction;
    label: string;
    description: string;
  };
  availableActions: OwnerDeskAction[];
  lastTouchAt: string | null;
  latestSummary: string | null;
  totalRevenue: number;
  totalBookings: number;
  pendingBookings: number;
  unreadInboxCount: number;
  openEscalations: number;
  liveRequests: number;
  activeLiveSessions: number;
  bookingId: string | null;
  threadId: string | null;
  liveSessionId: string | null;
  escalationId: string | null;
  timeline: OwnerDeskTimelineItem[];
}

export interface OwnerDeskSnapshot {
  generatedAt: string;
  summary: {
    totalCases: number;
    hotCases: number;
    seniorCases: number;
    paymentWatch: number;
    liveNow: number;
    alertingNow: number;
    overdueFollowUps: number;
  };
  alerts: OwnerDeskAlert[];
  followUps: OwnerDeskFollowUp[];
  cases: OwnerDeskCase[];
}

export interface OwnerDeskAlert {
  id: string;
  level: "critical" | "attention" | "info";
  title: string;
  summary: string;
  customerCaseId: string;
  customerName: string | null;
  route: string | null;
  stageLabel: string;
  heatScore: number;
  triggeredAt: string | null;
  action: OwnerDeskAction;
  actionLabel: string;
  actionUrl: string;
  customerPhone: string | null;
  customerEmail: string | null;
  liveSessionId: string | null;
  bookingId: string | null;
  threadId: string | null;
}

export interface OwnerDeskFollowUp {
  id: string;
  customerCaseId: string;
  customerName: string | null;
  route: string | null;
  dueAt: string;
  overdue: boolean;
  urgency: "overdue" | "soon" | "planned";
  reason: string;
  channel: OwnerDeskAction;
  actionLabel: string;
  actionUrl: string;
  customerPhone: string | null;
  customerEmail: string | null;
  liveSessionId: string | null;
  bookingId: string | null;
  threadId: string | null;
}

interface CaseAccumulator {
  id: string;
  keys: Set<string>;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  preferredLanguage: string | null;
  serviceMode: "standard" | "senior";
  needsHumanHelp: boolean;
  route: string | null;
  routeUpdatedAt: number;
  totalRevenue: number;
  totalBookings: number;
  pendingBookings: number;
  unreadInboxCount: number;
  openEscalations: number;
  liveRequests: number;
  activeLiveSessions: number;
  hasPaymentPending: boolean;
  hasTicketIssue: boolean;
  bookingId: string | null;
  bookingUpdatedAt: number;
  threadId: string | null;
  threadUpdatedAt: number;
  liveSessionId: string | null;
  liveUpdatedAt: number;
  escalationId: string | null;
  escalationUpdatedAt: number;
  lastTouchAt: number;
  latestSummary: string | null;
  timeline: OwnerDeskTimelineItem[];
}

function normalizeEmail(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

function normalizePhone(value?: string | null) {
  const normalized = value?.replace(/\D+/g, "");
  return normalized || null;
}

function toTimestamp(value?: Date | string | null) {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function toIso(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function asNonEmptyText(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function buildDisplayName(first?: string | null, last?: string | null) {
  const joined = [first?.trim(), last?.trim()].filter(Boolean).join(" ").trim();
  return joined || null;
}

function extractPassengerName(passengerDetails: unknown) {
  if (!Array.isArray(passengerDetails) || passengerDetails.length === 0) return null;
  const firstPassenger = passengerDetails[0] as Record<string, unknown>;
  return (
    buildDisplayName(
      asNonEmptyText(firstPassenger?.givenName) || asNonEmptyText(firstPassenger?.displayName),
      asNonEmptyText(firstPassenger?.familyName) || asNonEmptyText(firstPassenger?.displayName),
    ) ||
    asNonEmptyText(firstPassenger?.fullName)
  );
}

function extractRouteFromFlightData(flightData: unknown) {
  if (!flightData || typeof flightData !== "object") return null;
  const payload = flightData as Record<string, any>;
  const origin =
    asNonEmptyText(payload.originCode) ||
    asNonEmptyText(payload.origin) ||
    asNonEmptyText(payload.slices?.[0]?.segments?.[0]?.originCode) ||
    asNonEmptyText(payload.slices?.[0]?.segments?.[0]?.origin?.iata_code);
  const destination =
    asNonEmptyText(payload.destinationCode) ||
    asNonEmptyText(payload.destination) ||
    asNonEmptyText(payload.slices?.[0]?.segments?.slice(-1)?.[0]?.destinationCode) ||
    asNonEmptyText(payload.slices?.[0]?.segments?.slice(-1)?.[0]?.destination?.iata_code);
  if (!origin || !destination) return null;
  return `${origin.toUpperCase()} -> ${destination.toUpperCase()}`;
}

function extractRouteFromSession(session: {
  approvedFlightData?: unknown;
  contextSnapshot?: unknown;
}) {
  const approvedRoute = extractRouteFromFlightData(session.approvedFlightData);
  if (approvedRoute) return approvedRoute;

  const context = session.contextSnapshot as Record<string, unknown> | null | undefined;
  const origin = asNonEmptyText(context?.origin);
  const destination = asNonEmptyText(context?.destination);
  if (!origin || !destination) return null;
  return `${origin.toUpperCase()} -> ${destination.toUpperCase()}`;
}

function describeEntryPoint(entryPoint?: string | null) {
  switch (entryPoint) {
    case "senior-home":
      return "Senior intake";
    case "senior-search":
      return "Senior search";
    case "senior-booking":
      return "Senior booking";
    case "booking":
      return "Checkout";
    case "search":
      return "Search";
    default:
      return "Chatbot";
  }
}

function makeEmptyCase(id: string): CaseAccumulator {
  return {
    id,
    keys: new Set<string>(),
    customerName: null,
    customerEmail: null,
    customerPhone: null,
    preferredLanguage: null,
    serviceMode: "standard",
    needsHumanHelp: false,
    route: null,
    routeUpdatedAt: 0,
    totalRevenue: 0,
    totalBookings: 0,
    pendingBookings: 0,
    unreadInboxCount: 0,
    openEscalations: 0,
    liveRequests: 0,
    activeLiveSessions: 0,
    hasPaymentPending: false,
    hasTicketIssue: false,
    bookingId: null,
    bookingUpdatedAt: 0,
    threadId: null,
    threadUpdatedAt: 0,
    liveSessionId: null,
    liveUpdatedAt: 0,
    escalationId: null,
    escalationUpdatedAt: 0,
    lastTouchAt: 0,
    latestSummary: null,
    timeline: [],
  };
}

function shouldReplaceName(current: string | null, next: string | null) {
  if (!next) return false;
  if (!current) return true;
  const lowerCurrent = current.toLowerCase();
  if (lowerCurrent.startsWith("traveler ") || lowerCurrent.startsWith("visitor ")) return true;
  return current.length < next.length;
}

function sourceLabelFromTimeline(item?: OwnerDeskTimelineItem) {
  if (!item) return "Direct";
  switch (item.type) {
    case "live":
      return "Live desk";
    case "inbox":
      return "Inbox";
    case "escalation":
      return "Phone rescue";
    case "booking":
      return "Booking";
    default:
      return "Account";
  }
}

function stageFromCase(caseRef: CaseAccumulator) {
  if (caseRef.openEscalations > 0) {
    return {
      stage: "service-recovery",
      stageLabel: "Service recovery",
      nextBestAction: {
        action: caseRef.customerPhone ? ("call" as const) : ("open-live-desk" as const),
        label: caseRef.customerPhone ? "Call now" : "Open live desk",
        description: "A rescue case is waiting for direct attention.",
      },
    };
  }

  if (caseRef.liveRequests > 0) {
    return {
      stage: "respond-now",
      stageLabel: "Respond now",
      nextBestAction: {
        action: "open-live-desk" as const,
        label: "Assume in live desk",
        description: "The traveler explicitly asked for a human agent.",
      },
    };
  }

  if (caseRef.hasPaymentPending) {
    return {
      stage: "payment-follow-up",
      stageLabel: "Payment follow-up",
      nextBestAction: {
        action: caseRef.customerPhone ? ("whatsapp" as const) : ("open-bookings" as const),
        label: caseRef.customerPhone ? "Send payment reminder" : "Open booking",
        description: "There is money on the table but checkout is not closed yet.",
      },
    };
  }

  if (caseRef.hasTicketIssue) {
    return {
      stage: "ticket-issue",
      stageLabel: "Ticket issue",
      nextBestAction: {
        action: "open-bookings" as const,
        label: "Review booking",
        description: "The itinerary has a ticketing or airline issue that needs active handling.",
      },
    };
  }

  if (caseRef.unreadInboxCount > 0 && caseRef.threadId) {
    return {
      stage: "inbox-reply",
      stageLabel: "Inbox waiting",
      nextBestAction: {
        action: "focus-inbox" as const,
        label: "Reply in inbox",
        description: "There are unread customer messages inside the dashboard inbox.",
      },
    };
  }

  if (caseRef.activeLiveSessions > 0) {
    return {
      stage: "active-live",
      stageLabel: "Live service active",
      nextBestAction: {
        action: "open-live-desk" as const,
        label: "Open live desk",
        description: "Continue the live-assisted sale with the current context.",
      },
    };
  }

  if (caseRef.pendingBookings > 0) {
    return {
      stage: "booking-follow-up",
      stageLabel: "Booking follow-up",
      nextBestAction: {
        action: "open-bookings" as const,
        label: "Check booking",
        description: "A pending reservation still needs active follow-up.",
      },
    };
  }

  if (caseRef.serviceMode === "senior") {
    return {
      stage: "senior-watch",
      stageLabel: "Senior care",
      nextBestAction: {
        action: caseRef.customerPhone ? ("whatsapp" as const) : ("open-live-desk" as const),
        label: caseRef.customerPhone ? "Guide on WhatsApp" : "Open live desk",
        description: "Keep the experience calm and proactive for this senior traveler.",
      },
    };
  }

  if (caseRef.totalBookings > 0) {
    return {
      stage: "post-sale",
      stageLabel: "Post-sale",
      nextBestAction: {
        action: "open-bookings" as const,
        label: "Open booking",
        description: "Use the full reservation record before sending the next message.",
      },
    };
  }

  return {
    stage: "new-contact",
    stageLabel: "New contact",
    nextBestAction: {
      action: caseRef.customerPhone ? ("whatsapp" as const) : ("email" as const),
      label: caseRef.customerPhone ? "Start WhatsApp" : "Email customer",
      description: "No active sale is open yet, so start with a direct contact.",
    },
  };
}

function heatScoreFromCase(caseRef: CaseAccumulator, now: number) {
  let score = 8;

  if (caseRef.openEscalations > 0) score += 34;
  if (caseRef.liveRequests > 0) score += 28;
  if (caseRef.activeLiveSessions > 0) score += 16;
  if (caseRef.hasPaymentPending) score += 24;
  if (caseRef.hasTicketIssue) score += 22;
  if (caseRef.pendingBookings > 0) score += 10;
  if (caseRef.unreadInboxCount > 0) score += Math.min(18, 8 + caseRef.unreadInboxCount * 3);
  if (caseRef.serviceMode === "senior") score += 10;
  if (caseRef.totalRevenue >= 1200) score += 8;
  else if (caseRef.totalRevenue >= 600) score += 4;

  const ageHours = caseRef.lastTouchAt > 0 ? Math.max(0, (now - caseRef.lastTouchAt) / (1000 * 60 * 60)) : 0;
  if (ageHours >= 24 && (caseRef.unreadInboxCount > 0 || caseRef.liveRequests > 0 || caseRef.hasPaymentPending)) {
    score += 10;
  } else if (ageHours >= 12 && caseRef.pendingBookings > 0) {
    score += 6;
  }

  return Math.min(99, score);
}

function actionUrlFromCase(ownerCase: OwnerDeskCase, action: OwnerDeskAction) {
  if (action === "open-live-desk" && ownerCase.liveSessionId) {
    return `/admin/live-chat?session=${ownerCase.liveSessionId}`;
  }

  return "/admin";
}

function alertTitleFromCase(ownerCase: OwnerDeskCase) {
  switch (ownerCase.stage) {
    case "service-recovery":
      return `${ownerCase.customerName} precisa de resgate imediato`;
    case "respond-now":
      return `${ownerCase.customerName} pediu humano agora`;
    case "payment-follow-up":
      return `${ownerCase.customerName} parou no pagamento`;
    case "ticket-issue":
      return `${ownerCase.customerName} esta com problema de ticket`;
    case "active-live":
      return `${ownerCase.customerName} esta em atendimento ao vivo`;
    case "inbox-reply":
      return `${ownerCase.customerName} esta aguardando resposta`;
    case "senior-watch":
      return `${ownerCase.customerName} pede conducao senior`;
    default:
      return `${ownerCase.customerName} entrou no radar`;
  }
}

function followUpMinutesFromStage(stage: OwnerDeskCase["stage"]) {
  switch (stage) {
    case "service-recovery":
      return 5;
    case "respond-now":
      return 2;
    case "payment-follow-up":
      return 30;
    case "ticket-issue":
      return 20;
    case "inbox-reply":
      return 15;
    case "active-live":
      return 10;
    case "booking-follow-up":
      return 120;
    case "senior-watch":
      return 180;
    case "new-contact":
      return 60;
    case "post-sale":
      return 720;
    default:
      return 90;
  }
}

function followUpReasonFromCase(ownerCase: OwnerDeskCase) {
  switch (ownerCase.stage) {
    case "service-recovery":
      return "Cliente em risco de perda ou desconfianca. Assuma o caso sem demora.";
    case "respond-now":
      return "Lead pediu humano e o melhor momento de resposta e agora.";
    case "payment-follow-up":
      return "Pagamento travou e o dinheiro ainda esta quente.";
    case "ticket-issue":
      return "Existe problema operacional que precisa ser resolvido antes de gerar ansiedade.";
    case "inbox-reply":
      return "Ha mensagem aberta esperando retorno humano.";
    case "active-live":
      return "Continue o atendimento vivo antes que o cliente esfrie.";
    case "booking-follow-up":
      return "Reserva segue aberta e ainda precisa de conducao.";
    case "senior-watch":
      return "Cliente senior pede contato calmo, claro e proativo.";
    default:
      return "Contato ainda pede uma proxima acao sua.";
  }
}

export async function buildOwnerDeskSnapshot(): Promise<OwnerDeskSnapshot> {
  const now = new Date();
  const nowTs = now.getTime();

  const [
    allBookings,
    sessionRows,
    inboxThreads,
    escalations,
    allUsers,
    profiles,
    messageRows,
  ] = await Promise.all([
    db.select().from(bookings).orderBy(desc(bookings.createdAt)),
    db.select().from(liveSessions).orderBy(desc(liveSessions.createdAt)).limit(300),
    storage.getAllInternalThreads(),
    storage.getAllVoiceEscalations(),
    db.select().from(users),
    db.select().from(customerProfiles),
    db.select().from(internalMessages).orderBy(desc(internalMessages.createdAt)).limit(500),
  ]);

  const userById = new Map(allUsers.map((user) => [user.id, user]));
  const profileByUserId = new Map(profiles.map((profile) => [profile.userId, profile]));
  const latestMessageByThreadId = new Map<string, typeof messageRows[number]>();

  for (const message of messageRows) {
    if (!latestMessageByThreadId.has(message.threadId)) {
      latestMessageByThreadId.set(message.threadId, message);
    }
  }

  const caseIndex = new Map<string, CaseAccumulator>();
  const cases: CaseAccumulator[] = [];
  let sequence = 1;

  const registerKey = (caseRef: CaseAccumulator, key?: string | null) => {
    if (!key) return;
    caseRef.keys.add(key);
    caseIndex.set(key, caseRef);
  };

  const resolveCase = (candidateKeys: Array<string | null | undefined>, fallbackKey: string) => {
    for (const key of candidateKeys) {
      if (key && caseIndex.has(key)) {
        const existing = caseIndex.get(key)!;
        candidateKeys.forEach((candidate) => registerKey(existing, candidate || null));
        registerKey(existing, fallbackKey);
        return existing;
      }
    }

    if (caseIndex.has(fallbackKey)) {
      const existing = caseIndex.get(fallbackKey)!;
      candidateKeys.forEach((candidate) => registerKey(existing, candidate || null));
      return existing;
    }

    const created = makeEmptyCase(`owner-case-${sequence++}`);
    cases.push(created);
    candidateKeys.forEach((candidate) => registerKey(created, candidate || null));
    registerKey(created, fallbackKey);
    return created;
  };

  const hydrateFromUser = (caseRef: CaseAccumulator, userId?: string | null) => {
    if (!userId) return;
    const user = userById.get(userId);
    const profile = profileByUserId.get(userId);

    registerKey(caseRef, `user:${userId}`);
    if (user?.email) registerKey(caseRef, `email:${normalizeEmail(user.email)}`);
    if (user?.phone) registerKey(caseRef, `phone:${normalizePhone(user.phone)}`);

    if (shouldReplaceName(caseRef.customerName, buildDisplayName(user?.displayName, user?.displayName))) {
      caseRef.customerName = buildDisplayName(user?.displayName, user?.displayName);
    }

    if (!caseRef.customerEmail && user?.email) {
      caseRef.customerEmail = user.email;
    }
    if (!caseRef.customerPhone && user?.phone) {
      caseRef.customerPhone = user.phone;
    }

    if (profile) {
      caseRef.preferredLanguage = caseRef.preferredLanguage || profile.preferredLanguage || null;
      caseRef.needsHumanHelp = caseRef.needsHumanHelp || Boolean(profile.needsHumanHelp);
      if (profile.experienceMode === "senior") {
        caseRef.serviceMode = "senior";
      }
    }
  };

  const pushTimeline = (
    caseRef: CaseAccumulator,
    item: { id: string; type: OwnerDeskTimelineItem["type"]; title: string; summary: string; status: string; createdAt: Date | string | null | undefined },
  ) => {
    const createdAt = toIso(item.createdAt);
    if (!createdAt) return;
    caseRef.timeline.push({
      id: item.id,
      type: item.type,
      title: item.title,
      summary: item.summary,
      status: item.status,
      createdAt,
    });

    const itemTs = toTimestamp(createdAt);
    if (itemTs >= caseRef.lastTouchAt) {
      caseRef.lastTouchAt = itemTs;
      caseRef.latestSummary = item.summary;
    }
  };

  const updateRoute = (caseRef: CaseAccumulator, route: string | null, updatedAt: number) => {
    if (!route) return;
    if (!caseRef.route || updatedAt >= caseRef.routeUpdatedAt) {
      caseRef.route = route;
      caseRef.routeUpdatedAt = updatedAt;
    }
  };

  for (const booking of allBookings) {
    const bookingTs = toTimestamp(booking.createdAt);
    const user = booking.userId ? userById.get(booking.userId) : null;
    const email = normalizeEmail(booking.contactEmail || user?.email || null);
    const phone = normalizePhone(booking.contactPhone || user?.phone || null);
    const caseRef = resolveCase(
      [
        booking.userId ? `user:${booking.userId}` : null,
        email ? `email:${email}` : null,
        phone ? `phone:${phone}` : null,
      ],
      `booking:${booking.id}`,
    );

    hydrateFromUser(caseRef, booking.userId);

    const passengerName = extractPassengerName(booking.passengerDetails);
    if (shouldReplaceName(caseRef.customerName, passengerName)) {
      caseRef.customerName = passengerName;
    }

    if (booking.contactEmail && !caseRef.customerEmail) {
      caseRef.customerEmail = booking.contactEmail;
    }
    if (booking.contactPhone && !caseRef.customerPhone) {
      caseRef.customerPhone = booking.contactPhone;
    }

    caseRef.totalBookings += 1;
    caseRef.totalRevenue += Number(booking.totalPrice || 0);
    if (["pending", "payment_pending"].includes(booking.status || "")) {
      caseRef.pendingBookings += 1;
    }
    if (booking.status === "payment_pending") {
      caseRef.hasPaymentPending = true;
    }
    if (["failed", "cancelled", "schedule_changed"].includes((booking.ticketStatus || "").toLowerCase())) {
      caseRef.hasTicketIssue = true;
    }

    if (bookingTs >= caseRef.bookingUpdatedAt) {
      caseRef.bookingId = booking.id;
      caseRef.bookingUpdatedAt = bookingTs;
    }

    updateRoute(caseRef, extractRouteFromFlightData(booking.flightData), bookingTs);

    const bookingSummary =
      booking.status === "payment_pending"
        ? "Payment still needs follow-up before the sale is secure."
        : caseRef.hasTicketIssue
          ? "This booking has a ticketing or airline issue that can affect trust."
          : ["confirmed", "completed"].includes(booking.status || "")
            ? "Booking is confirmed and should stay under post-sale watch."
            : "Booking is still open and may need a human follow-up.";

    pushTimeline(caseRef, {
      id: `booking-${booking.id}`,
      type: "booking",
      title: booking.referenceCode ? `Booking ${booking.referenceCode}` : `Booking #${booking.id}`,
      summary: bookingSummary,
      status: booking.status || "pending",
      createdAt: booking.createdAt,
    });
  }

  for (const session of sessionRows) {
    const sessionTs = toTimestamp(session.createdAt);
    const email = normalizeEmail(session.customerEmail);
    const phone = normalizePhone(session.customerPhone);
    const caseRef = resolveCase(
      [
        session.bookingId ? `booking:${session.bookingId}` : null,
        email ? `email:${email}` : null,
        phone ? `phone:${phone}` : null,
        session.visitorId ? `visitor:${session.visitorId}` : null,
      ],
      `live:${session.id}`,
    );

    if (shouldReplaceName(caseRef.customerName, session.customerName || null)) {
      caseRef.customerName = session.customerName || null;
    }
    if (session.customerEmail && !caseRef.customerEmail) {
      caseRef.customerEmail = session.customerEmail;
    }
    if (session.customerPhone && !caseRef.customerPhone) {
      caseRef.customerPhone = session.customerPhone;
    }
    if (!caseRef.preferredLanguage && session.language) {
      caseRef.preferredLanguage = session.language;
    }
    if (session.serviceMode === "senior") {
      caseRef.serviceMode = "senior";
    }
    if (session.status === "requested") {
      caseRef.liveRequests += 1;
    }
    if (session.status === "active") {
      caseRef.activeLiveSessions += 1;
    }
    if (sessionTs >= caseRef.liveUpdatedAt && (session.status === "requested" || session.status === "active")) {
      caseRef.liveSessionId = session.id;
      caseRef.liveUpdatedAt = sessionTs;
    }

    updateRoute(
      caseRef,
      extractRouteFromSession({
        approvedFlightData: session.approvedFlightData,
        contextSnapshot: session.contextSnapshot,
      }),
      sessionTs,
    );

    const sessionSummary =
      session.status === "requested"
        ? `${describeEntryPoint(session.entryPoint)} is waiting for human pickup.`
        : session.status === "active"
          ? `${describeEntryPoint(session.entryPoint)} is actively being handled.`
          : `${describeEntryPoint(session.entryPoint)} was already closed but still matters for context.`;

    pushTimeline(caseRef, {
      id: `live-${session.id}`,
      type: "live",
      title: `Live session #${session.id}`,
      summary: sessionSummary,
      status: session.status,
      createdAt: session.createdAt,
    });
  }

  for (const thread of inboxThreads) {
    const threadTs = toTimestamp(thread.lastMessageAt || thread.createdAt);
    const user = thread.userId ? userById.get(thread.userId) : null;
    const email = normalizeEmail(thread.userEmail || user?.email || null);
    const phone = normalizePhone(user?.phone || null);
    const caseRef = resolveCase(
      [
        thread.userId ? `user:${thread.userId}` : null,
        email ? `email:${email}` : null,
        phone ? `phone:${phone}` : null,
      ],
      `thread:${thread.id}`,
    );

    hydrateFromUser(caseRef, thread.userId);

    const threadName = thread.userName?.trim() || null;
    if (shouldReplaceName(caseRef.customerName, threadName)) {
      caseRef.customerName = threadName;
    }

    caseRef.unreadInboxCount += Number(thread.unreadCount || 0);
    if (threadTs >= caseRef.threadUpdatedAt) {
      caseRef.threadId = thread.id;
      caseRef.threadUpdatedAt = threadTs;
    }

    const lastMessage = latestMessageByThreadId.get(thread.id);
    const threadSummary =
      lastMessage?.content?.trim() ||
      thread.subject ||
      "Inbox thread waiting for review.";

    pushTimeline(caseRef, {
      id: `thread-${thread.id}`,
      type: "inbox",
      title: thread.subject || `Inbox thread #${thread.id}`,
      summary: Number(thread.unreadCount || 0) > 0
        ? `${Number(thread.unreadCount || 0)} unread message${Number(thread.unreadCount || 0) === 1 ? "" : "s"}. ${threadSummary}`
        : threadSummary,
      status: thread.status || "open",
      createdAt: thread.lastMessageAt || thread.createdAt,
    });
  }

  for (const escalation of escalations) {
    const escalationTs = toTimestamp(escalation.createdAt);
    const phone = normalizePhone(escalation.customerPhone);
    const caseRef = resolveCase(
      [phone ? `phone:${phone}` : null],
      `escalation:${escalation.id}`,
    );

    if (escalation.customerPhone && !caseRef.customerPhone) {
      caseRef.customerPhone = escalation.customerPhone;
    }
    if (escalation.status !== "resolved") {
      caseRef.openEscalations += 1;
    }
    if (escalationTs >= caseRef.escalationUpdatedAt && escalation.status !== "resolved") {
      caseRef.escalationId = escalation.id;
      caseRef.escalationUpdatedAt = escalationTs;
    }

    pushTimeline(caseRef, {
      id: `escalation-${escalation.id}`,
      type: "escalation",
      title: escalation.reason || "Phone escalation",
      summary: escalation.summary?.trim() || "Direct rescue was requested for this traveler.",
      status: escalation.status,
      createdAt: escalation.createdAt,
    });
  }

  const finalizedCases = cases
    .filter((caseRef) => caseRef.timeline.length > 0)
    .map<OwnerDeskCase>((caseRef) => {
      caseRef.timeline.sort((left, right) => toTimestamp(right.createdAt) - toTimestamp(left.createdAt));
      const stageInfo = stageFromCase(caseRef);
      const heatScore = heatScoreFromCase(caseRef, nowTs);
      const availableActions = Array.from(
        new Set(
          [
            caseRef.liveSessionId ? "open-live-desk" : null,
            caseRef.bookingId ? "open-bookings" : null,
            caseRef.threadId ? "focus-inbox" : null,
            caseRef.customerPhone ? "call" : null,
            caseRef.customerPhone ? "whatsapp" : null,
            caseRef.customerEmail ? "email" : null,
          ].filter((action): action is OwnerDeskAction => Boolean(action)),
        ),
      );

      let priorityBand: OwnerDeskCase["priorityBand"] = "watch";
      if (heatScore >= 75) priorityBand = "hot";
      else if (heatScore >= 45) priorityBand = "warm";

      const lastTimelineItem = caseRef.timeline[0];

      return {
        id: caseRef.id,
        customerName:
          caseRef.customerName ||
          caseRef.customerEmail?.split("@")[0] ||
          caseRef.customerPhone ||
          "Unknown traveler",
        customerEmail: caseRef.customerEmail,
        customerPhone: caseRef.customerPhone,
        preferredLanguage: caseRef.preferredLanguage,
        serviceMode: caseRef.serviceMode,
        needsHumanHelp: caseRef.needsHumanHelp,
        route: caseRef.route,
        sourceLabel: sourceLabelFromTimeline(lastTimelineItem),
        stage: stageInfo.stage,
        stageLabel: stageInfo.stageLabel,
        priorityBand,
        heatScore,
        nextBestAction: stageInfo.nextBestAction,
        availableActions,
        lastTouchAt: caseRef.lastTouchAt ? new Date(caseRef.lastTouchAt).toISOString() : null,
        latestSummary: caseRef.latestSummary,
        totalRevenue: Math.round(caseRef.totalRevenue * 100) / 100,
        totalBookings: caseRef.totalBookings,
        pendingBookings: caseRef.pendingBookings,
        unreadInboxCount: caseRef.unreadInboxCount,
        openEscalations: caseRef.openEscalations,
        liveRequests: caseRef.liveRequests,
        activeLiveSessions: caseRef.activeLiveSessions,
        bookingId: caseRef.bookingId,
        threadId: caseRef.threadId,
        liveSessionId: caseRef.liveSessionId,
        escalationId: caseRef.escalationId,
        timeline: caseRef.timeline.slice(0, 4),
      };
    })
    .sort((left, right) => {
      const scoreDiff = right.heatScore - left.heatScore;
      if (scoreDiff !== 0) return scoreDiff;
      return toTimestamp(right.lastTouchAt) - toTimestamp(left.lastTouchAt);
    });

  const alerts: OwnerDeskAlert[] = finalizedCases
    .filter((ownerCase) =>
      ownerCase.priorityBand === "hot" ||
      ["respond-now", "service-recovery", "payment-follow-up", "ticket-issue", "active-live"].includes(ownerCase.stage),
    )
    .map((ownerCase) => {
      const level: OwnerDeskAlert["level"] =
        ownerCase.stage === "service-recovery" || ownerCase.stage === "respond-now" || ownerCase.openEscalations > 0
          ? "critical"
          : ownerCase.priorityBand === "hot" || ownerCase.stage === "payment-follow-up" || ownerCase.stage === "ticket-issue"
            ? "attention"
            : "info";

      return {
        id: `alert-${ownerCase.id}-${ownerCase.stage}`,
        level,
      title: alertTitleFromCase(ownerCase),
      summary: ownerCase.latestSummary || ownerCase.nextBestAction.description,
      customerCaseId: ownerCase.id,
      customerName: ownerCase.customerName,
      route: ownerCase.route,
      stageLabel: ownerCase.stageLabel,
      heatScore: ownerCase.heatScore,
      triggeredAt: ownerCase.lastTouchAt,
      action: ownerCase.nextBestAction.action,
      actionLabel: ownerCase.nextBestAction.label,
      actionUrl: actionUrlFromCase(ownerCase, ownerCase.nextBestAction.action),
      customerPhone: ownerCase.customerPhone,
      customerEmail: ownerCase.customerEmail,
      liveSessionId: ownerCase.liveSessionId,
      bookingId: ownerCase.bookingId,
      threadId: ownerCase.threadId,
      };
    })
    .slice(0, 8);

  const followUps: OwnerDeskFollowUp[] = finalizedCases
    .filter((ownerCase) => ownerCase.stage !== "post-sale" || ownerCase.unreadInboxCount > 0 || ownerCase.openEscalations > 0)
    .map((ownerCase) => {
      const dueMinutes = followUpMinutesFromStage(ownerCase.stage);
      const anchorTs = toTimestamp(ownerCase.lastTouchAt) || nowTs;
      const dueTs = anchorTs + (dueMinutes * 60 * 1000);
      const dueAt = new Date(dueTs).toISOString();
      const overdue = dueTs <= nowTs;
      const urgency: OwnerDeskFollowUp["urgency"] =
        overdue ? "overdue" : dueTs <= nowTs + (60 * 60 * 1000) ? "soon" : "planned";

      return {
        id: `follow-up-${ownerCase.id}-${ownerCase.stage}`,
        customerCaseId: ownerCase.id,
        customerName: ownerCase.customerName,
        route: ownerCase.route,
        dueAt,
        overdue,
        urgency,
        reason: followUpReasonFromCase(ownerCase),
        channel: ownerCase.nextBestAction.action,
        actionLabel: ownerCase.nextBestAction.label,
        actionUrl: actionUrlFromCase(ownerCase, ownerCase.nextBestAction.action),
        customerPhone: ownerCase.customerPhone,
        customerEmail: ownerCase.customerEmail,
        liveSessionId: ownerCase.liveSessionId,
        bookingId: ownerCase.bookingId,
        threadId: ownerCase.threadId,
      };
    })
    .sort((left, right) => toTimestamp(left.dueAt) - toTimestamp(right.dueAt))
    .slice(0, 12);

  const criticalAlertCount = alerts.filter((item) => item.level === "critical").length;
  const dueSoonCount = followUps.filter((item) => item.urgency !== "planned").length;

  return {
    generatedAt: now.toISOString(),
    summary: {
      totalCases: finalizedCases.length,
      hotCases: finalizedCases.filter((item) => item.priorityBand === "hot").length,
      seniorCases: finalizedCases.filter((item) => item.serviceMode === "senior").length,
      paymentWatch: finalizedCases.filter((item) => item.stage === "payment-follow-up").length,
      liveNow: finalizedCases.filter((item) => item.liveRequests > 0 || item.activeLiveSessions > 0).length,
      alertingNow: alerts.length,
      overdueFollowUps: followUps.filter((item) => item.overdue).length,
    },
    alerts,
    followUps,
    cases: finalizedCases,
  };
}
