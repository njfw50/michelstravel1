
import express, { type Express } from 'express';
import { storage } from './storage';
import { stripeService } from './stripeService';
import { getUncachableStripeClient } from './stripeClient';
import { db } from "./db";
import { flightSearches, bookings, siteSettings, type FlightSearchParams } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { searchFlights, getFlight, searchPlaces, getAirlines, getAirports, getAircraft, initializeReferenceData, isTestMode as getDuffelTestMode } from "./services/duffel";

/**
 * Register all application routes
 *
 * NOTE: The webhook route should be registered in index.ts BEFORE express.json()
 * This function registers the other Stripe routes and API routes that need parsed JSON
 */
export function registerRoutes(app: Express) {
  
  // === FLIGHT ROUTES ===

  // Search Places (Autocomplete)
  app.get('/api/places/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string') {
            return res.json([]);
        }
        const places = await searchPlaces(query);
        res.json(places);
    } catch (error) {
        console.error('Places search error:', error);
        res.status(500).json({ error: 'Failed to search places' });
    }
  });

  // Search Flights
  app.get('/api/flights/search', async (req, res) => {
    try {
      const { origin, destination, date, passengers, cabinClass, returnDate, adults, children, infants } = req.query;

      const searchParams: FlightSearchParams = {
        origin: origin as string,
        destination: destination as string,
        date: date as string,
        returnDate: returnDate as string | undefined,
        passengers: passengers as string,
        adults: adults as string,
        children: children as string,
        infants: infants as string,
        cabinClass: cabinClass as string,
      };

      // Call Duffel Service
      const flights = await searchFlights(searchParams);

      // Log search for SEO/Analytics
      if (origin && destination && date) {
        await storage.createFlightSearch({
          origin: origin as string,
          destination: destination as string,
          departureDate: date as string,
          passengers: passengers ? parseInt(passengers as string) : 1,
          cabinClass: (cabinClass as string) || 'economy'
        });
      }

      res.json(flights);
    } catch (error) {
      console.error('Flight search error:', error);
      res.status(500).json({ error: 'Failed to search flights' });
    }
  });

  // Popular Flights (MUST be before :id route)
  app.get('/api/flights/popular', async (req, res) => {
    try {
      const popular = await storage.getPopularDestinations();
      // If no history, return some defaults
      if (popular.length === 0) {
        return res.json([
          { origin: 'EWR', destination: 'LHR', searchCount: 120 },
          { origin: 'JFK', destination: 'CDG', searchCount: 95 },
          { origin: 'EWR', destination: 'MCO', searchCount: 80 },
          { origin: 'PHL', destination: 'MIA', searchCount: 65 }
        ]);
      }
      res.json(popular);
    } catch (error) {
      console.error('Popular flights error:', error);
      res.status(500).json({ error: 'Failed to fetch popular flights' });
    }
  });

  // Get Flight Details (MUST be after /popular to avoid matching "popular" as :id)
  app.get('/api/flights/:id', async (req, res) => {
    try {
        const flight = await getFlight(req.params.id);
        if (!flight) {
            return res.status(404).json({ error: "Flight not found" });
        }
        res.json(flight);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch flight details" });
    }
  });

  // === REFERENCE DATA ROUTES ===

  app.get('/api/airlines', async (req, res) => {
    try {
      const airlines = await getAirlines();
      const { search, limit } = req.query;
      let filtered = airlines;
      
      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        filtered = airlines.filter(a => 
          a.name.toLowerCase().includes(q) || 
          (a.iataCode && a.iataCode.toLowerCase().includes(q))
        );
      }
      
      const maxResults = limit ? parseInt(limit as string) : 100;
      res.json(filtered.slice(0, maxResults));
    } catch (error) {
      console.error('Airlines fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch airlines' });
    }
  });

  app.get('/api/airports', async (req, res) => {
    try {
      const airports = await getAirports();
      const { search, limit, featured } = req.query;
      let filtered = airports;
      
      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        filtered = airports.filter(a => 
          a.name.toLowerCase().includes(q) || 
          (a.iataCode && a.iataCode.toLowerCase().includes(q)) ||
          (a.cityName && a.cityName.toLowerCase().includes(q))
        );
      }
      
      if (featured === 'true') {
        const featuredCodes = ['JFK', 'LAX', 'LHR', 'CDG', 'GRU', 'MIA', 'MCO', 'EWR', 'ORD', 'SFO', 'NRT', 'DXB', 'FCO', 'BCN', 'LIS', 'CUN'];
        filtered = airports.filter(a => a.iataCode && featuredCodes.includes(a.iataCode));
      }
      
      const maxResults = limit ? parseInt(limit as string) : 100;
      res.json(filtered.slice(0, maxResults));
    } catch (error) {
      console.error('Airports fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch airports' });
    }
  });

  app.get('/api/aircraft', async (req, res) => {
    try {
      const aircraft = await getAircraft();
      const { search, limit } = req.query;
      let filtered = aircraft;
      
      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        filtered = aircraft.filter(a => 
          a.name.toLowerCase().includes(q) || 
          (a.iataCode && a.iataCode.toLowerCase().includes(q))
        );
      }
      
      const maxResults = limit ? parseInt(limit as string) : 100;
      res.json(filtered.slice(0, maxResults));
    } catch (error) {
      console.error('Aircraft fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch aircraft' });
    }
  });

  // Initialize reference data cache on startup (non-blocking)
  initializeReferenceData().catch(err => console.error("Reference data init failed:", err));

  // === BOOKING ROUTES ===

  // Create Booking & Checkout Session
  app.post('/api/bookings', async (req, res) => {
    try {
        const settings = await storage.getSiteSettings();
        const isTestModeActive = settings?.testMode ?? true;
        const tokenIsTest = getDuffelTestMode();

        if (isTestModeActive) {
          console.log("[TEST MODE] Booking created in test mode - no real charges");
        }

        if (!isTestModeActive && tokenIsTest) {
          return res.status(400).json({ 
            error: "Configuration error: Production mode is enabled but Duffel token is a test token. Please contact the administrator." 
          });
        }

        const bookingData = req.body;
        
        const commissionRate = 0.05;
        const price = parseFloat(bookingData.totalPrice);
        const commissionAmount = (price * commissionRate).toFixed(2);

        const flightDataWithMode = {
            ...bookingData.flightData,
            _testMode: isTestModeActive,
        };

        const [booking] = await db.insert(bookings).values({
            flightData: flightDataWithMode,
            passengerDetails: bookingData.passengerDetails || bookingData.passengers,
            totalPrice: bookingData.totalPrice,
            currency: bookingData.currency || 'USD',
            contactEmail: bookingData.contactEmail,
            commissionRate: commissionRate.toString(),
            commissionAmount: commissionAmount,
            status: isTestModeActive ? 'test' : 'pending',
            stripePaymentStatus: 'pending',
            userId: (req as any).user?.id ? String((req as any).user.id) : null
        }).returning();

        if (isTestModeActive) {
          await db.update(bookings)
              .set({ stripePaymentIntentId: 'test_session_' + booking.id, stripePaymentStatus: 'test' })
              .where(eq(bookings.id, booking.id));

          const testSuccessUrl = `${req.protocol}://${req.get('host')}/checkout/success?bookingId=${booking.id}&test=true`;
          return res.status(201).json({ 
            booking: { ...booking, status: 'test' }, 
            checkoutUrl: testSuccessUrl,
            testMode: true,
            message: "Test mode: no real payment processed" 
          });
        }

        // Production: Create real Stripe Checkout Session
        const session = await stripeService.createFlightCheckoutSession(
            (req as any).user?.stripeCustomerId,
            price,
            bookingData.currency,
            `${req.protocol}://${req.get('host')}/checkout/success?bookingId=${booking.id}`,
            `${req.protocol}://${req.get('host')}/checkout/cancel?bookingId=${booking.id}`,
            {
                bookingId: booking.id,
                origin: bookingData.flightData.origin || 'Flight',
                destination: bookingData.flightData.destination || 'Destination',
                contactEmail: bookingData.contactEmail
            }
        );

        await db.update(bookings)
            .set({ stripePaymentIntentId: session.id })
            .where(eq(bookings.id, booking.id));

        res.status(201).json({ booking, checkoutUrl: session.url });

    } catch (error) {
        console.error("Booking creation error:", error);
        res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // === STRIPE ROUTES ===

  // Get user subscription
  app.get('/api/subscription', async (req, res) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const dbUser = await storage.getUser(user.id);
    if (!dbUser?.stripeSubscriptionId) {
      return res.json({ subscription: null });
    }

    const subscription = await storage.getSubscription(dbUser.stripeSubscriptionId);
    res.json({ subscription });
  });

  // Create checkout session
  app.post('/api/checkout', async (req, res) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const dbUser = await storage.getUser(user.id);
    if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
    }
    const { priceId } = req.body;

    // Create or get customer
    let customerId = dbUser.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(dbUser.email || "", dbUser.id);
      await storage.updateUserStripeInfo(dbUser.id, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession(
      customerId,
      priceId,
      `${req.protocol}://${req.get('host')}/checkout/success`,
      `${req.protocol}://${req.get('host')}/checkout/cancel`
    );

    res.json({ url: session.url });
  });

  // List products
  app.get('/api/products', async (req, res) => {
    const products = await storage.listProducts();
    res.json({ data: products });
  });

  // List products with prices (joined)
  app.get('/api/products-with-prices', async (req, res) => {
    const rows = await storage.listProductsWithPrices();

    // Group prices by product
    const productsMap = new Map();
    for (const row of rows) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          active: row.product_active,
          prices: []
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          active: row.price_active,
        });
      }
    }

    res.json({ data: Array.from(productsMap.values()) });
  });

  // List prices
  app.get('/api/prices', async (req, res) => {
    const prices = await storage.listPrices();
    res.json({ data: prices });
  });

  // Get prices for a specific product
  app.get('/api/products/:productId/prices', async (req, res) => {
    const { productId } = req.params;

    // Validate product exists (productId should be the id from stripe.products)
    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const prices = await storage.getPricesForProduct(productId);
    res.json({ data: prices });
  });

  // === ADMIN ROUTES ===
  
  // Admin Stats
  app.get('/api/admin/stats', async (req, res) => {
    if (!req.isAuthenticated() || !(req.user as any).isAdmin) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Calculate stats
    const allBookings = await db.select().from(bookings);
    const totalBookings = allBookings.length;
    const totalRevenue = allBookings.reduce((acc, b) => acc + Number(b.totalPrice), 0);
    const totalCommission = allBookings.reduce((acc, b) => acc + (Number(b.commissionAmount) || 0), 0);
    
    // Mock recent searches count (or count from DB if we want accurate)
    const recentSearches = await db.select().from(flightSearches).limit(100);
    
    res.json({
        totalBookings,
        totalRevenue,
        totalCommission,
        recentSearches: recentSearches.length
    });
  });

  // Get Admin Settings
  app.get('/api/admin/settings', async (req, res) => {
    if (!req.isAuthenticated() || !(req.user as any).isAdmin) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const settings = await storage.getSiteSettings();
    if (!settings) {
      return res.json({
        id: 0,
        siteName: "Michels Travel",
        commissionPercentage: "5.00",
        heroTitle: "Find Your Next Adventure",
        heroSubtitle: "Best prices on flights worldwide.",
        testMode: true,
        updatedAt: new Date(),
      });
    }
    res.json(settings);
  });

  // Update Admin Settings
  app.post('/api/admin/settings', async (req, res) => {
    if (!req.isAuthenticated() || !(req.user as any).isAdmin) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const updated = await storage.upsertSiteSettings(req.body);
    res.json(updated);
  });

  // Toggle Test Mode
  app.post('/api/admin/test-mode', async (req, res) => {
    if (!req.isAuthenticated() || !(req.user as any).isAdmin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { testMode } = req.body;
    if (typeof testMode !== 'boolean') {
      return res.status(400).json({ error: "testMode must be a boolean" });
    }

    if (!testMode) {
      const token = process.env.DUFFEL_API_TOKEN || '';
      if (token.startsWith('duffel_test_')) {
        return res.status(400).json({ 
          error: "Cannot disable test mode: your Duffel API token is a test token (duffel_test_*). To go live, configure a production token (duffel_live_*) in your environment variables." 
        });
      }
    }

    const settings = await storage.getSiteSettings();
    const updated = await storage.upsertSiteSettings({
      ...(settings ? {
        siteName: settings.siteName || undefined,
        commissionPercentage: settings.commissionPercentage || undefined,
        heroTitle: settings.heroTitle || undefined,
        heroSubtitle: settings.heroSubtitle || undefined,
      } : {}),
      testMode,
    });

    res.json({ testMode: updated.testMode, message: testMode ? "Test mode enabled" : "Production mode enabled" });
  });

  // Public: check if test mode is active (for banner display)
  app.get('/api/test-mode', async (_req, res) => {
    const settings = await storage.getSiteSettings();
    const isTest = settings?.testMode ?? true;
    const token = process.env.DUFFEL_API_TOKEN || '';
    const tokenIsTest = token.startsWith('duffel_test_') || !token;
    res.json({ testMode: isTest, tokenIsTest });
  });

  // All Bookings
  app.get('/api/admin/bookings', async (req, res) => {
    if (!req.isAuthenticated() || !(req.user as any).isAdmin) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const allBookings = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    res.json(allBookings);
  });
}
