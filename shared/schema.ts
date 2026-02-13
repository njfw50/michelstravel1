import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import auth models - CRITICAL for Replit Auth
export * from "./models/auth";
import { users } from "./models/auth";

// Import chat models for AI chatbot
export * from "./models/chat";

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
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0.05"),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  status: text("status").default("pending"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripePaymentStatus: text("stripe_payment_status").default("pending"),
  confirmationEmailSent: boolean("confirmation_email_sent").default(false),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SITE SETTINGS (Admin Control) ===
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").default("SkyScanner Clone"),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).default("5.00"),
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

// === TYPES ===
export type FlightSearch = typeof flightSearches.$inferSelect;
export type InsertFlightSearch = z.infer<typeof insertFlightSearchSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingsSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

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
  conditions?: {
    changeBeforeDeparture?: { allowed: boolean; penaltyAmount?: string; penaltyCurrency?: string } | null;
    refundBeforeDeparture?: { allowed: boolean; penaltyAmount?: string; penaltyCurrency?: string } | null;
  } | null;
}
