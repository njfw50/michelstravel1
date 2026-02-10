import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import auth models - CRITICAL for Replit Auth
export * from "./models/auth";
import { users } from "./models/auth";

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
  userId: text("user_id").references(() => users.id), // Optional: guest checkout possible?
  flightData: jsonb("flight_data").notNull(), // Snapshot of flight details
  passengerDetails: jsonb("passenger_details").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("0.05"), // 5% default
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  status: text("status").default("pending"), // pending, confirmed, cancelled
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripePaymentStatus: text("stripe_payment_status").default("pending"),
  contactEmail: text("contact_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SITE SETTINGS (Admin Control) ===
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").default("SkyScanner Clone"),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).default("5.00"),
  heroTitle: text("hero_title").default("Find Your Next Adventure"),
  heroSubtitle: text("hero_subtitle").default("Best prices on flights worldwide."),
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
  // Multi-city support could be added here later as an array of slices
  // slices?: Array<{ origin: string; destination: string; date: string }>;
}

// Mock Flight Result Type (since we don't have real API yet)
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
}
