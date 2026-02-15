
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import { storage } from './storage';
import { stripeService } from './stripeService';
import { getUncachableStripeClient } from './stripeClient';
import { db } from "./db";
import { flightSearches, bookings, siteSettings, conversations, messages, type FlightSearchParams } from "@shared/schema";
import { users } from "@shared/models/auth";
import { desc, eq, and, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import OpenAI from "openai";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET!;
const JWT_EXPIRY = "12h";

function generateReferenceCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MT-${code}`;
}
import { searchFlights, getFlight, searchPlaces, getAirlines, getAirports, getAircraft, initializeReferenceData, isTestMode, activeTokenIsTest, hasLiveToken, hasTestToken, setTestModeCache, clearReferenceDataCache, loadTestModeSetting, ensureTestModeLoaded, refreshOffer } from "./services/duffel";
import { sendBookingConfirmationEmail, sendChatEscalationEmail } from "./services/emailService";

async function getCommissionRate(): Promise<number> {
  const settings = await storage.getSiteSettings();
  return settings?.commissionPercentage ? parseFloat(settings.commissionPercentage) / 100 : 0.085;
}

function applyMarkupToFlight(flight: any, rate: number): any {
  const markedUpPrice = parseFloat((flight.price * (1 + rate)).toFixed(2));
  const { baseAmount, taxAmount, ...rest } = flight;
  return { ...rest, price: markedUpPrice };
}

function applyMarkupToFlights(flights: any[], rate: number): any[] {
  return flights.map(f => applyMarkupToFlight(f, rate));
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.isAdmin) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
      if (decoded.role === "admin") {
        return next();
      }
    } catch {}
  }

  return res.status(401).json({ error: "Admin authentication required" });
}

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
        await ensureTestModeLoaded();
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
      await ensureTestModeLoaded();
      const { origin, destination, date, passengers, cabinClass, returnDate, adults, children, infants, tripType, legs } = req.query;

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
        tripType: tripType as string | undefined,
      };

      if (tripType === 'multi-city' && legs) {
        try {
          searchParams.legs = JSON.parse(legs as string);
        } catch (e) {
          console.error('Failed to parse multi-city legs:', e);
        }
      }

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

      const rate = await getCommissionRate();
      res.json(applyMarkupToFlights(flights, rate));
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
        await ensureTestModeLoaded();
        const flight = await getFlight(req.params.id);
        if (!flight) {
            return res.status(404).json({ error: "Flight not found" });
        }
        const rate = await getCommissionRate();
        res.json(applyMarkupToFlight(flight, rate));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch flight details" });
    }
  });

  app.get('/api/flights/:id/refresh', async (req, res) => {
    try {
      await ensureTestModeLoaded();
      const result = await refreshOffer(req.params.id);
      if (result.valid && result.price) {
        const rate = await getCommissionRate();
        result.price = parseFloat((result.price * (1 + rate)).toFixed(2));
      }
      res.json(result);
    } catch (error) {
      console.error("Offer refresh error:", error);
      res.json({ valid: false });
    }
  });

  // === REFERENCE DATA ROUTES ===

  app.get('/api/airlines', async (req, res) => {
    try {
      await ensureTestModeLoaded();
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
      await ensureTestModeLoaded();
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

  let flightBoardCache: { data: any[]; timestamp: number; date: string } = { data: [], timestamp: 0, date: "" };
  const FLIGHT_BOARD_CACHE_TTL = 15 * 60 * 1000;
  let flightBoardFetching = false;

  app.get('/api/flight-board', async (req, res) => {
    try {
      await ensureTestModeLoaded();
      const date = (req.query.date as string) || (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split("T")[0];
      })();

      if (flightBoardCache.date === date && Date.now() - flightBoardCache.timestamp < FLIGHT_BOARD_CACHE_TTL && flightBoardCache.data.length > 0) {
        return res.json(flightBoardCache.data);
      }

      if (flightBoardFetching) {
        return res.json(flightBoardCache.data);
      }

      flightBoardFetching = true;

      const routes = [
        { origin: "JFK", destination: "LHR" },
        { origin: "EWR", destination: "LIS" },
        { origin: "MIA", destination: "GRU" },
        { origin: "LAX", destination: "NRT" },
        { origin: "JFK", destination: "CDG" },
        { origin: "EWR", destination: "FCO" },
        { origin: "MIA", destination: "CUN" },
        { origin: "JFK", destination: "BCN" },
      ];

      const results: any[] = [];
      const markupRate = await getCommissionRate();

      const searchPromises = routes.map(async (route) => {
        try {
          const offers = await searchFlights({
            origin: route.origin,
            destination: route.destination,
            date: date,
            passengers: "1",
            adults: "1",
            children: "0",
            infants: "0",
            cabinClass: "economy",
          });

          if (offers.length > 0) {
            const sorted = offers.sort((a, b) => a.price - b.price);
            const cheapest = sorted[0];
            results.push({
              id: cheapest.id,
              airline: cheapest.airline,
              logoUrl: cheapest.logoUrl,
              flightNumber: cheapest.flightNumber,
              origin: cheapest.originCode || route.origin,
              originCity: cheapest.originCity || route.origin,
              destination: cheapest.destinationCode || route.destination,
              destinationCity: cheapest.destinationCity || route.destination,
              departureTime: cheapest.departureTime,
              arrivalTime: cheapest.arrivalTime,
              duration: cheapest.duration,
              price: parseFloat((cheapest.price * (1 + markupRate)).toFixed(2)),
              currency: cheapest.currency,
              stops: cheapest.stops,
              cabinClass: cheapest.cabinClass || "economy",
            });

            if (sorted.length > 1 && sorted[1].airline !== sorted[0].airline) {
              const alt = sorted[1];
              results.push({
                id: alt.id,
                airline: alt.airline,
                logoUrl: alt.logoUrl,
                flightNumber: alt.flightNumber,
                origin: alt.originCode || route.origin,
                originCity: alt.originCity || route.origin,
                destination: alt.destinationCode || route.destination,
                destinationCity: alt.destinationCity || route.destination,
                departureTime: alt.departureTime,
                arrivalTime: alt.arrivalTime,
                duration: alt.duration,
                price: parseFloat((alt.price * (1 + markupRate)).toFixed(2)),
                currency: alt.currency,
                stops: alt.stops,
                cabinClass: alt.cabinClass || "economy",
              });
            }
          }
        } catch (e) {
          // Skip failed routes silently
        }
      });

      await Promise.allSettled(searchPromises);

      results.sort((a, b) => a.price - b.price);

      flightBoardCache = { data: results, timestamp: Date.now(), date };
      flightBoardFetching = false;

      res.json(results);
    } catch (error) {
      flightBoardFetching = false;
      console.error("Flight board error:", error);
      res.status(500).json({ error: "Failed to fetch flight board data" });
    }
  });

  app.get('/api/aircraft', async (req, res) => {
    try {
      await ensureTestModeLoaded();
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
        await ensureTestModeLoaded();
        const settings = await storage.getSiteSettings();
        const isTestModeActive = settings?.testMode ?? true;

        if (isTestModeActive) {
          console.log("[TEST MODE] Booking created in test mode - Stripe test keys will be used (no real charges)");
        } else {
          if (!hasLiveToken()) {
            console.warn("[PRODUCTION MODE] No DUFFEL_LIVE_TOKEN found - flight data comes from test API but payment will use live Stripe keys");
          }
          console.log("[PRODUCTION MODE] Creating real booking with live Stripe keys");
        }

        const bookingData = req.body;
        
        const commissionRate = settings?.commissionPercentage ? parseFloat(settings.commissionPercentage) / 100 : 0.085;
        const price = parseFloat(bookingData.totalPrice);
        const commissionAmount = (price * (commissionRate / (1 + commissionRate))).toFixed(2);

        const flightDataWithMode = {
            ...bookingData.flightData,
            _testMode: isTestModeActive,
        };

        const refCode = generateReferenceCode();

        const [booking] = await db.insert(bookings).values({
            referenceCode: refCode,
            flightData: flightDataWithMode,
            passengerDetails: bookingData.passengerDetails || bookingData.passengers,
            totalPrice: bookingData.totalPrice,
            currency: bookingData.currency || 'USD',
            contactEmail: bookingData.contactEmail,
            contactPhone: bookingData.contactPhone || null,
            commissionRate: commissionRate.toString(),
            commissionAmount: commissionAmount,
            status: 'pending',
            stripePaymentStatus: 'pending',
            userId: (req as any).user?.id ? String((req as any).user.id) : null
        }).returning();

        const flightInfo = bookingData.flightData || {};
        const stripe = await getUncachableStripeClient();

        const passengerSummary = (bookingData.passengerDetails || bookingData.passengers || [])
          .map((p: any) => `${p.givenName || ''} ${p.familyName || ''}`.trim())
          .filter(Boolean)
          .join(', ');

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(price * 100),
          currency: (bookingData.currency || 'USD').toLowerCase(),
          automatic_payment_methods: { enabled: true },
          description: `Michels Travel Booking ${refCode}: ${flightInfo.originCode || flightInfo.origin || ''} → ${flightInfo.destinationCode || flightInfo.destination || ''}`,
          statement_descriptor: 'MICHELS TRAVEL',
          statement_descriptor_suffix: refCode.substring(0, 22),
          receipt_email: bookingData.contactEmail || undefined,
          metadata: {
            bookingId: String(booking.id),
            referenceCode: refCode,
            origin: flightInfo.originCode || flightInfo.origin || '',
            destination: flightInfo.destinationCode || flightInfo.destination || '',
            airline: flightInfo.airline || '',
            flightNumber: flightInfo.flightNumber || '',
            departureDate: flightInfo.departureTime ? flightInfo.departureTime.split('T')[0] : '',
            passengerCount: String(bookingData.passengerDetails?.length || bookingData.passengers?.length || 1),
            cabinClass: flightInfo.cabinClass || 'economy',
            contactEmail: bookingData.contactEmail || '',
            contactPhone: bookingData.contactPhone || '',
            passengerSummary,
          },
        });

        await db.update(bookings)
            .set({ stripePaymentIntentId: paymentIntent.id })
            .where(eq(bookings.id, booking.id));

        res.status(201).json({ 
          booking, 
          clientSecret: paymentIntent.client_secret,
          testMode: isTestModeActive 
        });

    } catch (error: any) {
        const isTestModeForLog = (await storage.getSiteSettings())?.testMode ?? true;
        console.error(`Booking creation error [${isTestModeForLog ? 'TEST' : 'LIVE'} mode]:`, error?.message || error);
        console.error("Booking creation error details:", JSON.stringify({
          type: error?.type,
          code: error?.code,
          statusCode: error?.statusCode,
          raw: error?.raw?.message,
          decline_code: error?.decline_code,
          param: error?.param,
        }));
        let userMessage: string;
        if (error?.type === 'StripeInvalidRequestError') {
          userMessage = "Payment service configuration error. Please contact support.";
        } else if (error?.type === 'StripeAuthenticationError') {
          userMessage = "Payment service authentication failed. Please contact support.";
        } else if (error?.message?.includes('No Stripe')) {
          userMessage = `Payment keys not configured for ${isTestModeForLog ? 'test' : 'live'} mode. Please contact support.`;
        } else if (error?.message?.includes('Stripe')) {
          userMessage = "Payment processing is temporarily unavailable. Please try again.";
        } else {
          userMessage = "Failed to create booking. Please try again.";
        }
        res.status(500).json({ error: userMessage });
    }
  });

  // Lookup booking by reference code + email (public, for customers)
  // MUST be before /api/bookings/:id to avoid 'lookup' being treated as an id
  app.get('/api/bookings/lookup', async (req, res) => {
    try {
      const { reference, email } = req.query;
      if (!reference || !email) {
        return res.status(400).json({ error: "Reference code and email are required" });
      }
      const refCode = (reference as string).toUpperCase().trim();
      const emailStr = (email as string).toLowerCase().trim();
      
      const booking = await storage.getBookingByReferenceAndEmail(refCode, emailStr);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found. Please check your reference code and email." });
      }
      res.json(booking);
    } catch (error) {
      console.error("Booking lookup error:", error);
      res.status(500).json({ error: "Failed to lookup booking" });
    }
  });

  const emailSentCache = new Set<number>();

  app.post('/api/bookings/:id/send-confirmation', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid booking ID" });

      if (emailSentCache.has(id)) {
        return res.json({ sent: false, message: "Confirmation email already sent for this booking" });
      }

      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const user = (req as any).user;
      const { referenceCode, contactEmail } = req.body || {};
      const hasValidRef = referenceCode && contactEmail && booking.referenceCode === referenceCode && booking.contactEmail === contactEmail;
      const hasValidUser = user && booking.userId && user.id === booking.userId;
      if (booking.userId && !hasValidUser && !hasValidRef) {
        return res.status(403).json({ error: "Access denied" });
      }

      emailSentCache.add(id);

      const sent = await sendBookingConfirmationEmail({
        referenceCode: booking.referenceCode || `MT-${booking.id}`,
        contactEmail: booking.contactEmail,
        contactPhone: booking.contactPhone,
        totalPrice: booking.totalPrice,
        currency: booking.currency || 'USD',
        status: booking.status || 'pending',
        flightData: booking.flightData,
        passengerDetails: (booking.passengerDetails as any[]) || [],
        createdAt: booking.createdAt?.toString() || new Date().toISOString(),
      });

      res.json({ sent, message: sent ? "Confirmation email sent" : "Email service not configured (logged to console)" });
    } catch (error) {
      console.error("Send confirmation error:", error);
      res.status(500).json({ error: "Failed to send confirmation email" });
    }
  });

  // Get booking by ID (for confirmation page)
  app.get('/api/bookings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Get booking error:", error);
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  // === SEAT MAP & SERVICES ROUTES ===

  app.get('/api/flights/:offerId/seat-map', async (req, res) => {
    try {
      const { getSeatMap } = await import('./services/duffel');
      const seatMap = await getSeatMap(req.params.offerId);
      if (!seatMap) {
        return res.json({ available: false, cabins: [] });
      }

      const seatMarkupRate = await getCommissionRate();
      const processed = seatMap.map((sm: any) => ({
        sliceId: sm.slice_id,
        segmentId: sm.segment_id,
        cabins: (sm.cabins || []).map((cabin: any) => ({
          deckType: cabin.deck || 'main',
          wings: cabin.wings || null,
          rows: (cabin.rows || []).map((row: any) => ({
            sectionNumber: row.sections?.[0]?.number || null,
            seats: (row.sections || []).flatMap((section: any) =>
              (section.elements || []).filter((el: any) => el.type === 'seat').map((seat: any) => {
                const rawPrice = seat.available_services?.[0]?.total_amount || null;
                return {
                  id: seat.designator,
                  designator: seat.designator,
                  available: seat.available_services?.length > 0,
                  type: seat.type || 'standard',
                  disclosures: seat.disclosures || [],
                  price: rawPrice ? parseFloat((parseFloat(rawPrice) * (1 + seatMarkupRate)).toFixed(2)).toString() : null,
                  currency: seat.available_services?.[0]?.total_currency || null,
                  serviceId: seat.available_services?.[0]?.id || null,
                };
              })
            ),
          })),
        })),
      }));

      res.json({ available: true, seatMaps: processed });
    } catch (error) {
      console.error("Seat map error:", error);
      res.json({ available: false, cabins: [] });
    }
  });

  app.get('/api/flights/:offerId/services', async (req, res) => {
    try {
      const { getOfferServices } = await import('./services/duffel');
      const services = await getOfferServices(req.params.offerId);

      const serviceMarkupRate = await getCommissionRate();
      const markedUpServices = services.map((s: any) => ({
        ...s,
        totalAmount: s.totalAmount ? parseFloat((parseFloat(s.totalAmount) * (1 + serviceMarkupRate)).toFixed(2)).toString() : s.totalAmount,
      }));

      const baggageServices = markedUpServices.filter((s: any) => s.type === 'baggage');
      const seatServices = markedUpServices.filter((s: any) => s.type === 'seat');
      const otherServices = markedUpServices.filter((s: any) => s.type !== 'baggage' && s.type !== 'seat');

      res.json({
        baggage: baggageServices,
        seats: seatServices,
        other: otherServices,
        all: markedUpServices,
      });
    } catch (error) {
      console.error("Services error:", error);
      res.json({ baggage: [], seats: [], other: [], all: [] });
    }
  });

  app.post('/api/bookings/:id/cancel', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid booking ID" });

      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const user = (req as any).user;
      const { referenceCode, contactEmail } = req.body || {};
      const hasValidRef = referenceCode && contactEmail && booking.referenceCode === referenceCode && booking.contactEmail === contactEmail;
      const hasValidUser = user && booking.userId && user.id === booking.userId;
      if (booking.userId && !hasValidUser && !hasValidRef) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (booking.status === 'cancelled' || booking.status === 'refunded') {
        return res.json({ success: false, message: "Booking is already cancelled" });
      }

      const duffelOrderId = (booking.flightData as any)?.duffelOrderId;
      let refundInfo = null;

      if (duffelOrderId) {
        const { cancelDuffelOrder } = await import('./services/duffel');
        refundInfo = await cancelDuffelOrder(duffelOrderId);
      }

      await db.update(bookings)
        .set({ status: 'cancelled' })
        .where(eq(bookings.id, id));

      res.json({
        success: true,
        message: "Booking cancelled",
        refundAmount: refundInfo?.refundAmount || null,
        refundCurrency: refundInfo?.refundCurrency || null,
      });
    } catch (error) {
      console.error("Cancel booking error:", error);
      res.status(500).json({ error: "Failed to cancel booking" });
    }
  });

  app.get('/api/bookings/:id/refund-quote', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid booking ID" });

      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const user = (req as any).user;
      const { reference, email } = req.query;
      const hasValidRef = reference && email && booking.referenceCode === reference && booking.contactEmail === email;
      const hasValidUser = user && booking.userId && user.id === booking.userId;
      if (booking.userId && !hasValidUser && !hasValidRef) {
        return res.status(403).json({ error: "Access denied" });
      }

      const duffelOrderId = (booking.flightData as any)?.duffelOrderId;
      if (!duffelOrderId) {
        const conditions = (booking.flightData as any)?.conditions;
        return res.json({
          allowed: conditions?.refundBeforeDeparture?.allowed ?? false,
          penaltyAmount: conditions?.refundBeforeDeparture?.penaltyAmount || null,
          penaltyCurrency: conditions?.refundBeforeDeparture?.penaltyCurrency || null,
        });
      }

      const { getRefundQuote } = await import('./services/duffel');
      const quote = await getRefundQuote(duffelOrderId);
      res.json(quote);
    } catch (error) {
      console.error("Refund quote error:", error);
      res.status(500).json({ error: "Failed to get refund quote" });
    }
  });

  // === PROFILE ROUTES ===

  app.get('/api/profile', async (req, res) => {
    const user = (req as any).user;
    const userId = user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const fullUser = await storage.getUser(userId);
      if (!fullUser) return res.status(404).json({ error: "User not found" });

      const userBookings = await storage.getBookings(userId);
      res.json({
        id: fullUser.id,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        phone: fullUser.phone,
        profileImageUrl: fullUser.profileImageUrl,
        createdAt: fullUser.createdAt,
        bookingsCount: userBookings.length,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  app.patch('/api/profile', async (req, res) => {
    const user = (req as any).user;
    const userId = user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const { firstName, lastName, phone } = req.body;
      const updates: Record<string, string> = {};
      if (typeof firstName === 'string') updates.firstName = firstName.trim();
      if (typeof lastName === 'string') updates.lastName = lastName.trim();
      if (typeof phone === 'string') updates.phone = phone.trim();

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updated = await storage.updateUserProfile(userId, updates);
      res.json({
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        profileImageUrl: updated.profileImageUrl,
        createdAt: updated.createdAt,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // === STRIPE ROUTES ===

  app.get('/api/stripe-key', async (_req, res) => {
    try {
      const { getStripePublishableKey } = await import('./stripeClient');
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      console.error('Failed to get Stripe publishable key:', error);
      res.status(500).json({ error: 'Stripe not configured' });
    }
  });

  app.post('/api/bookings/:id/verify-payment', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid booking ID" });

      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const user = (req as any).user;
      const { referenceCode, contactEmail } = req.body || {};
      const hasValidRef = referenceCode && contactEmail && booking.referenceCode === referenceCode && booking.contactEmail === contactEmail;
      const hasValidUser = user && booking.userId && user.id === booking.userId;
      if (booking.userId && !hasValidUser && !hasValidRef) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (booking.status === 'confirmed' || booking.stripePaymentStatus === 'paid') {
        return res.json({ verified: true, status: 'confirmed', booking });
      }

      const paymentId = booking.stripePaymentIntentId;

      if (paymentId) {
        try {
          const { getUncachableStripeClient } = await import('./stripeClient');
          const stripe = await getUncachableStripeClient();

          if (paymentId.startsWith('cs_')) {
            const session = await stripe.checkout.sessions.retrieve(paymentId);
            if (session.payment_status === 'paid') {
              let receiptUrl = booking.stripeReceiptUrl;
              if (!receiptUrl && session.payment_intent) {
                try {
                  const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string, { expand: ['latest_charge'] });
                  receiptUrl = (pi.latest_charge as any)?.receipt_url || null;
                } catch {}
              }
              const [updated] = await db.update(bookings)
                .set({ 
                  status: 'confirmed', 
                  stripePaymentStatus: 'paid',
                  ...(receiptUrl ? { stripeReceiptUrl: receiptUrl } : {}),
                })
                .where(eq(bookings.id, id))
                .returning();
              return res.json({ verified: true, status: 'confirmed', booking: updated });
            }
          } else if (paymentId.startsWith('pi_')) {
            const pi = await stripe.paymentIntents.retrieve(paymentId, { expand: ['latest_charge'] });
            if (pi.status === 'succeeded') {
              const receiptUrl = booking.stripeReceiptUrl || (pi.latest_charge as any)?.receipt_url || null;
              const [updated] = await db.update(bookings)
                .set({ 
                  status: 'confirmed', 
                  stripePaymentStatus: 'paid',
                  ...(receiptUrl ? { stripeReceiptUrl: receiptUrl } : {}),
                })
                .where(eq(bookings.id, id))
                .returning();
              return res.json({ verified: true, status: 'confirmed', booking: updated });
            }
          }
        } catch (stripeErr) {
          console.error('Payment verification error:', stripeErr);
        }
      }

      res.json({ verified: false, status: booking.status, booking });
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  app.get('/api/bookings/:id/receipt', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid booking ID" });

      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const user = (req as any).user;
      if (booking.userId && (!user || user.id !== booking.userId)) {
        const { reference, email } = req.query;
        if (!reference || !email || reference !== booking.referenceCode || email !== booking.contactEmail) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      if (booking.stripeReceiptUrl) {
        return res.json({ receiptUrl: booking.stripeReceiptUrl });
      }

      if (booking.stripePaymentIntentId && booking.stripePaymentIntentId.startsWith('pi_')) {
        try {
          const { getUncachableStripeClient } = await import('./stripeClient');
          const stripe = await getUncachableStripeClient();
          const pi = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId, { expand: ['latest_charge'] });
          const receiptUrl = (pi.latest_charge as any)?.receipt_url || null;
          if (receiptUrl) {
            await db.update(bookings)
              .set({ stripeReceiptUrl: receiptUrl })
              .where(eq(bookings.id, id));
            return res.json({ receiptUrl });
          }
        } catch (err: any) {
          console.error('Receipt URL fetch error:', err?.message);
        }
      }

      res.json({ receiptUrl: null });
    } catch (error) {
      console.error("Receipt URL error:", error);
      res.status(500).json({ error: "Failed to get receipt" });
    }
  });

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
  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
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
  app.get('/api/admin/settings', requireAdmin, async (req, res) => {
    const settings = await storage.getSiteSettings();
    if (!settings) {
      return res.json({
        id: 0,
        siteName: "Michels Travel",
        commissionPercentage: "8.50",
        heroTitle: "Find Your Next Adventure",
        heroSubtitle: "Best prices on flights worldwide.",
        testMode: true,
        updatedAt: new Date(),
      });
    }
    res.json(settings);
  });

  // Update Admin Settings
  app.post('/api/admin/settings', requireAdmin, async (req, res) => {
    const updated = await storage.upsertSiteSettings(req.body);
    res.json(updated);
  });

  // Pre-flight check: validate both APIs are ready for target mode
  app.get('/api/admin/test-mode/preflight', requireAdmin, async (req, res) => {
    const targetTestMode = req.query.target === 'test';
    const { validateStripeKeysForMode } = await import('./stripeClient');

    const duffelReady = targetTestMode ? hasTestToken() : hasLiveToken();
    const stripeCheck = await validateStripeKeysForMode(targetTestMode);

    const issues: string[] = [];
    if (!duffelReady) {
      issues.push(targetTestMode 
        ? "Duffel: DUFFEL_API_TOKEN (test) not configured"
        : "Duffel: DUFFEL_LIVE_TOKEN (production) not configured");
    }
    if (!stripeCheck.valid) {
      issues.push(targetTestMode
        ? "Stripe: test keys not configured"
        : "Stripe: live keys not configured");
    }

    res.json({
      targetMode: targetTestMode ? 'test' : 'production',
      ready: issues.length === 0,
      duffelReady,
      stripeReady: stripeCheck.valid,
      issues,
    });
  });

  // Toggle Test Mode (with synchronized Duffel + Stripe switch)
  app.post('/api/admin/test-mode', requireAdmin, async (req, res) => {
    const { testMode, confirmed } = req.body;
    if (typeof testMode !== 'boolean') {
      return res.status(400).json({ error: "testMode must be a boolean" });
    }

    if (!confirmed) {
      return res.status(400).json({ error: "Confirmation required. Set confirmed: true to proceed." });
    }

    if (!testMode && !hasLiveToken()) {
      return res.status(400).json({ 
        error: "Cannot switch to production: DUFFEL_LIVE_TOKEN is not configured." 
      });
    }

    if (testMode && !hasTestToken()) {
      return res.status(400).json({ 
        error: "Cannot switch to test mode: DUFFEL_API_TOKEN is not configured." 
      });
    }

    const { validateStripeKeysForMode } = await import('./stripeClient');
    const stripeCheck = await validateStripeKeysForMode(testMode);
    if (!stripeCheck.valid) {
      return res.status(400).json({ 
        error: `Cannot switch mode: ${stripeCheck.error}` 
      });
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

    setTestModeCache(testMode);
    clearReferenceDataCache();

    let stripeSynced = false;
    try {
      const { getStripeSync } = await import('./stripeClient');
      await getStripeSync();
      stripeSynced = true;
      console.log(`[MODE SWITCH] Stripe client re-initialized for ${testMode ? 'TEST' : 'LIVE'} mode`);
    } catch (stripeErr: any) {
      console.error(`[MODE SWITCH] Stripe re-initialization warning:`, stripeErr?.message);
    }

    const modeLabel = testMode ? 'TEST' : 'PRODUCTION';
    console.log(`[MODE SWITCH] Switched to ${modeLabel} mode. Duffel: ${activeTokenIsTest() ? 'test' : 'live'}, Stripe: ${stripeSynced ? (testMode ? 'test' : 'live') : 'error'}`);

    res.json({ 
      testMode: updated?.testMode ?? testMode, 
      activeTokenIsTest: activeTokenIsTest(),
      stripeSynced,
      message: testMode 
        ? "Test mode enabled - Duffel and Stripe using test keys" 
        : "Production mode enabled - Duffel and Stripe using live keys" 
    });
  });

  // Public: check if test mode is active (for banner display)
  app.get('/api/test-mode', async (_req, res) => {
    const settings = await storage.getSiteSettings();
    const testModeActive = settings?.testMode ?? true;
    setTestModeCache(testModeActive);
    res.json({ 
      testMode: testModeActive, 
      activeTokenIsTest: activeTokenIsTest(),
      hasLiveToken: hasLiveToken(),
      hasTestToken: hasTestToken(),
    });
  });

  // All Bookings
  app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
    const allBookings = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
    res.json(allBookings);
  });

  // === ADMIN AUTH (Password-based, separate from Replit Auth) ===

  const adminWebLoginAttempts = new Map<string, { count: number; lastAttempt: number }>();

  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";

    const attempts = adminWebLoginAttempts.get(clientIp);
    if (attempts && attempts.count >= 5 && Date.now() - attempts.lastAttempt < 15 * 60 * 1000) {
      return res.status(429).json({ error: "Too many login attempts. Try again in 15 minutes." });
    }

    if (!adminPassword) {
      return res.status(500).json({ error: "Admin password not configured on server" });
    }

    if (!password || password !== adminPassword) {
      const current = adminWebLoginAttempts.get(clientIp) || { count: 0, lastAttempt: 0 };
      adminWebLoginAttempts.set(clientIp, { count: current.count + 1, lastAttempt: Date.now() });
      return res.status(401).json({ error: "Invalid admin password" });
    }

    adminWebLoginAttempts.delete(clientIp);

    (req.session as any).isAdmin = true;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: "Session error" });
      }
      res.json({ success: true });
    });
  });

  app.post('/api/admin/logout', (req, res) => {
    (req.session as any).isAdmin = false;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: "Session error" });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/admin/check', (req, res) => {
    let isAdmin = !!(req.session as any)?.isAdmin;
    if (!isAdmin) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET) as { role: string };
          isAdmin = decoded.role === "admin";
        } catch {}
      }
    }
    res.json({ isAdmin });
  });

  const adminLoginAttempts = new Map<string, { count: number; lastAttempt: number }>();

  app.post('/api/admin-app/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";

    const attempts = adminLoginAttempts.get(clientIp);
    if (attempts && attempts.count >= 5 && Date.now() - attempts.lastAttempt < 15 * 60 * 1000) {
      return res.status(429).json({ error: "Too many login attempts. Try again in 15 minutes." });
    }

    if (!adminPassword) {
      return res.status(500).json({ error: "Admin password not configured" });
    }

    if (!password || password !== adminPassword) {
      const current = adminLoginAttempts.get(clientIp) || { count: 0, lastAttempt: 0 };
      adminLoginAttempts.set(clientIp, { count: current.count + 1, lastAttempt: Date.now() });
      return res.status(401).json({ error: "Invalid password" });
    }

    adminLoginAttempts.delete(clientIp);

    const token = jwt.sign({ role: "admin", iat: Math.floor(Date.now() / 1000) }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.json({ token });
  });

  app.get('/api/admin-app/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ authenticated: false });
    }
    try {
      const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET) as { role: string; iat: number; exp: number };
      if (decoded.role === "admin") {
        return res.json({ authenticated: true, expiresAt: decoded.exp * 1000 });
      }
    } catch {}
    return res.status(401).json({ authenticated: false });
  });

  // === BLOG ROUTES ===

  app.get('/api/blog', async (req, res) => {
    try {
      const language = req.query.language as string | undefined;
      const posts = await storage.getBlogPosts(language);
      res.json(posts);
    } catch (error) {
      console.error('Blog posts fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
  });

  app.get('/api/blog/:slug', async (req, res) => {
    try {
      const lang = req.query.lang as string | undefined;
      const post = await storage.getBlogPost(req.params.slug, lang);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    } catch (error) {
      console.error('Blog post fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch blog post' });
    }
  });

  app.post('/api/admin/blog', requireAdmin, async (req, res) => {
    try {
      const post = await storage.createBlogPost(req.body);
      res.status(201).json(post);
    } catch (error) {
      console.error('Blog post creation error:', error);
      res.status(500).json({ error: 'Failed to create blog post' });
    }
  });

  const SITE_URL = "https://buyflights.net";

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkout/
Disallow: /profile
Disallow: /my-trips
Disallow: /search
Disallow: /book/
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`);
  });

  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const blogPosts = await storage.getBlogPosts();
      const now = new Date().toISOString().split('T')[0];

      const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/about', priority: '0.8', changefreq: 'monthly' },
        { url: '/blog', priority: '0.7', changefreq: 'weekly' },
      ];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

      for (const page of staticPages) {
        xml += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
      }

      if (blogPosts && blogPosts.length > 0) {
        for (const post of blogPosts) {
          const lastmod = post.createdAt
            ? new Date(post.createdAt as unknown as string).toISOString().split('T')[0]
            : now;
          xml += `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
        }
      }

      xml += `</urlset>`;
      res.type('application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Sitemap generation error:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // === AI CHATBOT ROUTES ===

  const chatbotOpenai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  const CHATBOT_SYSTEM_PROMPT = `You are the friendly customer support assistant for Michels Travel ("Opção Eficiente"), a flight booking agency based in New Jersey, USA. Your name is Mia.

ABOUT THE COMPANY:
- Flight booking website: buyflights.net (this is our flight search and booking platform — always direct customers here for flights)
- Contact email: reservastrens@gmail.com
- Phone/WhatsApp: +1 (862) 350-1161
- Location: New Jersey, USA
- Services: Flight search and booking with competitive prices worldwide
- IMPORTANT: Never mention or recommend "michelstravel.com" — our flight booking site is buyflights.net
- Payment: Secure credit card payment via Stripe (card details entered directly on our site)
- Languages: Portuguese, English, Spanish

KEY INFORMATION YOU CAN HELP WITH:
- How to search for flights (use the search bar on the homepage)
- How the booking process works (search → select flight → enter passenger details → pay with card)
- Baggage policies (vary by airline, shown during booking)
- Multi-city trips (supported, use "Multi-city" tab in search)
- Booking changes/cancellations (available on the "My Trips" page)
- Looking up existing bookings (need reference code starting with "MT-" and email)
- Payment questions (we use secure Stripe payment, cards accepted)
- General travel tips

ESCALATION RULES:
- If the customer explicitly asks to speak with a human/agent/attendant/pessoa, or if the issue is complex (refund disputes, payment failures, urgent changes within 24h of flight), respond with the EXACT text "[ESCALATE]" at the START of your message, followed by your normal helpful response explaining you're connecting them to a human.
- If the customer is frustrated or repeating the same issue multiple times, also escalate.
- When escalating, ALWAYS include the Facebook Messenger link so the customer can contact a human agent directly: https://m.me/michelstravelusa
- Example escalation response: "[ESCALATE] Vou te conectar com um atendente humano! Você pode falar diretamente com nossa equipe pelo Messenger: https://m.me/michelstravelusa ou pelo WhatsApp: +1 (862) 350-1161"

BEHAVIOR:
- Always respond in the SAME LANGUAGE the customer writes in. If they write in Portuguese, respond in Portuguese. If English, respond in English. If Spanish, respond in Spanish.
- Be warm, professional, and concise
- Use the customer's name if they provide it
- Never make up flight prices or availability - direct them to search on the site
- Never share internal system details or API information
- If you don't know something, say so honestly and offer to connect them with a human agent
- Keep responses under 200 words unless more detail is needed`;

  app.post('/api/chatbot/session', async (req, res) => {
    try {
      const { visitorId, language } = req.body;
      const [conversation] = await db.insert(conversations).values({
        title: "Customer Support Chat",
        visitorId: visitorId || nanoid(10),
        language: language || "pt",
        escalated: false,
        resolved: false,
      }).returning();
      res.json({ sessionId: conversation.id, visitorId: conversation.visitorId });
    } catch (error) {
      console.error('Chatbot session creation error:', error);
      res.status(500).json({ error: "Failed to create chat session" });
    }
  });

  app.post('/api/chatbot/message', async (req, res) => {
    try {
      const { sessionId, content } = req.body;
      if (!sessionId || !content) {
        return res.status(400).json({ error: "sessionId and content are required" });
      }

      await db.insert(messages).values({
        conversationId: sessionId,
        role: "user",
        content,
      });

      const existingMessages = await db.select().from(messages)
        .where(eq(messages.conversationId, sessionId))
        .orderBy(messages.createdAt);

      const chatHistory: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: CHATBOT_SYSTEM_PROMPT },
        ...existingMessages.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      });

      let clientDisconnected = false;
      req.on("close", () => { clientDisconnected = true; });

      let fullResponse = "";

      try {
        const completion = await chatbotOpenai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: chatHistory,
          max_tokens: 512,
        });

        fullResponse = completion.choices[0]?.message?.content || "";
      } catch (modelError: any) {
        console.error("Primary model failed, trying fallback:", modelError.message);
        try {
          const fallback = await chatbotOpenai.chat.completions.create({
            model: "gpt-5-nano",
            messages: chatHistory,
            max_tokens: 512,
          });
          fullResponse = fallback.choices[0]?.message?.content || "";
        } catch (fallbackError: any) {
          console.error("Fallback model also failed:", fallbackError.message);
          fullResponse = "Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes ou entre em contato pelo WhatsApp: +1 (862) 350-1161.";
        }
      }

      if (fullResponse && !clientDisconnected) {
        res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
        if (typeof (res as any).flush === "function") (res as any).flush();
      }

      await db.insert(messages).values({
        conversationId: sessionId,
        role: "assistant",
        content: fullResponse,
      });

      const shouldEscalate = fullResponse.trimStart().startsWith("[ESCALATE]");
      if (shouldEscalate) {
        await db.update(conversations)
          .set({ escalated: true, escalatedAt: new Date() })
          .where(eq(conversations.id, sessionId));

        const allMsgs = await db.select().from(messages)
          .where(eq(messages.conversationId, sessionId))
          .orderBy(messages.createdAt);
        const chatLog = allMsgs.map(m => `[${m.role}]: ${m.content}`).join("\n\n");
        sendChatEscalationEmail(sessionId, chatLog).catch(err => 
          console.error("Failed to send escalation email:", err)
        );
      }

      res.write(`data: ${JSON.stringify({ done: true, escalated: shouldEscalate })}\n\n`);
      if (typeof (res as any).flush === "function") (res as any).flush();
      res.end();
    } catch (error) {
      console.error('Chatbot message error:', error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  app.get('/api/chatbot/history/:sessionId', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const chatMessages = await db.select().from(messages)
        .where(eq(messages.conversationId, sessionId))
        .orderBy(messages.createdAt);
      res.json(chatMessages);
    } catch (error) {
      console.error('Chatbot history error:', error);
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  const AGENT_SYSTEM_PROMPT = `${CHATBOT_SYSTEM_PROMPT}

AGENT MODE - IMPORTANT:
You are now in AGENT MODE. You have the ability to search for real flights using the search_flights function.

WHEN TO USE search_flights:
- When a customer asks to find or search for flights
- When they mention traveling from one place to another
- When they want to know prices or availability
- When they say things like "I want to fly to...", "find me flights...", "quanto custa voo para...", "buscar voo..."

HOW TO USE search_flights:
- You MUST extract: origin airport code (3-letter IATA), destination airport code (3-letter IATA), and departure date
- If the customer doesn't provide airport codes, use your knowledge to determine the correct IATA codes (e.g., "São Paulo" → "GRU", "New York" → "JFK", "Miami" → "MIA", "Orlando" → "MCO", "Lisboa" → "LIS")
- If date is missing, ask the customer for the travel date
- If origin is missing, ask where they're departing from
- Default to 1 adult passenger if not specified
- Default to "economy" cabin class if not specified

AFTER SEARCH RESULTS:
- Present the results in a friendly, helpful way
- Mention the airline, price, departure/arrival times, and stops
- Tell them they can click "Book" on any result to start the booking process
- If no results found, suggest trying different dates or nearby airports

IMPORTANT: Always use the search_flights function when the customer wants to find flights. Never make up flight prices or availability.`;

  const AGENT_TOOLS: any[] = [
    {
      type: "function",
      function: {
        name: "search_flights",
        description: "Search for real flight offers. Use this when a customer wants to find flights.",
        parameters: {
          type: "object",
          properties: {
            origin: {
              type: "string",
              description: "Origin airport IATA code (3 letters), e.g. GRU, JFK, MIA"
            },
            destination: {
              type: "string",
              description: "Destination airport IATA code (3 letters), e.g. MCO, LIS, CDG"
            },
            date: {
              type: "string",
              description: "Departure date in YYYY-MM-DD format"
            },
            returnDate: {
              type: "string",
              description: "Return date in YYYY-MM-DD format (optional, for round trips)"
            },
            adults: {
              type: "string",
              description: "Number of adult passengers, default '1'"
            },
            cabinClass: {
              type: "string",
              enum: ["economy", "premium_economy", "business", "first"],
              description: "Cabin class preference, default 'economy'"
            }
          },
          required: ["origin", "destination", "date"]
        }
      }
    }
  ];

  app.post('/api/chatbot/agent-message', async (req, res) => {
    try {
      const { sessionId, content } = req.body;
      if (!sessionId || !content) {
        return res.status(400).json({ error: "sessionId and content are required" });
      }

      await db.insert(messages).values({
        conversationId: sessionId,
        role: "user",
        content,
      });

      const existingMessages = await db.select().from(messages)
        .where(eq(messages.conversationId, sessionId))
        .orderBy(messages.createdAt);

      const chatHistory: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: AGENT_SYSTEM_PROMPT },
        ...existingMessages.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      });

      let clientDisconnected = false;
      req.on("close", () => { clientDisconnected = true; });

      const initialResponse = await chatbotOpenai.chat.completions.create({
        model: "gpt-5-nano",
        messages: chatHistory,
        tools: AGENT_TOOLS,
        max_completion_tokens: 512,
      });

      const choice = initialResponse.choices[0];

      if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
        const toolCall = choice.message.tool_calls[0] as any;
        if (toolCall.function?.name === "search_flights") {
          let args: any;
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch {
            args = {};
          }

          res.write(`data: ${JSON.stringify({ content: "🔍 ", type: "text" })}\n\n`);
          if (typeof (res as any).flush === "function") (res as any).flush();

          const searchingMsg = args.origin && args.destination
            ? `Searching flights from ${args.origin} to ${args.destination}...`
            : "Searching flights...";
          res.write(`data: ${JSON.stringify({ content: searchingMsg, type: "text" })}\n\n`);
          if (typeof (res as any).flush === "function") (res as any).flush();

          try {
            const { searchFlights } = await import("./services/duffel");
            const flights = await searchFlights({
              origin: args.origin,
              destination: args.destination,
              date: args.date,
              returnDate: args.returnDate,
              adults: args.adults || "1",
              cabinClass: args.cabinClass || "economy",
              passengers: args.adults || "1",
            });

            const chatMarkupRate = await getCommissionRate();
            const topFlights = flights.slice(0, 5).map(f => ({
              id: f.id,
              airline: f.airline,
              flightNumber: f.flightNumber,
              departureTime: f.departureTime,
              arrivalTime: f.arrivalTime,
              duration: f.duration,
              price: parseFloat((f.price * (1 + chatMarkupRate)).toFixed(2)),
              currency: f.currency,
              stops: f.stops,
              logoUrl: f.logoUrl,
              originCode: f.originCode || args.origin,
              destinationCode: f.destinationCode || args.destination,
              originCity: f.originCity,
              destinationCity: f.destinationCity,
            }));

            res.write(`data: ${JSON.stringify({ flights: topFlights, type: "flights" })}\n\n`);
            if (typeof (res as any).flush === "function") (res as any).flush();

            chatHistory.push({
              role: "assistant",
              content: `[Function called: search_flights] Found ${flights.length} flights from ${args.origin} to ${args.destination} on ${args.date}. Top ${topFlights.length} results shown to customer with prices ranging from ${topFlights.length > 0 ? topFlights[0].currency + ' ' + Math.min(...topFlights.map(f => f.price)) : 'N/A'} to ${topFlights.length > 0 ? topFlights[0].currency + ' ' + Math.max(...topFlights.map(f => f.price)) : 'N/A'}.`,
            });

            const followUpMessages = [
              ...chatHistory,
              { role: "user" as const, content: `The search results are now displayed to the customer. Write a brief friendly summary message about the results found. Mention how many flights were found and the price range. Tell them they can click "Book" on any option. Respond in the same language the customer has been using.` },
            ];

            const followUp = await chatbotOpenai.chat.completions.create({
              model: "gpt-5-nano",
              messages: followUpMessages,
              stream: true,
              max_completion_tokens: 256,
            });

            let fullResponse = "";
            for await (const chunk of followUp) {
              if (clientDisconnected) break;
              const text = chunk.choices[0]?.delta?.content || "";
              if (text) {
                fullResponse += text;
                res.write(`data: ${JSON.stringify({ content: text, type: "text" })}\n\n`);
                if (typeof (res as any).flush === "function") (res as any).flush();
              }
            }

            const savedContent = `[AGENT: Searched ${args.origin}→${args.destination} on ${args.date}, found ${flights.length} results]\n${fullResponse}`;
            await db.insert(messages).values({
              conversationId: sessionId,
              role: "assistant",
              content: savedContent,
            });

          } catch (searchError) {
            console.error("Flight search error in agent mode:", searchError);
            const errorMsg = "I tried searching for flights but encountered an error. Please try using the search bar on our homepage, or I can try again with different details.";
            res.write(`data: ${JSON.stringify({ content: errorMsg, type: "text" })}\n\n`);
            if (typeof (res as any).flush === "function") (res as any).flush();

            await db.insert(messages).values({
              conversationId: sessionId,
              role: "assistant",
              content: errorMsg,
            });
          }
        }
      } else {
        const textContent = choice.message.content || "";
        if (textContent) {
          res.write(`data: ${JSON.stringify({ content: textContent, type: "text" })}\n\n`);
          if (typeof (res as any).flush === "function") (res as any).flush();

          await db.insert(messages).values({
            conversationId: sessionId,
            role: "assistant",
            content: textContent,
          });
        }
      }

      const shouldEscalate = false;
      res.write(`data: ${JSON.stringify({ done: true, escalated: shouldEscalate })}\n\n`);
      if (typeof (res as any).flush === "function") (res as any).flush();
      res.end();
    } catch (error) {
      console.error('Agent message error:', error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to process agent message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process agent message" });
      }
    }
  });

  app.post('/api/chatbot/escalate', async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ error: "Session ID required" });

      await db.update(conversations)
        .set({ escalated: true, escalatedAt: new Date() })
        .where(eq(conversations.id, sessionId));

      const allMsgs = await db.select().from(messages)
        .where(eq(messages.conversationId, sessionId))
        .orderBy(messages.createdAt);

      const { sendChatEscalationEmail } = await import("./services/emailService");
      const chatLog = allMsgs.map(m => `[${m.role}]: ${m.content}`).join("\n\n");
      sendChatEscalationEmail(sessionId, chatLog).catch((err: any) =>
        console.error("Failed to send escalation email:", err)
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Chatbot escalation error:', error);
      res.status(500).json({ error: "Failed to escalate" });
    }
  });

  app.get('/api/admin/chatbot/escalations', requireAdmin, async (req, res) => {
    try {
      const escalated = await db.select().from(conversations)
        .where(eq(conversations.escalated, true))
        .orderBy(desc(conversations.escalatedAt));

      const escalationsWithMessages = await Promise.all(
        escalated.map(async (conv) => {
          const msgs = await db.select().from(messages)
            .where(eq(messages.conversationId, conv.id))
            .orderBy(messages.createdAt);
          return { ...conv, messages: msgs };
        })
      );

      res.json(escalationsWithMessages);
    } catch (error) {
      console.error('Admin escalations error:', error);
      res.status(500).json({ error: "Failed to fetch escalations" });
    }
  });

  app.post('/api/admin/chatbot/escalations/:id/resolve', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.update(conversations)
        .set({ resolved: true })
        .where(eq(conversations.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Resolve escalation error:', error);
      res.status(500).json({ error: "Failed to resolve escalation" });
    }
  });

  app.post('/api/admin/chatbot/reply', requireAdmin, async (req, res) => {
    try {
      const { conversationId, content } = req.body;
      if (!conversationId || !content) {
        return res.status(400).json({ error: "conversationId and content are required" });
      }

      await db.insert(messages).values({
        conversationId,
        role: "admin",
        content,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Admin reply error:', error);
      res.status(500).json({ error: "Failed to send reply" });
    }
  });

  app.get('/api/chatbot/poll/:sessionId', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const afterId = parseInt(req.query.afterId as string) || 0;

      const newMessages = await db.select().from(messages)
        .where(
          and(
            eq(messages.conversationId, sessionId),
            eq(messages.role, "admin"),
            afterId > 0 ? gt(messages.id, afterId) : undefined
          )
        )
        .orderBy(messages.createdAt);

      res.json(newMessages);
    } catch (error) {
      console.error('Poll messages error:', error);
      res.status(500).json({ error: "Failed to poll messages" });
    }
  });

  app.get('/api/admin/chatbot/conversations', requireAdmin, async (req, res) => {
    try {
      const allConversations = await db.select().from(conversations)
        .orderBy(desc(conversations.createdAt));

      const convsWithMessages = await Promise.all(
        allConversations.map(async (conv) => {
          const msgs = await db.select().from(messages)
            .where(eq(messages.conversationId, conv.id))
            .orderBy(messages.createdAt);
          return { ...conv, messages: msgs };
        })
      );

      res.json(convsWithMessages);
    } catch (error) {
      console.error('Admin conversations error:', error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get('/api/admin/chatbot/conversations/:id/messages', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const msgs = await db.select().from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(messages.createdAt);
      res.json(msgs);
    } catch (error) {
      console.error('Admin conversation messages error:', error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // ============ LIVE SESSION ROUTES ============

  // SSE connections map for real-time updates
  const liveSessionClients = new Map<number, Set<Response>>();

  function notifyLiveSessionClients(sessionId: number, event: string, data: any) {
    const clients = liveSessionClients.get(sessionId);
    if (clients) {
      const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      clients.forEach(client => {
        try { client.write(msg); } catch {}
      });
    }
  }

  // Client requests live help
  app.post('/api/live-sessions/request', async (req, res) => {
    try {
      const { visitorId, language, conversationId } = req.body;
      if (!visitorId) return res.status(400).json({ error: "visitorId required" });

      const existing = await storage.getLiveSessionByVisitor(visitorId);
      if (existing && (existing.status === "requested" || existing.status === "active")) {
        return res.json(existing);
      }

      const accessToken = nanoid(32);
      const session = await storage.createLiveSession({
        accessToken,
        visitorId,
        language: language || "pt",
        conversationId: conversationId || null,
        status: "requested",
        whatsappLink: "https://wa.me/18623501161",
      });
      res.json(session);
    } catch (error) {
      console.error("Live session request error:", error);
      res.status(500).json({ error: "Failed to create session request" });
    }
  });

  // Client gets their session status and shared blocks (requires access token)
  app.get('/api/live-sessions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const token = req.query.token as string;
      if (!token) return res.status(401).json({ error: "Access token required" });

      const session = await storage.getLiveSession(id);
      if (!session) return res.status(404).json({ error: "Session not found" });
      if (session.accessToken !== token) return res.status(403).json({ error: "Invalid access token" });

      const blocks = await storage.getLiveSessionBlocks(id, true);
      const messages = await storage.getLiveSessionMessages(id);
      res.json({ session, blocks, messages });
    } catch (error) {
      console.error("Live session get error:", error);
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Client SSE stream for real-time updates (requires access token)
  app.get('/api/live-sessions/:id/stream', async (req, res) => {
    const id = parseInt(req.params.id);
    const token = req.query.token as string;
    if (!token) { res.status(401).json({ error: "Access token required" }); return; }
    const session = await storage.getLiveSession(id);
    if (!session || session.accessToken !== token) { res.status(403).json({ error: "Invalid access token" }); return; }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(`event: connected\ndata: {"sessionId":${id}}\n\n`);

    if (!liveSessionClients.has(id)) {
      liveSessionClients.set(id, new Set());
    }
    liveSessionClients.get(id)!.add(res);

    req.on('close', () => {
      liveSessionClients.get(id)?.delete(res);
      if (liveSessionClients.get(id)?.size === 0) {
        liveSessionClients.delete(id);
      }
    });
  });

  // Client sends chat message (requires access token)
  app.post('/api/live-sessions/:id/messages', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { content, role, token } = req.body;
      if (!content) return res.status(400).json({ error: "content required" });
      if (!token) return res.status(401).json({ error: "Access token required" });
      const session = await storage.getLiveSession(id);
      if (!session || session.accessToken !== token) return res.status(403).json({ error: "Invalid access token" });

      const msg = await storage.createLiveSessionMessage({
        sessionId: id,
        role: role || "client",
        content,
      });
      notifyLiveSessionClients(id, "message", msg);
      res.json(msg);
    } catch (error) {
      console.error("Live session message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Client checks session by visitor ID
  app.get('/api/live-sessions/by-visitor/:visitorId', async (req, res) => {
    try {
      const session = await storage.getLiveSessionByVisitor(req.params.visitorId);
      if (!session) return res.json({ session: null });
      res.json({ session });
    } catch (error) {
      res.status(500).json({ error: "Failed to check session" });
    }
  });

  // ---- Admin live session routes (JWT auth) ----

  // Admin gets pending requests
  app.get('/api/live-sessions/admin/requests', requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getLiveSessionRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to get requests" });
    }
  });

  // Admin gets active sessions
  app.get('/api/live-sessions/admin/active', requireAdmin, async (req, res) => {
    try {
      const sessions = await storage.getActiveLiveSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get active sessions" });
    }
  });

  // Admin gets full session detail (all blocks, not just shared)
  app.get('/api/live-sessions/admin/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getLiveSession(id);
      if (!session) return res.status(404).json({ error: "Session not found" });

      const blocks = await storage.getLiveSessionBlocks(id, false);
      const messages = await storage.getLiveSessionMessages(id);
      res.json({ session, blocks, messages });
    } catch (error) {
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Admin accepts a session request
  app.post('/api/live-sessions/admin/:id/accept', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.updateLiveSessionStatus(id, "active");
      if (!session) return res.status(404).json({ error: "Session not found" });
      notifyLiveSessionClients(id, "session_update", { status: "active" });
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to accept session" });
    }
  });

  // Admin closes a session
  app.post('/api/live-sessions/admin/:id/close', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.updateLiveSessionStatus(id, "closed");
      if (!session) return res.status(404).json({ error: "Session not found" });
      notifyLiveSessionClients(id, "session_update", { status: "closed" });
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to close session" });
    }
  });

  // Admin creates/updates a block
  app.post('/api/live-sessions/admin/:id/blocks', requireAdmin, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { blockType, payload, shared, sortOrder } = req.body;
      if (!blockType || !payload) return res.status(400).json({ error: "blockType and payload required" });

      const block = await storage.createLiveSessionBlock({
        sessionId,
        blockType,
        payload,
        shared: shared || false,
        sortOrder: sortOrder || 0,
      });
      if (block.shared) {
        notifyLiveSessionClients(sessionId, "block_update", block);
      }
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: "Failed to create block" });
    }
  });

  // Admin toggles block visibility (share/unshare)
  app.patch('/api/live-sessions/admin/blocks/:blockId', requireAdmin, async (req, res) => {
    try {
      const blockId = parseInt(req.params.blockId);
      const { shared, payload } = req.body;
      const updates: any = {};
      if (shared !== undefined) updates.shared = shared;
      if (payload !== undefined) updates.payload = payload;

      const block = await storage.updateLiveSessionBlock(blockId, updates);
      if (!block) return res.status(404).json({ error: "Block not found" });

      notifyLiveSessionClients(block.sessionId, (shared === false) ? "block_removed" : "block_update", block);
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: "Failed to update block" });
    }
  });

  // Admin deletes a block
  app.delete('/api/live-sessions/admin/blocks/:blockId', requireAdmin, async (req, res) => {
    try {
      const blockId = parseInt(req.params.blockId);
      await storage.deleteLiveSessionBlock(blockId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete block" });
    }
  });

  // Admin sends a chat message
  app.post('/api/live-sessions/admin/:id/messages', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { content } = req.body;
      if (!content) return res.status(400).json({ error: "content required" });

      const msg = await storage.createLiveSessionMessage({
        sessionId: id,
        role: "admin",
        content,
      });
      notifyLiveSessionClients(id, "message", msg);
      res.json(msg);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Admin searches flights for live session (uses existing Duffel search with markup)
  app.get('/api/live-sessions/admin/search-flights', requireAdmin, async (req, res) => {
    try {
      const params = req.query as any;
      if (!params.origin || !params.destination || !params.date) {
        return res.status(400).json({ error: "origin, destination, date required" });
      }

      const flights = await searchFlights(params);
      const rate = await getCommissionRate();
      const markedUpFlights = applyMarkupToFlights(flights, rate);
      res.json(markedUpFlights);
    } catch (error) {
      console.error("Live session flight search error:", error);
      res.status(500).json({ error: "Flight search failed" });
    }
  });
}
