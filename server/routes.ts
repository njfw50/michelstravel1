
import express, { type Express } from 'express';
import { storage } from './storage';
import { stripeService } from './stripeService';
import { getUncachableStripeClient } from './stripeClient';
import { db } from "./db";
import { flightSearches } from "@shared/schema";
import { desc } from "drizzle-orm";

/**
 * Register all application routes
 *
 * NOTE: The webhook route should be registered in index.ts BEFORE express.json()
 * This function registers the other Stripe routes and API routes that need parsed JSON
 */
export function registerRoutes(app: Express) {
  
  // === FLIGHT ROUTES ===

  // Search Flights
  app.get('/api/flights/search', async (req, res) => {
    try {
      const { origin, destination, date, passengers, cabinClass } = req.query;

      // Mock flight data for now (since we don't have real Duffel integration in this step yet)
      // In a real implementation, this would call Duffel API
      const mockFlights = [
        {
          id: 'flight_1',
          airline: 'United Airlines',
          flightNumber: 'UA123',
          departureTime: `${date}T08:00:00`,
          arrivalTime: `${date}T11:00:00`,
          duration: '3h 00m',
          origin: origin as string,
          destination: destination as string,
          price: 350,
          currency: 'USD',
          stops: 0,
          logoUrl: 'https://logos.skyscnr.com/images/airlines/favicon/UA.png'
        },
        {
          id: 'flight_2',
          airline: 'Delta Airlines',
          flightNumber: 'DL456',
          departureTime: `${date}T09:30:00`,
          arrivalTime: `${date}T13:45:00`,
          duration: '4h 15m',
          origin: origin as string,
          destination: destination as string,
          price: 320,
          currency: 'USD',
          stops: 1,
          logoUrl: 'https://logos.skyscnr.com/images/airlines/favicon/DL.png'
        },
        {
          id: 'flight_3',
          airline: 'American Airlines',
          flightNumber: 'AA789',
          departureTime: `${date}T14:00:00`,
          arrivalTime: `${date}T17:30:00`,
          duration: '3h 30m',
          origin: origin as string,
          destination: destination as string,
          price: 380,
          currency: 'USD',
          stops: 0,
          logoUrl: 'https://logos.skyscnr.com/images/airlines/favicon/AA.png'
        }
      ];

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

      res.json(mockFlights);
    } catch (error) {
      console.error('Flight search error:', error);
      res.status(500).json({ error: 'Failed to search flights' });
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

  // === STRIPE ROUTES ===

  // Get user subscription
  app.get('/api/subscription', async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await storage.getUser(req.user.id);
    if (!user?.stripeSubscriptionId) {
      return res.json({ subscription: null });
    }

    const subscription = await storage.getSubscription(user.stripeSubscriptionId);
    res.json({ subscription });
  });

  // Create checkout session
  app.post('/api/checkout', async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await storage.getUser(req.user.id);
    const { priceId } = req.body;

    // Create or get customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(user.email, user.id);
      await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
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
