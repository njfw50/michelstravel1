
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import { storage } from './storage';
import { stripeService } from './stripeService';
import { getUncachableStripeClient } from './stripeClient';
import { db } from "./db";
import { flightSearches, bookings, siteSettings, type FlightSearchParams } from "@shared/schema";
import { users } from "@shared/models/auth";
import { desc, eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

function generateReferenceCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MT-${code}`;
}
import { searchFlights, getFlight, searchPlaces, getAirlines, getAirports, getAircraft, initializeReferenceData, isTestMode, activeTokenIsTest, hasLiveToken, hasTestToken, setTestModeCache, clearReferenceDataCache, loadTestModeSetting, ensureTestModeLoaded, refreshOffer } from "./services/duffel";
import { sendBookingConfirmationEmail } from "./services/emailService";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any)?.isAdmin) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  next();
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
        await ensureTestModeLoaded();
        const flight = await getFlight(req.params.id);
        if (!flight) {
            return res.status(404).json({ error: "Flight not found" });
        }
        res.json(flight);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch flight details" });
    }
  });

  app.get('/api/flights/:id/refresh', async (req, res) => {
    try {
      await ensureTestModeLoaded();
      const result = await refreshOffer(req.params.id);
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
              price: cheapest.price,
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
                price: alt.price,
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
        
        const commissionRate = settings?.commissionPercentage ? parseFloat(settings.commissionPercentage) / 100 : 0.05;
        const price = parseFloat(bookingData.totalPrice);
        const commissionAmount = (price * commissionRate).toFixed(2);

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
        console.error("Booking creation error:", error?.message || error);
        console.error("Booking creation error details:", JSON.stringify({
          type: error?.type,
          code: error?.code,
          statusCode: error?.statusCode,
          raw: error?.raw?.message,
        }));
        const userMessage = error?.type === 'StripeInvalidRequestError' 
          ? "Payment service configuration error. Please contact support."
          : error?.message?.includes('Stripe') 
            ? "Payment processing is temporarily unavailable. Please try again."
            : "Failed to create booking. Please try again.";
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
      if (booking.userId && (!user || user.id !== booking.userId)) {
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

      const processed = seatMap.map((sm: any) => ({
        sliceId: sm.slice_id,
        segmentId: sm.segment_id,
        cabins: (sm.cabins || []).map((cabin: any) => ({
          deckType: cabin.deck || 'main',
          wings: cabin.wings || null,
          rows: (cabin.rows || []).map((row: any) => ({
            sectionNumber: row.sections?.[0]?.number || null,
            seats: (row.sections || []).flatMap((section: any) =>
              (section.elements || []).filter((el: any) => el.type === 'seat').map((seat: any) => ({
                id: seat.designator,
                designator: seat.designator,
                available: seat.available_services?.length > 0,
                type: seat.type || 'standard',
                disclosures: seat.disclosures || [],
                price: seat.available_services?.[0]?.total_amount || null,
                currency: seat.available_services?.[0]?.total_currency || null,
                serviceId: seat.available_services?.[0]?.id || null,
              }))
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

      const baggageServices = services.filter(s => s.type === 'baggage');
      const seatServices = services.filter(s => s.type === 'seat');
      const otherServices = services.filter(s => s.type !== 'baggage' && s.type !== 'seat');

      res.json({
        baggage: baggageServices,
        seats: seatServices,
        other: otherServices,
        all: services,
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
      if (booking.userId && (!user || user.id !== booking.userId)) {
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
      if (booking.userId && (!user || user.id !== booking.userId)) {
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
      if (booking.userId && (!user || user.id !== booking.userId)) {
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
              const [updated] = await db.update(bookings)
                .set({ status: 'confirmed', stripePaymentStatus: 'paid' })
                .where(eq(bookings.id, id))
                .returning();
              return res.json({ verified: true, status: 'confirmed', booking: updated });
            }
          } else if (paymentId.startsWith('pi_')) {
            const pi = await stripe.paymentIntents.retrieve(paymentId);
            if (pi.status === 'succeeded') {
              const [updated] = await db.update(bookings)
                .set({ status: 'confirmed', stripePaymentStatus: 'paid' })
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
  app.post('/api/admin/settings', requireAdmin, async (req, res) => {
    const updated = await storage.upsertSiteSettings(req.body);
    res.json(updated);
  });

  // Toggle Test Mode
  app.post('/api/admin/test-mode', requireAdmin, async (req, res) => {
    const { testMode } = req.body;
    if (typeof testMode !== 'boolean') {
      return res.status(400).json({ error: "testMode must be a boolean" });
    }

    if (!testMode && !hasLiveToken()) {
      return res.status(400).json({ 
        error: "Cannot disable test mode: no production token (DUFFEL_LIVE_TOKEN) is configured. Add a duffel_live_* token to your secrets first." 
      });
    }

    if (testMode && !hasTestToken()) {
      return res.status(400).json({ 
        error: "Cannot enable test mode: no test token (DUFFEL_API_TOKEN) is configured. Add a duffel_test_* token to your secrets first." 
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

    const modeLabel = testMode ? 'TEST' : 'PRODUCTION';
    console.log(`[MODE SWITCH] Switched to ${modeLabel} mode. Active token: ${activeTokenIsTest() ? 'test' : 'live'}`);

    res.json({ 
      testMode: updated.testMode, 
      activeTokenIsTest: activeTokenIsTest(),
      message: testMode ? "Test mode enabled - using test token" : "Production mode enabled - using live token" 
    });
  });

  // Public: check if test mode is active (for banner display)
  app.get('/api/test-mode', async (_req, res) => {
    const settings = await storage.getSiteSettings();
    const testModeActive = settings?.testMode ?? true;
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

  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return res.status(500).json({ error: "Admin password not configured on server" });
    }

    if (!password || password !== adminPassword) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

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
    res.json({ isAdmin: !!(req.session as any)?.isAdmin });
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
      const post = await storage.getBlogPost(req.params.slug);
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

  const SITE_URL = "https://michelstravel.com";

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
}
