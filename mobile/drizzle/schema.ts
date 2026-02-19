import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabelas Mobile Auth
export const mobileUsers = mysqlTable("mobile_users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "agent"]).default("agent").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
});

export const mobileSessions = mysqlTable("mobile_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accessToken: varchar("accessToken", { length: 500 }).notNull().unique(),
  refreshToken: varchar("refreshToken", { length: 500 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  refreshExpiresAt: timestamp("refreshExpiresAt").notNull(),
  deviceInfo: text("deviceInfo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
});

export const pushTokens = mysqlTable("push_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 500 }).notNull().unique(),
  platform: mysqlEnum("platform", ["android", "ios", "web"]).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const mobileActivityLog = mysqlTable("mobile_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MobileUser = typeof mobileUsers.$inferSelect;
export type InsertMobileUser = typeof mobileUsers.$inferInsert;
export type MobileSession = typeof mobileSessions.$inferSelect;
export type InsertMobileSession = typeof mobileSessions.$inferInsert;
export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;
export type MobileActivityLog = typeof mobileActivityLog.$inferSelect;
export type InsertMobileActivityLog = typeof mobileActivityLog.$inferInsert;

// Tabelas de Reservas e Voos
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 50 }),
  flightNumber: varchar("flightNumber", { length: 50 }).notNull(),
  airline: varchar("airline", { length: 100 }).notNull(),
  origin: varchar("origin", { length: 100 }).notNull(),
  destination: varchar("destination", { length: 100 }).notNull(),
  departureDate: timestamp("departureDate").notNull(),
  returnDate: timestamp("returnDate"),
  basePrice: varchar("basePrice", { length: 20 }).notNull(),
  commission: varchar("commission", { length: 20 }).notNull(),
  totalPrice: varchar("totalPrice", { length: 20 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "refunded"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
  cancelledAt: timestamp("cancelledAt"),
});

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  amount: varchar("amount", { length: 20 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["credit_card", "debit_card", "pix", "bank_transfer", "cash"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeChargeId: varchar("stripeChargeId", { length: 255 }),
  transactionId: varchar("transactionId", { length: 255 }),
  receiptUrl: text("receiptUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId"),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientPhone: varchar("clientPhone", { length: 50 }),
  status: mysqlEnum("status", ["open", "closed", "archived"]).default("open").notNull(),
  unreadCount: int("unreadCount").default(0).notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId"),
  senderType: mysqlEnum("senderType", ["agent", "client"]).notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "file"]).default("text").notNull(),
  attachmentUrl: text("attachmentUrl"),
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const escalations = mysqlTable("escalations", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["booking_issue", "payment_issue", "customer_complaint", "technical_issue", "other"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "resolved", "cancelled"]).default("pending").notNull(),
  bookingId: int("bookingId"),
  conversationId: int("conversationId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  assignedToUserId: int("assignedToUserId"),
  resolvedByUserId: int("resolvedByUserId"),
  resolution: text("resolution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Escalation = typeof escalations.$inferSelect;
export type InsertEscalation = typeof escalations.$inferInsert;
