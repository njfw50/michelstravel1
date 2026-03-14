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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  profileImageUrl: varchar("profile_image_url"),
  githubId: varchar("github_id").unique(),
  githubUsername: varchar("github_username"),
  passwordHash: varchar("password_hash"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerProfiles = pgTable("customer_profiles", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  experienceMode: text("experience_mode").notNull().default("standard"),
  preferredLanguage: text("preferred_language").notNull().default("pt"),
  preferredAirport: text("preferred_airport"),
  savedPassengers: jsonb("saved_passengers").notNull().default(sql`'[]'::jsonb`),
  connectionTolerance: text("connection_tolerance").notNull().default("balanced"),
  bagsPreference: text("bags_preference").notNull().default("flexible"),
  needsHumanHelp: boolean("needs_human_help").notNull().default(false),
  biometricEnabled: boolean("biometric_enabled").notNull().default(false),
  scannerHandoffEnabled: boolean("scanner_handoff_enabled").notNull().default(true),
  seniorAssistantEnabled: boolean("senior_assistant_enabled").notNull().default(false),
  lastActiveBookingId: integer("last_active_booking_id"),
  lastActiveOfferId: text("last_active_offer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerMobileDevices = pgTable(
  "customer_mobile_devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    storeChannel: text("store_channel").notNull().default("direct"),
    appVariant: text("app_variant").notNull().default("standard"),
    deviceName: text("device_name"),
    deviceModel: text("device_model"),
    osVersion: text("os_version"),
    appVersion: text("app_version"),
    pushToken: text("push_token"),
    trustedAt: timestamp("trusted_at"),
    lastSeenAt: timestamp("last_seen_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_customer_mobile_devices_user_id").on(table.userId),
  ],
);

export const customerMobileRefreshTokens = pgTable(
  "customer_mobile_refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    deviceId: uuid("device_id").notNull().references(() => customerMobileDevices.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    lastUsedAt: timestamp("last_used_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_customer_mobile_refresh_tokens_user_id").on(table.userId),
    index("IDX_customer_mobile_refresh_tokens_device_id").on(table.deviceId),
  ],
);

export const documentScanSessions = pgTable(
  "document_scan_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
    deviceId: uuid("device_id").references(() => customerMobileDevices.id, { onDelete: "set null" }),
    bookingId: integer("booking_id"),
    passengerIndex: integer("passenger_index").notNull().default(0),
    sourceChannel: text("source_channel").notNull().default("web"),
    targetChannel: text("target_channel").notNull().default("mobile"),
    appVariant: text("app_variant").notNull().default("standard"),
    pairingCode: varchar("pairing_code", { length: 12 }).notNull().unique(),
    deepLinkToken: varchar("deep_link_token", { length: 128 }).notNull().unique(),
    status: text("status").notNull().default("pending_pair"),
    contextSnapshot: jsonb("context_snapshot").notNull().default(sql`'{}'::jsonb`),
    expiresAt: timestamp("expires_at").notNull(),
    pairedAt: timestamp("paired_at"),
    confirmedAt: timestamp("confirmed_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_document_scan_sessions_user_id").on(table.userId),
    index("IDX_document_scan_sessions_booking_id").on(table.bookingId),
  ],
);

export const documentScanResults = pgTable(
  "document_scan_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scanSessionId: uuid("scan_session_id").notNull().references(() => documentScanSessions.id, { onDelete: "cascade" }),
    imageFrontUrl: text("image_front_url"),
    imageBackUrl: text("image_back_url"),
    croppedMrzUrl: text("cropped_mrz_url"),
    ocrEngine: text("ocr_engine").notNull().default("web_fallback"),
    mrzText: text("mrz_text"),
    parsedData: jsonb("parsed_data").notNull().default(sql`'{}'::jsonb`),
    warnings: jsonb("warnings").notNull().default(sql`'[]'::jsonb`),
    confidence: integer("confidence"),
    reviewStatus: text("review_status").notNull().default("pending"),
    reviewerMode: text("reviewer_mode").notNull().default("customer"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_document_scan_results_session_id").on(table.scanSessionId),
  ],
);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = typeof customerProfiles.$inferInsert;
export type CustomerMobileDevice = typeof customerMobileDevices.$inferSelect;
export type InsertCustomerMobileDevice = typeof customerMobileDevices.$inferInsert;
export type CustomerMobileRefreshToken = typeof customerMobileRefreshTokens.$inferSelect;
export type InsertCustomerMobileRefreshToken = typeof customerMobileRefreshTokens.$inferInsert;
export type DocumentScanSession = typeof documentScanSessions.$inferSelect;
export type InsertDocumentScanSession = typeof documentScanSessions.$inferInsert;
export type DocumentScanResult = typeof documentScanResults.$inferSelect;
export type InsertDocumentScanResult = typeof documentScanResults.$inferInsert;
