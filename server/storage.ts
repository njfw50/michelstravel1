import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  flightSearches, bookings, siteSettings, blogPosts, users,
  liveSessions, liveSessionBlocks, liveSessionMessages,
  internalThreads, internalMessages, voiceEscalations, featuredDeals,
  seniorAlerts, customers, transactions, bookingLogs, knowledgeBase, scannerSessions,
  type FlightSearch, type InsertFlightSearch,
  type Booking, type InsertBooking,
  type SiteSetting, type InsertSiteSetting,
  type BlogPost, type InsertBlogPost,
  type LiveSession, type InsertLiveSession,
  type LiveSessionBlock, type InsertLiveSessionBlock,
  type LiveSessionMessage, type InsertLiveSessionMessage,
  type InternalThread, type InsertInternalThread,
  type InternalMessage, type InsertInternalMessage,
  type VoiceEscalation, type InsertVoiceEscalation,
  type FeaturedDeal, type InsertFeaturedDeal,
  type SeniorAlert, type InsertSeniorAlert,
  type Customer, type InsertCustomer,
  type Transaction, type InsertTransaction,
  type BookingLog, type InsertBookingLog,
  type KnowledgeBaseEntry, type InsertKnowledgeBaseEntry,
  type ScannerSessionData, type InsertScannerSession,
} from "@shared/schema";

// Import Auth Storage
import { authStorage, type IAuthStorage } from "./replit_integrations/auth";

type StorageInsertBooking = typeof bookings.$inferInsert;

export interface IStorage extends IAuthStorage {
  // Flights
  createFlightSearch(search: InsertFlightSearch): Promise<FlightSearch>;
  getFlightSearches(): Promise<FlightSearch[]>;
  getPopularDestinations(): Promise<FlightSearch[]>;

  // Bookings
  createBooking(booking: StorageInsertBooking): Promise<Booking>;
  updateBooking(id: number, updates: Partial<StorageInsertBooking>): Promise<Booking | undefined>;
  getBookings(userId?: string): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByReference(referenceCode: string): Promise<Booking | undefined>;
  getBookingByReferenceAndEmail(referenceCode: string, email: string): Promise<Booking | undefined>;

  // Settings
  getSiteSettings(): Promise<SiteSetting | undefined>;
  upsertSiteSettings(settings: InsertSiteSetting): Promise<SiteSetting>;

