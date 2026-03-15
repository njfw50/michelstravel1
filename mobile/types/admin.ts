export interface AdminAuthResponse {
  token: string;
}

export interface AdminSessionInfo {
  authenticated: boolean;
  expiresAt?: number;
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
  action: "open-live-desk" | "open-bookings" | "focus-inbox" | "call" | "whatsapp" | "email";
  actionLabel: string;
  actionUrl: string;
  customerPhone: string | null;
  customerEmail: string | null;
  liveSessionId: number | null;
  bookingId: number | null;
  threadId: number | null;
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
  channel: "open-live-desk" | "open-bookings" | "focus-inbox" | "call" | "whatsapp" | "email";
  actionLabel: string;
  actionUrl: string;
  customerPhone: string | null;
  customerEmail: string | null;
  liveSessionId: number | null;
  bookingId: number | null;
  threadId: number | null;
}

export interface OwnerDeskSummary {
  totalCases: number;
  hotCases: number;
  seniorCases: number;
  paymentWatch: number;
  liveNow: number;
  mobileLinked: number;
  alertingNow: number;
  overdueFollowUps: number;
}

export interface OwnerDeskMobileDeck {
  headline: string;
  criticalCount: number;
  dueSoonCount: number;
  linkedDevices: number;
}

export interface OwnerDeskData {
  generatedAt: string;
  summary: OwnerDeskSummary;
  mobileDeck: OwnerDeskMobileDeck;
  alerts: OwnerDeskAlert[];
  followUps: OwnerDeskFollowUp[];
}
