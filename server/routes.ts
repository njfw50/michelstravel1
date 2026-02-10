
import express, { type Express } from 'express';
import { storage } from './storage';
import { stripeService } from './stripeService';
import { getUncachableStripeClient } from './stripeClient';
import { db } from "./db";
import { flightSearches, bookings, type FlightSearchParams } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { searchFlights, getFlight, searchPlaces } from "./services/duffel";

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

  // Get Flight Details
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

  // Popular Flights
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

  // === BOOKING ROUTES ===

  // Create Booking & Checkout Session
  app.post('/api/bookings', async (req, res) => {
    try {
        const bookingData = req.body;
        
        // Calculate commission (e.g. 5%)
        const commissionRate = 0.05;
        const price = parseFloat(bookingData.totalPrice);
        const commissionAmount = (price * commissionRate).toFixed(2);

        // 1. Create booking in DB (pending)
        const [booking] = await db.insert(bookings).values({
            ...bookingData,
            commissionRate: commissionRate.toString(),
            commissionAmount: commissionAmount,
            status: 'pending',
            stripePaymentStatus: 'pending',
            userId: (req as any).user?.id ? String((req as any).user.id) : null // Ensure string or null
        }).returning();

        // 2. Create Stripe Checkout Session
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

        // 3. Update booking with session ID
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
}