  // Blog
  getBlogPosts(language?: string): Promise<BlogPost[]>;
  getBlogPost(slug: string, preferredLanguage?: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;

  // Profile
  updateUserProfile(userId: string, profile: { firstName?: string; lastName?: string; phone?: string }): Promise<any>;

  // Live Sessions
  createLiveSession(session: InsertLiveSession): Promise<LiveSession>;
  getLiveSession(id: number): Promise<LiveSession | undefined>;
  getLiveSessionByVisitor(visitorId: string): Promise<LiveSession | undefined>;
  getLiveSessionRequests(): Promise<LiveSession[]>;
  getActiveLiveSessions(): Promise<LiveSession[]>;
  updateLiveSessionStatus(id: number, status: string): Promise<LiveSession | undefined>;
  updateLiveSession(id: number, updates: Record<string, any>): Promise<LiveSession | undefined>;
  createLiveSessionBlock(block: InsertLiveSessionBlock): Promise<LiveSessionBlock>;
  updateLiveSessionBlock(id: number, updates: Partial<InsertLiveSessionBlock>): Promise<LiveSessionBlock | undefined>;
  getLiveSessionBlocks(sessionId: number, sharedOnly?: boolean): Promise<LiveSessionBlock[]>;
  deleteLiveSessionBlock(id: number): Promise<void>;
  createLiveSessionMessage(msg: InsertLiveSessionMessage): Promise<LiveSessionMessage>;
  getLiveSessionMessages(sessionId: number): Promise<LiveSessionMessage[]>;

  // Internal Messenger
  createInternalThread(thread: InsertInternalThread): Promise<InternalThread>;
  getInternalThreadsByUser(userId: string): Promise<InternalThread[]>;
  getAllInternalThreads(): Promise<(InternalThread & { userName?: string; userEmail?: string; unreadCount?: number })[]>;
  getInternalThread(id: number): Promise<InternalThread | undefined>;
  createInternalMessage(msg: InsertInternalMessage): Promise<InternalMessage>;
  getInternalMessages(threadId: number): Promise<InternalMessage[]>;
  markMessagesRead(threadId: number, role: "admin" | "user"): Promise<void>;
  getUnreadCountForUser(userId: string): Promise<number>;
  getUnreadCountForAdmin(): Promise<number>;

  // Voice Escalations
  createVoiceEscalation(escalation: InsertVoiceEscalation): Promise<VoiceEscalation>;
  getAllVoiceEscalations(): Promise<VoiceEscalation[]>;
  updateVoiceEscalation(id: number, updates: Partial<InsertVoiceEscalation>): Promise<VoiceEscalation | undefined>;

  // Featured Deals (Zapier)
  getFeaturedDeals(activeOnly?: boolean): Promise<FeaturedDeal[]>;
  getFeaturedDeal(id: number): Promise<FeaturedDeal | undefined>;
  createFeaturedDeal(deal: InsertFeaturedDeal): Promise<FeaturedDeal>;
  updateFeaturedDeal(id: number, updates: Partial<InsertFeaturedDeal>): Promise<FeaturedDeal | undefined>;
  deleteFeaturedDeal(id: number): Promise<void>;

  // Senior Alerts
  getSeniorAlerts(statusFilter?: string): Promise<SeniorAlert[]>;
  createSeniorAlert(alert: InsertSeniorAlert): Promise<SeniorAlert>;
  updateSeniorAlert(id: number, updates: Partial<InsertSeniorAlert>): Promise<SeniorAlert | undefined>;

  // Stripe
  getProduct(productId: string): Promise<any>;
  listProducts(active?: boolean, limit?: number, offset?: number): Promise<any[]>;
  listProductsWithPrices(active?: boolean, limit?: number, offset?: number): Promise<any[]>;
  getPrice(priceId: string): Promise<any>;
  listPrices(active?: boolean, limit?: number, offset?: number): Promise<any[]>;
  getPricesForProduct(productId: string): Promise<any[]>;
  getSubscription(subscriptionId: string): Promise<any>;
  updateUserStripeInfo(userId: string, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<any>;

  // Customer CRM
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomerByVisitor(visitorId: string): Promise<Customer | undefined>;
  updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Transactions
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  getTransactionsByBooking(bookingId: number): Promise<Transaction[]>;

  // Booking Logs
  createBookingLog(log: InsertBookingLog): Promise<BookingLog>;
  getBookingLogs(bookingId: number): Promise<BookingLog[]>;

  // Knowledge Base
  getKnowledgeBaseEntries(category?: string, language?: string): Promise<KnowledgeBaseEntry[]>;
  createKnowledgeBaseEntry(entry: InsertKnowledgeBaseEntry): Promise<KnowledgeBaseEntry>;
  deleteKnowledgeBaseEntry(id: number): Promise<void>;

  // Scanner Bridge
  createScannerSession(session: InsertScannerSession): Promise<ScannerSessionData>;
  getScannerSession(sessionId: string): Promise<ScannerSessionData | undefined>;
  updateScannerSession(sessionId: string, data: any): Promise<ScannerSessionData | undefined>;
  cleanupExpiredScannerSessions(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // --- Auth Delegate ---
  getUser = authStorage.getUser;
  upsertUser = authStorage.upsertUser;

  // --- Flights ---
  async createFlightSearch(search: InsertFlightSearch): Promise<FlightSearch> {
    const [newSearch] = await db.insert(flightSearches).values(search).returning();
    return newSearch;
  }

  async getFlightSearches(): Promise<FlightSearch[]> {
    return await db.select().from(flightSearches).orderBy(desc(flightSearches.lastSearchedAt));
  }

  async getPopularDestinations(): Promise<FlightSearch[]> {
    // Simplified: just return recent searches as "popular" for now
    return await db.select().from(flightSearches).limit(5).orderBy(desc(flightSearches.searchCount));
  }

  // --- Bookings ---
  async createBooking(booking: StorageInsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: number, updates: Partial<StorageInsertBooking>): Promise<Booking | undefined> {
    const [b] = await db.update(bookings).set(updates).where(eq(bookings.id, id)).returning();
    return b;
  }

  async getBookings(userId?: string): Promise<Booking[]> {
    if (userId) {
      return await db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
    }
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingByReference(referenceCode: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.referenceCode, referenceCode));
    return booking;
  }

  async getBookingByReferenceAndEmail(referenceCode: string, email: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(
      and(eq(bookings.referenceCode, referenceCode), eq(bookings.contactEmail, email))
    );
    return booking;
  }

  // --- Settings ---
  async getSiteSettings(): Promise<SiteSetting | undefined> {
    const [settings] = await db.select().from(siteSettings).limit(1);
    return settings;
  }

  async upsertSiteSettings(settings: InsertSiteSetting): Promise<SiteSetting> {
    // Only one settings row allowed, simplified upsert logic
    const existing = await this.getSiteSettings();
    if (existing) {
      const [updated] = await db.update(siteSettings).set({ ...settings, updatedAt: new Date() } as any).where(eq(siteSettings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(siteSettings).values(settings as any).returning();
      return created;
    }
  }

  // --- Blog ---
  async getBlogPosts(language?: string): Promise<BlogPost[]> {
    if (language) {
      return await db.select().from(blogPosts).where(and(eq(blogPosts.isPublished, true), eq(blogPosts.language, language))).orderBy(desc(blogPosts.createdAt));
    }
    return await db.select().from(blogPosts).where(eq(blogPosts.isPublished, true)).orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPost(slug: string, preferredLanguage?: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    if (!post) return undefined;
    if (preferredLanguage && post.language !== preferredLanguage && post.coverImage) {
      const [translated] = await db.select().from(blogPosts).where(
        and(
          eq(blogPosts.coverImage, post.coverImage),
          eq(blogPosts.language, preferredLanguage),
          eq(blogPosts.isPublished, true)
        )
      );
      if (translated) return translated;
    }
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values(post).returning();
    return newPost;
  }

  // --- Profile ---
  async updateUserProfile(userId: string, profile: { firstName?: string; lastName?: string; phone?: string }) {
    const [user] = await db.update(users).set({ ...profile, updatedAt: new Date() } as any).where(eq(users.id, userId)).returning();
    return user;
  }

  // --- Stripe ---
  async getProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  async listProductsWithPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`
        WITH paginated_products AS (
          SELECT id, name, description, metadata, active
          FROM stripe.products
          WHERE active = ${active}
          ORDER BY id
          LIMIT ${limit} OFFSET ${offset}
        )
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM paginated_products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        ORDER BY p.id, pr.unit_amount
      `
    );
    return result.rows;
  }

  async getPrice(priceId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
    );
    return result.rows[0] || null;
  }

  async listPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  async getPricesForProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true`
    );
    return result.rows;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  async updateUserStripeInfo(userId: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }) {
    const [user] = await db.update(users).set(stripeInfo).where(eq(users.id, userId)).returning();
    return user;
  }

  // --- Live Sessions ---
  async createLiveSession(session: InsertLiveSession): Promise<LiveSession> {
    const [s] = await db.insert(liveSessions).values(session).returning();
    return s;
  }

  async getLiveSession(id: number): Promise<LiveSession | undefined> {
    const [s] = await db.select().from(liveSessions).where(eq(liveSessions.id, id));
    return s;
  }

  async getLiveSessionByVisitor(visitorId: string): Promise<LiveSession | undefined> {
    const [s] = await db.select().from(liveSessions).where(
      and(eq(liveSessions.visitorId, visitorId), eq(liveSessions.status, "active"))
    ).limit(1);
    if (s) return s;
    const [r] = await db.select().from(liveSessions).where(
      and(eq(liveSessions.visitorId, visitorId), eq(liveSessions.status, "requested"))
    ).orderBy(desc(liveSessions.createdAt)).limit(1);
    return r;
  }

  async getLiveSessionRequests(): Promise<LiveSession[]> {
    return await db.select().from(liveSessions).where(eq(liveSessions.status, "requested")).orderBy(desc(liveSessions.createdAt));
  }

  async getActiveLiveSessions(): Promise<LiveSession[]> {
    return await db.select().from(liveSessions).where(eq(liveSessions.status, "active")).orderBy(desc(liveSessions.createdAt));
  }

  async updateLiveSessionStatus(id: number, status: string): Promise<LiveSession | undefined> {
    const updates: any = { status };
    if (status === "closed") updates.closedAt = new Date();
    const [s] = await db.update(liveSessions).set(updates).where(eq(liveSessions.id, id)).returning();
    return s;
  }

  async updateLiveSession(id: number, updates: Record<string, any>): Promise<LiveSession | undefined> {
    const [s] = await db.update(liveSessions).set(updates).where(eq(liveSessions.id, id)).returning();
    return s;
  }

  async createLiveSessionBlock(block: InsertLiveSessionBlock): Promise<LiveSessionBlock> {
    const [b] = await db.insert(liveSessionBlocks).values(block).returning();
    return b;
  }

  async updateLiveSessionBlock(id: number, updates: Partial<InsertLiveSessionBlock>): Promise<LiveSessionBlock | undefined> {
    const [b] = await db.update(liveSessionBlocks).set({ ...updates, updatedAt: new Date() } as any).where(eq(liveSessionBlocks.id, id)).returning();
    return b;
  }

  async getLiveSessionBlocks(sessionId: number, sharedOnly?: boolean): Promise<LiveSessionBlock[]> {
    if (sharedOnly) {
      return await db.select().from(liveSessionBlocks).where(
        and(eq(liveSessionBlocks.sessionId, sessionId), eq(liveSessionBlocks.shared, true))
      ).orderBy(liveSessionBlocks.sortOrder);
    }
    return await db.select().from(liveSessionBlocks).where(eq(liveSessionBlocks.sessionId, sessionId)).orderBy(liveSessionBlocks.sortOrder);
  }

  async deleteLiveSessionBlock(id: number): Promise<void> {
    await db.delete(liveSessionBlocks).where(eq(liveSessionBlocks.id, id));
  }

  async createLiveSessionMessage(msg: InsertLiveSessionMessage): Promise<LiveSessionMessage> {
    const [m] = await db.insert(liveSessionMessages).values(msg).returning();
    return m;
  }

  async getLiveSessionMessages(sessionId: number): Promise<LiveSessionMessage[]> {
    return await db.select().from(liveSessionMessages).where(eq(liveSessionMessages.sessionId, sessionId)).orderBy(liveSessionMessages.createdAt);
  }

  // --- Internal Messenger ---
  async createInternalThread(thread: InsertInternalThread): Promise<InternalThread> {
    const [t] = await db.insert(internalThreads).values(thread).returning();
    return t;
  }

  async getInternalThreadsByUser(userId: string): Promise<InternalThread[]> {
    return await db.select().from(internalThreads).where(eq(internalThreads.userId, userId)).orderBy(desc(internalThreads.lastMessageAt));
  }

  async getAllInternalThreads(): Promise<(InternalThread & { userName?: string; userEmail?: string; unreadCount?: number })[]> {
    const result = await db.execute(sql`
      SELECT t.*, u.first_name || ' ' || u.last_name AS user_name, u.email AS user_email,
        (SELECT COUNT(*) FROM internal_messages m WHERE m.thread_id = t.id AND m.read_by_admin = false) AS unread_count
      FROM internal_threads t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.last_message_at DESC
    `);
    return result.rows as any;
  }

  async getInternalThread(id: number): Promise<InternalThread | undefined> {
    const [t] = await db.select().from(internalThreads).where(eq(internalThreads.id, id));
    return t;
  }

  async createInternalMessage(msg: InsertInternalMessage): Promise<InternalMessage> {
    const [m] = await db.insert(internalMessages).values(msg).returning();
    await db.update(internalThreads).set({ lastMessageAt: new Date() }).where(eq(internalThreads.id, msg.threadId));
    return m;
  }

  async getInternalMessages(threadId: number): Promise<InternalMessage[]> {
    return await db.select().from(internalMessages).where(eq(internalMessages.threadId, threadId)).orderBy(internalMessages.createdAt);
  }

  async markMessagesRead(threadId: number, role: "admin" | "user"): Promise<void> {
    if (role === "admin") {
      await db.update(internalMessages).set({ readByAdmin: true }).where(eq(internalMessages.threadId, threadId));
    } else {
      await db.update(internalMessages).set({ readByUser: true }).where(eq(internalMessages.threadId, threadId));
    }
  }

  async getUnreadCountForUser(userId: string): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM internal_messages m
      JOIN internal_threads t ON m.thread_id = t.id
      WHERE t.user_id = ${userId} AND m.read_by_user = false AND m.sender_role = 'admin'
    `);
    return Number(result.rows[0]?.count || 0);
  }

