import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, boolean, text, integer, uuid } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  displayName: text("display_name"),
  role: text("role").notNull().default("customer"), // customer, admin, support
  phone: text("phone"),
  profileImageUrl: text("profile_image_url"),
  githubId: text("github_id").unique(),
  githubUsername: text("github_username"),
  passwordHash: text("password_hash"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerProfiles = pgTable("customer_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  dateOfBirth: timestamp("date_of_birth", { mode: 'string' }),
  preferredDestinations: text("preferred_destinations").array(),
  accessibilityNeeds: text("accessibility_needs"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  experienceMode: text("experience_mode").notNull().default("standard"),
  preferredLanguage: text("preferred_language").notNull().default("pt"),
  preferredAirport: text("preferred_airport"),
  savedPassengers: jsonb("saved_passengers").notNull().default(sql`'[]'::jsonb`),
  connectionTolerance: text("connection_tolerance").notNull().default("balanced"),
  bagsPreference: text("bags_preference").notNull().default("flexible"),
  needsHumanHelp: boolean("needs_human_help").notNull().default(false),
  seniorAssistantEnabled: boolean("senior_assistant_enabled").notNull().default(false),
  lastActiveBookingId: uuid("last_active_booking_id"),
  lastActiveOfferId: text("last_active_offer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = typeof customerProfiles.$inferInsert;
