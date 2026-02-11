
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  flightSearches, bookings, siteSettings, blogPosts, users,
  type FlightSearch, type InsertFlightSearch,
  type Booking, type InsertBooking,
  type SiteSetting, type InsertSiteSetting,
  type BlogPost, type InsertBlogPost
} from "@shared/schema";

// Import Auth Storage
import { authStorage, type IAuthStorage } from "./replit_integrations/auth";

export interface IStorage extends IAuthStorage {
  // Flights
  createFlightSearch(search: InsertFlightSearch): Promise<FlightSearch>;
  getFlightSearches(): Promise<FlightSearch[]>;
  getPopularDestinations(): Promise<FlightSearch[]>;

  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookings(userId?: string): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;

  // Settings
  getSiteSettings(): Promise<SiteSetting | undefined>;
  upsertSiteSettings(settings: InsertSiteSetting): Promise<SiteSetting>;

  // Blog
  getBlogPosts(language?: string): Promise<BlogPost[]>;
  getBlogPost(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;

  // Stripe
  getProduct(productId: string): Promise<any>;
  listProducts(active?: boolean, limit?: number, offset?: number): Promise<any[]>;
  listProductsWithPrices(active?: boolean, limit?: number, offset?: number): Promise<any[]>;
  getPrice(priceId: string): Promise<any>;
  listPrices(active?: boolean, limit?: number, offset?: number): Promise<any[]>;
  getPricesForProduct(productId: string): Promise<any[]>;
  getSubscription(subscriptionId: string): Promise<any>;
  updateUserStripeInfo(userId: string, stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<any>;
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
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
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

  // --- Settings ---
  async getSiteSettings(): Promise<SiteSetting | undefined> {
    const [settings] = await db.select().from(siteSettings).limit(1);
    return settings;
  }

  async upsertSiteSettings(settings: InsertSiteSetting): Promise<SiteSetting> {
    // Only one settings row allowed, simplified upsert logic
    const existing = await this.getSiteSettings();
    if (existing) {
      const [updated] = await db.update(siteSettings).set({ ...settings, updatedAt: new Date() }).where(eq(siteSettings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(siteSettings).values(settings).returning();
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

  async getBlogPost(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values(post).returning();
    return newPost;
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
}

export const storage = new DatabaseStorage();
