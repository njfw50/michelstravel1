import { int, mysqlTable, text, timestamp, varchar, decimal, mysqlEnum } from "drizzle-orm/mysql-core";

// Tabela de reservas de voos
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // ID do usuário mobile que criou
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 50 }),
  
  // Informações do voo
  flightNumber: varchar("flightNumber", { length: 50 }).notNull(),
  airline: varchar("airline", { length: 100 }).notNull(),
  origin: varchar("origin", { length: 100 }).notNull(),
  destination: varchar("destination", { length: 100 }).notNull(),
  departureDate: timestamp("departureDate").notNull(),
  returnDate: timestamp("returnDate"),
  
  // Informações financeiras
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  
  // Status
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "refunded"]).default("pending").notNull(),
  
  // Metadados
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
  cancelledAt: timestamp("cancelledAt"),
});

// Tabela de pagamentos
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  
  paymentMethod: mysqlEnum("paymentMethod", ["credit_card", "debit_card", "pix", "bank_transfer", "cash"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  
  // Integração Stripe (opcional)
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeChargeId: varchar("stripeChargeId", { length: 255 }),
  
  transactionId: varchar("transactionId", { length: 255 }),
  receiptUrl: text("receiptUrl"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

// Tabela de conversas/mensagens
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
  
  senderId: int("senderId"), // ID do usuário mobile (null se for cliente)
  senderType: mysqlEnum("senderType", ["agent", "client"]).notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  
  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "file"]).default("text").notNull(),
  attachmentUrl: text("attachmentUrl"),
  
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Tabela de escalações (do assistente de voz)
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

// Exportar tipos
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
