import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import { 
  bookings, 
  payments,
  conversations,
  messages,
  escalations,
  type Booking,
  type InsertBooking,
  type InsertPayment,
  type InsertConversation,
  type InsertMessage,
  type InsertEscalation
} from "../drizzle/schema";

// ===== BOOKINGS =====

export async function getAllBookings(userId?: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(bookings);
  
  if (userId) {
    query = query.where(eq(bookings.userId, userId)) as any;
  }
  
  return query.orderBy(desc(bookings.createdAt)).limit(limit).offset(offset);
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0] || null;
}

export async function createBooking(data: InsertBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bookings).values(data);
  return Number((result as any).insertId || 0);
}

export async function updateBooking(id: number, data: Partial<InsertBooking>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(bookings).set(data).where(eq(bookings.id, id));
}

export async function deleteBooking(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(bookings).where(eq(bookings.id, id));
}

export async function getBookingsByStatus(status: string, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(bookings)
    .where(eq(bookings.status, status as any))
    .orderBy(desc(bookings.createdAt))
    .limit(limit);
}

// ===== DASHBOARD STATS =====

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  
  // Total de reservas ativas
  const activeBookingsResult = await db.select({ count: sql<number>`count(*)` })
    .from(bookings)
    .where(sql`status IN ('pending', 'confirmed')`);
  
  // Total de receita (soma de totalPrice de reservas pagas)
  const revenueResult = await db.select({ total: sql<string>`SUM(CAST(totalPrice AS DECIMAL(10,2)))` })
    .from(bookings)
    .where(eq(bookings.paymentStatus, "paid"));
  
  // Total de comissões
  const commissionsResult = await db.select({ total: sql<string>`SUM(CAST(commission AS DECIMAL(10,2)))` })
    .from(bookings)
    .where(eq(bookings.paymentStatus, "paid"));
  
  // Novos clientes (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newClientsResult = await db.select({ count: sql<number>`COUNT(DISTINCT clientEmail)` })
    .from(bookings)
    .where(gte(bookings.createdAt, thirtyDaysAgo));
  
  return {
    activeBookings: Number(activeBookingsResult[0]?.count || 0),
    totalRevenue: parseFloat(revenueResult[0]?.total || "0"),
    totalCommissions: parseFloat(commissionsResult[0]?.total || "0"),
    newClients: Number(newClientsResult[0]?.count || 0),
  };
}

export async function getRecentActivity(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: bookings.id,
    type: sql<string>`'booking'`,
    clientName: bookings.clientName,
    description: sql<string>`CONCAT('Reserva ', flightNumber, ' - ', origin, ' → ', destination)`,
    status: bookings.status,
    createdAt: bookings.createdAt,
  })
    .from(bookings)
    .orderBy(desc(bookings.createdAt))
    .limit(limit);
}

// ===== PAYMENTS =====

export async function getPaymentsByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(payments).where(eq(payments.bookingId, bookingId));
}

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(payments).values(data);
  return Number((result as any).insertId || 0);
}

export async function updatePayment(id: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(payments).set(data).where(eq(payments.id, id));
}

// ===== CONVERSATIONS & MESSAGES =====

export async function getAllConversations(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(conversations)
    .orderBy(desc(conversations.lastMessageAt))
    .limit(limit)
    .offset(offset);
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0] || null;
}

export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(conversations).values(data);
  return Number((result as any).insertId || 0);
}

export async function getMessagesByConversationId(conversationId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .limit(limit);
}

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(messages).values(data);
  const messageId = Number((result as any).insertId || 0);
  
  // Atualizar lastMessageAt da conversa
  await db.update(conversations)
    .set({ 
      lastMessageAt: new Date(),
      unreadCount: sql`unreadCount + 1`
    })
    .where(eq(conversations.id, data.conversationId));
  
  return messageId;
}

export async function markMessagesAsRead(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(messages)
    .set({ isRead: 1 })
    .where(and(
      eq(messages.conversationId, conversationId),
      eq(messages.isRead, 0)
    ));
  
  await db.update(conversations)
    .set({ unreadCount: 0 })
    .where(eq(conversations.id, conversationId));
}

// ===== ESCALATIONS =====

export async function getAllEscalations(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(escalations)
    .orderBy(desc(escalations.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getEscalationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(escalations).where(eq(escalations.id, id)).limit(1);
  return result[0] || null;
}

export async function createEscalation(data: InsertEscalation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(escalations).values(data);
  return Number((result as any).insertId || 0);
}

export async function updateEscalation(id: number, data: Partial<InsertEscalation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(escalations).set(data).where(eq(escalations.id, id));
}

export async function getPendingEscalations() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(escalations)
    .where(eq(escalations.status, "pending"))
    .orderBy(desc(escalations.priority), desc(escalations.createdAt));
}
