import type { Express } from "express";
import type { Server } from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { searchFlights } from "./services/duffel";

// Seed Function
async function seedDatabase() {
  const settings = await storage.getSiteSettings();
  if (!settings) {
    await storage.upsertSiteSettings({
      siteName: "Michels Travel",
      commissionPercentage: "5.00",
      heroTitle: "Opção Eficiente Para Viajar",
      heroSubtitle: "Descubra os melhores destinos com a Michels Travel.",
    });
  }

  const posts = await storage.getBlogPosts();
  if (posts.length === 0) {
    await storage.createBlogPost({
      title: "Top 10 Summer Destinations 2024",
      slug: "top-10-summer-destinations-2024",
      content: "Discover the best places to visit this summer...",
      excerpt: "Summer is coming! Here are the best spots.",
      isPublished: true,
      coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80",
    });
    await storage.createBlogPost({
      title: "How to Find Cheap Flights",
      slug: "how-to-find-cheap-flights",
      content: "Tips and tricks for booking affordable travel...",
      excerpt: "Save money on your next trip with these tips.",
      isPublished: true,
      coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80",
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Security Middleware
  app.use(helmet());
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
  });
  app.use("/api/", limiter);

  // 1. Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Flight Routes
  app.get(api.flights.search.path, async (req, res) => {
    try {
      const input = api.flights.search.input.parse(req.query);

      // Use Real Duffel API
      const flights = await searchFlights({
        origin: input.origin,
        destination: input.destination,
        departureDate: input.date,
        returnDate: input.returnDate,
        passengers: input.passengers ? parseInt(input.passengers) : 1,
        adults: input.adults ? parseInt(input.adults) : undefined,
        children: input.children ? parseInt(input.children) : undefined,
        infants: input.infants ? parseInt(input.infants) : undefined,
        cabinClass: input.cabinClass,
      });

      // Cache the search for SEO/Popularity
      await storage.createFlightSearch({
        origin: input.origin,
        destination: input.destination,
        departureDate: input.date,
        returnDate: input.returnDate,
        passengers: input.passengers ? parseInt(input.passengers) : 1,
        adults: input.adults ? parseInt(input.adults) : 1,
        children: input.children ? parseInt(input.children) : 0,
        infants: input.infants ? parseInt(input.infants) : 0,
        cabinClass: input.cabinClass || "economy",
      });

      res.json(flights);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid search parameters" });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.flights.popular.path, async (req, res) => {
    const popular = await storage.getPopularDestinations();
    res.json(popular);
  });

  // 3. Booking Routes
  app.post(api.bookings.create.path, async (req, res) => {
    try {
      const input = api.bookings.create.input.parse(req.body);
      const booking = await storage.createBooking(input);
      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid booking data" });
      } else {
        res.status(500).json({ message: "Booking failed" });
      }
    }
  });

  app.get(api.bookings.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const bookings = await storage.getBookings(userId);
    res.json(bookings);
  });

  app.get(api.bookings.get.path, async (req, res) => {
    const booking = await storage.getBooking(Number(req.params.id));
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  });

  // 4. Admin Routes (Protected)
  app.get(api.admin.dashboard_stats.path, isAuthenticated, async (req, res) => {
    // In a real app, verify admin role here. For MVP, any logged-in user can access admin dashboard (as per typical single-user request)
    const allBookings = await storage.getBookings();
    const settings = await storage.getSiteSettings();
    const commissionRate = settings?.commissionPercentage ? parseFloat(settings.commissionPercentage as string) / 100 : 0.05;

    const totalRevenue = allBookings.reduce((sum, b) => sum + parseFloat(b.totalPrice as string), 0);
    const totalCommission = totalRevenue * commissionRate;

    res.json({
      totalBookings: allBookings.length,
      totalRevenue,
      totalCommission,
      recentSearches: (await storage.getFlightSearches()).length,
    });
  });

  app.get(api.admin.bookings_all.path, isAuthenticated, async (req, res) => {
    const bookings = await storage.getBookings(); // Get all
    res.json(bookings);
  });

  app.get(api.admin.settings_get.path, isAuthenticated, async (req, res) => {
    const settings = await storage.getSiteSettings();
    res.json(settings);
  });

  app.post(api.admin.settings_update.path, isAuthenticated, async (req, res) => {
    const input = api.admin.settings_update.input.parse(req.body);
    const settings = await storage.upsertSiteSettings(input);
    res.json(settings);
  });

  // 5. Blog Routes
  app.get(api.blog.list.path, async (req, res) => {
    const posts = await storage.getBlogPosts();
    res.json(posts);
  });

  app.get(api.blog.get.path, async (req, res) => {
    const post = await storage.getBlogPost(req.params.slug);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  // Seed Data
  seedDatabase().catch(console.error);

  return httpServer;
}
