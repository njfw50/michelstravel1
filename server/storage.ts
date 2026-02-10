import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  flightSearches, bookings, siteSettings, blogPosts,
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
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
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
  async getBlogPosts(): Promise<BlogPost[]> {
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
}

export const storage = new DatabaseStorage();