  async getUnreadCountForAdmin(): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM internal_messages
      WHERE read_by_admin = false AND sender_role = 'user'
    `);
    return Number(result.rows[0]?.count || 0);
  }

  // --- Voice Escalations ---
  async createVoiceEscalation(escalation: InsertVoiceEscalation): Promise<VoiceEscalation> {
    const [newEscalation] = await db.insert(voiceEscalations).values(escalation).returning();
    return newEscalation;
  }

  async getAllVoiceEscalations(): Promise<VoiceEscalation[]> {
    return await db.select().from(voiceEscalations).orderBy(desc(voiceEscalations.createdAt));
  }

  async updateVoiceEscalation(id: number, updates: Partial<InsertVoiceEscalation>): Promise<VoiceEscalation | undefined> {
    const [updated] = await db.update(voiceEscalations).set(updates).where(eq(voiceEscalations.id, id)).returning();
    return updated;
  }

  // --- Featured Deals (Zapier) ---
  async getFeaturedDeals(activeOnly = false): Promise<FeaturedDeal[]> {
    try {
      if (activeOnly) {
        return await db.select().from(featuredDeals).where(eq(featuredDeals.isActive, true)).orderBy(desc(featuredDeals.createdAt));
      }
      return await db.select().from(featuredDeals).orderBy(desc(featuredDeals.createdAt));
    } catch (error) {
      console.error("Failed to fetch featured deals with full schema, falling back to basic selection:", error);
      // Fallback to basic columns that are guaranteed to exist to prevent dashboard crash
      const result = await db.execute(sql`
        SELECT id, origin, origin_city, destination, destination_city, price, currency, 
               airline, cabin_class, headline, description, is_active, created_at 
        FROM featured_deals 
        ${activeOnly ? sql`WHERE is_active = true` : sql``}
        ORDER BY created_at DESC
      `);
      return result.rows as any;
    }
  }

  async getFeaturedDeal(id: number): Promise<FeaturedDeal | undefined> {
    const [deal] = await db.select().from(featuredDeals).where(eq(featuredDeals.id, id));
    return deal;
  }

  async createFeaturedDeal(deal: InsertFeaturedDeal): Promise<FeaturedDeal> {
    try {
      const [newDeal] = await db.insert(featuredDeals).values(deal).returning();
      return newDeal;
    } catch (error: any) {
      console.error("Failed to create deal with full schema:", error.message);
      
      try {
        // Stage 2: Using Raw SQL to bypass Drizzle schema-auto-inclusion
        const { stops, duration, departureDate, returnDate, originCity, destinationCity, cabinClass, ...data } = deal as any;
        const result = await db.execute(sql`
          INSERT INTO featured_deals (
            origin, destination, origin_city, destination_city, 
            price, currency, airline, cabin_class, 
            headline, description, is_active
          ) VALUES (
            ${deal.origin}, ${deal.destination}, ${deal.originCity || null}, ${deal.destinationCity || null},
            ${deal.price}, ${deal.currency || 'USD'}, ${deal.airline || null}, ${deal.cabinClass || 'economy'},
            ${deal.headline}, ${deal.description}, true
          ) RETURNING id
        `);
        const insertedId = (result.rows[0] as any).id;
        return { ...deal, id: insertedId } as any;
      } catch (err2: any) {
        console.error("Stage 2 (Raw SQL) failed:", err2.message);
        
        try {
          // Final attempt with absolute minimums using Raw SQL
          const result = await db.execute(sql`
            INSERT INTO featured_deals (
              origin, destination, price, currency, airline, headline, description, is_active
            ) VALUES (
              ${deal.origin}, ${deal.destination}, ${deal.price}, ${deal.currency || 'USD'}, 
              ${deal.airline || null}, ${deal.headline}, ${deal.description}, true
            ) RETURNING id
          `);
          const insertedId = (result.rows[0] as any).id;
          return { ...deal, id: insertedId, origin: deal.origin, destination: deal.destination } as any;
        } catch (err3: any) {
          console.error("Stage 3 (Final Raw SQL) failed:", err3.message);
          throw new Error(`Critical persistence failure: ${err3.message}`);
        }
      }
    }
  }

  async updateFeaturedDeal(id: number, updates: Partial<InsertFeaturedDeal>): Promise<FeaturedDeal | undefined> {
    try {
      const [updated] = await db.update(featuredDeals).set(updates).where(eq(featuredDeals.id, id)).returning();
      return updated;
    } catch (error: any) {
      console.error("Failed to update featured deal with full schema, retrying with basic columns:", error.message);
      // Remove potentially missing columns and retry
      const { stops, duration, departureDate, returnDate, ...basicUpdates } = updates as any;
      const [updated] = await db.update(featuredDeals).set(basicUpdates).where(eq(featuredDeals.id, id)).returning({ id: featuredDeals.id });
      if (!updated) return undefined;
      return { ...basicUpdates, id: updated.id } as any;
    }
  }

  async deleteFeaturedDeal(id: number): Promise<void> {
    await db.delete(featuredDeals).where(eq(featuredDeals.id, id));
  }

  // --- Senior Alerts ---
  async getSeniorAlerts(statusFilter?: string): Promise<SeniorAlert[]> {
    if (statusFilter) {
      return await db.select().from(seniorAlerts).where(eq(seniorAlerts.status, statusFilter)).orderBy(desc(seniorAlerts.createdAt));
    }
    return await db.select().from(seniorAlerts).orderBy(desc(seniorAlerts.createdAt));
  }

  async createSeniorAlert(alert: InsertSeniorAlert): Promise<SeniorAlert> {
    const [newAlert] = await db.insert(seniorAlerts).values(alert).returning();
    return newAlert;
  }

  async updateSeniorAlert(id: number, updates: Partial<InsertSeniorAlert>): Promise<SeniorAlert | undefined> {
    const payload: any = { ...updates };
    if (updates.status === 'resolved') payload.resolvedAt = new Date();
    const [updated] = await db.update(seniorAlerts).set(payload).where(eq(seniorAlerts.id, id)).returning();
    return updated;
  }

  // --- Customer CRM ---
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [c] = await db.insert(customers).values(customer).returning();
    return c;
  }

  async getCustomerByVisitor(visitorId: string): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.visitorId, visitorId));
    return c;
  }

  async updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [c] = await db.update(customers).set({ ...updates, updatedAt: new Date() } as any).where(eq(customers.id, id)).returning();
    return c;
  }

  // --- Transactions ---
  async createTransaction(tx: InsertTransaction): Promise<Transaction> {
    const [t] = await db.insert(transactions).values(tx).returning();
    return t;
  }

  async getTransactionsByBooking(bookingId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.bookingId, bookingId)).orderBy(desc(transactions.createdAt));
  }

  // --- Booking Logs ---
  async createBookingLog(log: InsertBookingLog): Promise<BookingLog> {
    const [l] = await db.insert(bookingLogs).values(log).returning();
    return l;
  }

  async getBookingLogs(bookingId: number): Promise<BookingLog[]> {
    return await db.select().from(bookingLogs).where(eq(bookingLogs.bookingId, bookingId)).orderBy(desc(bookingLogs.createdAt));
  }

  // --- Knowledge Base ---
  async createKnowledgeBaseEntry(entry: InsertKnowledgeBaseEntry): Promise<KnowledgeBaseEntry> {
    const [e] = await db.insert(knowledgeBase).values(entry).returning();
    return e;
  }

  async getKnowledgeBaseEntries(category?: string): Promise<KnowledgeBaseEntry[]> {
    if (category) {
      return await db.select().from(knowledgeBase).where(and(eq(knowledgeBase.category, category), eq(knowledgeBase.isActive, true))).orderBy(desc(knowledgeBase.updatedAt));
    }
    return await db.select().from(knowledgeBase).where(eq(knowledgeBase.isActive, true)).orderBy(desc(knowledgeBase.updatedAt));
  }

  async searchKnowledgeBase(query: string, category?: string): Promise<KnowledgeBaseEntry[]> {
    let baseQuery = db.select().from(knowledgeBase).where(
      and(
        sql`${knowledgeBase.question} ILIKE ${'%' + query + '%'} OR ${knowledgeBase.answer} ILIKE ${'%' + query + '%'}`,
        eq(knowledgeBase.isActive, true)
      )
    );

    if (category) {
      // Drizzle handles adding where constraints sequentially if you structure it right, or just one big where.
      baseQuery = db.select().from(knowledgeBase).where(
        and(
          sql`${knowledgeBase.question} ILIKE ${'%' + query + '%'} OR ${knowledgeBase.answer} ILIKE ${'%' + query + '%'}`,
          eq(knowledgeBase.isActive, true),
          eq(knowledgeBase.category, category)
        )
      );
    }

    return await baseQuery.orderBy(desc(knowledgeBase.updatedAt));
  }

  async deleteKnowledgeBaseEntry(id: number): Promise<void> {
    await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id));
  }

  async getCustomers(limit = 100): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt)).limit(limit);
  }

  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  // --- Scanner Bridge ---
  async createScannerSession(session: InsertScannerSession): Promise<ScannerSessionData> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 min expiry
    const [s] = await db.insert(scannerSessions).values({
      ...session,
      expiresAt,
    }).returning();
    return s;
  }

  async getScannerSession(sessionId: string): Promise<ScannerSessionData | undefined> {
    const [s] = await db.select().from(scannerSessions).where(eq(scannerSessions.sessionId, sessionId));
    if (!s) return undefined;
    
    // Check expiry
    if (s.expiresAt && s.expiresAt < new Date()) {
      await db.delete(scannerSessions).where(eq(scannerSessions.sessionId, sessionId));
      return undefined;
    }
    
    return s;
  }

  async updateScannerSession(sessionId: string, data: any): Promise<ScannerSessionData | undefined> {
    const [s] = await db.update(scannerSessions)
      .set({ data })
      .where(eq(scannerSessions.sessionId, sessionId))
      .returning();
    return s;
  }

  async cleanupExpiredScannerSessions(): Promise<void> {
    await db.delete(scannerSessions).where(sql`${scannerSessions.expiresAt} < NOW()`);
  }
}

export const storage = new DatabaseStorage();
