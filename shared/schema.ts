import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import auth models - CRITICAL for Replit Auth
export * from "./models/auth";
import { users } from "./models/auth";

// Import chat models for AI chatbot
export * from "./models/chat";
import { conversations } from "./models/chat";

// === FLIGHT SEARCH CACHE (For SEO & History) ===
export const flightSearches = pgTable("flight_searches", {
  id: serial("id").primaryKey(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  departureDate: text("departure_date").notNull(), // YYYY-MM-DD
  returnDate: text("return_date"),
  passengers: integer("passengers").default(1),
  adults: integer("adults").default(1),
  children: integer("children").default(0),
  infants: integer("infants").default(0),
  cabinClass: text("cabin_class").default("economy"),
  searchCount: integer("search_count").default(1),
  lastSearchedAt: timestamp("last_searched_at").defaultNow(),
});

// === BOOKINGS (Commission Tracking) ===
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  referenceCode: text("reference_code").unique(),
  userId: text("user_id").references(() => users.id),
  flightData: jsonb("flight_data").notNull(),
  passengerDetails: jsonb("passenger_details").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0.085"),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  status: text("status").default("pending"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripePaymentStatus: text("stripe_payment_status").default("pending"),
  stripeReceiptUrl: text("stripe_receipt_url"),
  confirmationEmailSent: boolean("confirmation_email_sent").default(false),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  duffelOrderId: text("duffel_order_id"),
  duffelBookingReference: text("duffel_booking_reference"),
  ticketStatus: text("ticket_status").default("pending"),
  ticketNumber: text("ticket_number"),
  airlineInitiatedChanges: jsonb("airline_initiated_changes"),
  lastDuffelWebhookAt: timestamp("last_duffel_webhook_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SITE SETTINGS (Admin Control) ===
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").default("SkyScanner Clone"),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).default("8.50"),
  heroTitle: text("hero_title").default("Find Your Next Adventure"),
  heroSubtitle: text("hero_subtitle").default("Best prices on flights worldwide."),
  testMode: boolean("test_mode").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === SEO BLOG POSTS ===
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),
  language: text("language").default("pt").notNull(),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === LIVE SESSIONS (Agent-Client Real-time Sales) ===
export const liveSessions = pgTable("live_sessions", {
  id: serial("id").primaryKey(),
  accessToken: text("access_token").notNull(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  visitorId: text("visitor_id"),
  language: text("language").default("pt"),
  status: text("status").default("requested").notNull(), // requested, active, closed
  whatsappLink: text("whatsapp_link"),
  approvedOfferId: text("approved_offer_id"),
  approvedFlightData: jsonb("approved_flight_data"),
  bookingId: integer("booking_id"),
  bookingStatus: text("booking_status"), // null, approved, documents_requested, documents_submitted, booking_created, payment_pending, confirmed
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  submittedDocuments: jsonb("submitted_documents"),
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const liveSessionBlocks = pgTable("live_session_blocks", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => liveSessions.id, { onDelete: "cascade" }),
  blockType: text("block_type").notNull(), // search_results, offer_detail, pricing, baggage, custom_note
  payload: jsonb("payload").notNull(),
  shared: boolean("shared").default(false).notNull(),
  sortOrder: integer("sort_order").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const liveSessionMessages = pgTable("live_session_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => liveSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // admin, client
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === INTERNAL MESSENGER ===
export const internalThreads = pgTable("internal_threads", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  status: text("status").default("open").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const internalMessages = pgTable("internal_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => internalThreads.id, { onDelete: "cascade" }),
  senderRole: text("sender_role").notNull(),
  senderName: text("sender_name"),
  content: text("content").notNull(),
  readByAdmin: boolean("read_by_admin").default(false),
  readByUser: boolean("read_by_user").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === VOICE ESCALATIONS (Phone Assistant) ===
export const voiceEscalations = pgTable("voice_escalations", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'voice' or 'chat'
  reason: text("reason").notNull(),
  customerPhone: text("customer_phone"),
  summary: text("summary"),
  callSid: text("call_sid"),
  status: text("status").default("pending").notNull(), // pending, in_progress, resolved
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// === FEATURED DEALS (Zapier/Social Media Promotions) ===
export const featuredDeals = pgTable("featured_deals", {
  id: serial("id").primaryKey(),
  origin: text("origin").notNull(),
  originCity: text("origin_city"),
  destination: text("destination").notNull(),
  destinationCity: text("destination_city"),
  departureDate: text("departure_date"),
  returnDate: text("return_date"),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  airline: text("airline"),
  cabinClass: text("cabin_class").default("economy"),
  headline: text("headline"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  lastPublishedAt: timestamp("last_published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertFlightSearchSchema = createInsertSchema(flightSearches).omit({ id: true, searchCount: true, lastSearchedAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, commissionAmount: true });
export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({ id: true, updatedAt: true });
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true });
export const insertLiveSessionSchema = createInsertSchema(liveSessions).omit({ id: true, createdAt: true, closedAt: true });
export const insertLiveSessionBlockSchema = createInsertSchema(liveSessionBlocks).omit({ id: true, updatedAt: true });
export const insertLiveSessionMessageSchema = createInsertSchema(liveSessionMessages).omit({ id: true, createdAt: true });
export const insertInternalThreadSchema = createInsertSchema(internalThreads).omit({ id: true, createdAt: true, lastMessageAt: true });
export const insertInternalMessageSchema = createInsertSchema(internalMessages).omit({ id: true, createdAt: true });
export const insertVoiceEscalationSchema = createInsertSchema(voiceEscalations).omit({ id: true, createdAt: true, resolvedAt: true });
export const insertFeaturedDealSchema = createInsertSchema(featuredDeals).omit({ id: true, createdAt: true, lastPublishedAt: true });

// === TYPES ===
export type FlightSearch = typeof flightSearches.$inferSelect;
export type InsertFlightSearch = z.infer<typeof insertFlightSearchSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingsSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type LiveSession = typeof liveSessions.$inferSelect;
export type InsertLiveSession = z.infer<typeof insertLiveSessionSchema>;
export type LiveSessionBlock = typeof liveSessionBlocks.$inferSelect;
export type InsertLiveSessionBlock = z.infer<typeof insertLiveSessionBlockSchema>;
export type LiveSessionMessage = typeof liveSessionMessages.$inferSelect;
export type InsertLiveSessionMessage = z.infer<typeof insertLiveSessionMessageSchema>;

export type InternalThread = typeof internalThreads.$inferSelect;
export type InsertInternalThread = z.infer<typeof insertInternalThreadSchema>;
export type InternalMessage = typeof internalMessages.$inferSelect;
export type InsertInternalMessage = z.infer<typeof insertInternalMessageSchema>;

export type VoiceEscalation = typeof voiceEscalations.$inferSelect;
export type InsertVoiceEscalation = z.infer<typeof insertVoiceEscalationSchema>;

export type FeaturedDeal = typeof featuredDeals.$inferSelect;
export type InsertFeaturedDeal = z.infer<typeof insertFeaturedDealSchema>;

// === API TYPES ===
// Search Query Params
export interface FlightSearchParams {
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
  returnDate?: string;
  passengers?: string;
  adults?: string;
  children?: string;
  infants?: string;
  cabinClass?: string;
  tripType?: string;
  legs?: { origin: string; destination: string; date: string }[];
}

export interface FlightSegment {
  segmentId: string;
  carrierCode: string;
  carrierName: string;
  flightNumber: string;
  aircraftType: string | null;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  originCode: string;
  originName: string;
  originCity: string | null;
  originTerminal: string | null;
  destinationCode: string;
  destinationName: string;
  destinationCity: string | null;
  destinationTerminal: string | null;
}

export interface FlightSlice {
  duration: string;
  originCode: string;
  originCity: string | null;
  destinationCode: string;
  destinationCity: string | null;
  segments: FlightSegment[];
}

export interface FlightPassengerBaggage {
  type: string;
  quantity: number;
}

export interface FlightPassengerInfo {
  passengerId: string;
  passengerType: string;
  cabinClass: string;
  cabinClassName: string;
  baggages: FlightPassengerBaggage[];
  fareBrandName: string | null;
}

export interface FlightOffer {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;
  logoUrl?: string | null;
  aircraftType?: string | null;
  originCity?: string | null;
  destinationCity?: string | null;
  originCode?: string | null;
  destinationCode?: string | null;
  cabinClass?: string | null;
  slices?: FlightSlice[];
  passengers?: FlightPassengerInfo[];
  passengerIdentityDocumentsRequired?: boolean;
  taxAmount?: string | null;
  baseAmount?: string | null;
  totalEmissionsKg?: string | null;
  supportedLoyaltyProgrammes?: string[];
  availableServices?: FlightAvailableService[];
  conditions?: {
    changeBeforeDeparture?: { allowed: boolean; penaltyAmount?: string; penaltyCurrency?: string } | null;
    refundBeforeDeparture?: { allowed: boolean; penaltyAmount?: string; penaltyCurrency?: string } | null;
  } | null;
}

export interface FlightAvailableService {
  id: string;
  type: string;
  totalAmount: string;
  totalCurrency: string;
  maxQuantity: number;
  passengerIds: string[];
  segmentIds: string[];
  metadata?: any;
}

export interface SeatMapCabin {
  cabinClass: string;
  aisles: number;
  rows: SeatMapRow[];
  wings?: { firstRowIndex: number; lastRowIndex: number } | null;
}

export interface SeatMapRow {
  sections: SeatMapSection[];
}

export interface SeatMapSection {
  elements: SeatMapElement[];
}

export interface SeatMapElement {
  type: string;
  designator?: string;
  name?: string;
  disclosures?: string[];
  available?: boolean;
  totalAmount?: string;
  totalCurrency?: string;
  serviceId?: string;
}

export interface SeatMap {
  segmentId: string;
  cabins: SeatMapCabin[];
}

export interface OrderSyncResult {
  synced: boolean;
  status?: string;
  bookingReference?: string;
  ticketNumbers?: string[];
  documents?: Array<{ type: string; uniqueIdentifier?: string }>;
  availableActions?: string[];
  conditions?: any;
  airlineInitiatedChanges?: any[];
  slices?: any[];
  paymentStatus?: any;
}
