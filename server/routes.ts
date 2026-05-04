import { webhookRouter } from './controllers/webhookController';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import { storage } from './storage';
import { stripeService } from './stripeService';
import { getUncachableStripeClient } from './stripeClient';
import { db } from "./db";
import { flightSearches, bookings, siteSettings, conversations, messages, seniorAlerts, insertFeaturedDealSchema, insertSiteSettingsSchema, type FlightSearchParams } from "@shared/schema";
import { customerProfiles, users } from "@shared/models/auth";
import { desc, eq, and, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
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
import { searchFlights, getFlight, searchPlaces, getAirlines, getAirports, getAircraft, initializeReferenceData, isTestMode, activeTokenIsTest, hasLiveToken, hasTestToken, setTestModeCache, clearReferenceDataCache, loadTestModeSetting, ensureTestModeLoaded, refreshOffer, catalogAvailableOffers } from "./services/duffel";
import { sendBookingConfirmationEmail, sendChatEscalationEmail } from "./services/emailService";
import {
  buildAgentLookupSummary,
  buildAgentSearchSummary,
  buildBookingNotFoundMessage,
  buildSearchErrorMessage,
  normalizeChatLanguage,
  parseAgentFallbackRequest,
} from "./services/chatbotFallback";
import {
  buildServiceAiFallback,
  buildServiceAiHistory,
  createServiceAiCompletionWithFallback,
  createServiceAiSession,
  createServiceAiStreamingCompletionWithFallback,
  getServiceAiClient,
  getServiceAiStatus,
  SERVICE_AI_AGENT_TOOLS,
} from "./services/serviceAi";
import {
  getMobileReleaseStatus,
  getPublicAppReleaseManifest,
  getStoredAppReleaseManifest,
  publishChannelRelease,
  verifyGitHubCommit,
} from "./services/mobileRelease";
import { buildOwnerDeskSnapshot } from "./services/ownerDesk";
import { buildRedactedDocumentPayload } from "./services/passengerPrivacy";
import { analyzeDocumentScanWithAi } from "./services/documentScannerAi";
import { getBalancedDeals, runDealsAutomation } from "./services/deals-automation";
import { ensureCustomerProfile, resolveCustomerMobileAuth } from "./routes/customer_mobile";

function parseIdRouteParam(value: string | string[] | undefined): string {
  const normalizedValue = Array.isArray(value) ? value[0] : value;
  return normalizedValue ?? "";
}

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

function isMobileConsumerRequest(req: Request) {
  const clientHeader = String(req.headers["x-michels-client"] || "").toLowerCase();
  return clientHeader === "mobile-consumer";
}

function getMobileAppAvailability(settings?: { testMode?: boolean | null; mobileAppTestEnabled?: boolean | null; mobileAppProductionEnabled?: boolean | null }) {
  const testModeActive = settings?.testMode ?? true;
  const environment = testModeActive ? "test" as const : "production" as const;
  const enabled = testModeActive
    ? settings?.mobileAppTestEnabled ?? true
    : settings?.mobileAppProductionEnabled ?? true;

  return {
    environment,
    enabled,
    testEnabled: settings?.mobileAppTestEnabled ?? true,
    productionEnabled: settings?.mobileAppProductionEnabled ?? true,
  };
}

/**
 * Register all application routes
 *
 * NOTE: The webhook route should be registered in index.ts BEFORE express.json()
 * This function registers the other Stripe routes and API routes that need parsed JSON
 */
export function registerRoutes(app: Express) {
  // Start the deals automation loop (every 6 hours)
  import('./services/deals-automation').then(mod => {
    mod.runDealsAutomation().catch(console.error);
    setInterval(() => {
      mod.runDealsAutomation().catch(console.error);
    }, 1000 * 60 * 60 * 6);
  });

  app.get('/atendimento', (_req, res) => {
    res.redirect(301, '/admin/live-chat');
  });

  app.get('/api/mobile/config', async (_req, res) => {
    const settings = await storage.getSiteSettings();
    const availability = getMobileAppAvailability(settings);

    res.json({
      environment: availability.environment,
      appEnabled: availability.enabled,
      appTestEnabled: availability.testEnabled,
      appProductionEnabled: availability.productionEnabled,
      sharedResultsApi: true,
      sharedCheckoutApi: true,
      supportEmail: process.env.SUPPORT_EMAIL || "support@michelstravel.agency",
      supportWhatsApp: process.env.WHATSAPP_NUMBER || null,
      heroTitle: settings?.heroTitle || null,
      heroSubtitle: settings?.heroSubtitle || null,
      promotionalBanner: settings?.promotionalBanner || null,
      mobileLayout: settings?.mobileLayout || null,
    });
  });

  app.get('/api/public/settings', async (_req, res) => {
    const settings = await storage.getSiteSettings();
    res.json({
      siteName: settings?.siteName || "Michels Travel",
      heroTitle: settings?.heroTitle || null,
      heroSubtitle: settings?.heroSubtitle || null,
      promotionalBanner: settings?.promotionalBanner || null,
      mobileLayout: settings?.mobileLayout || null,
    });
  });

  app.get('/api/app-release', async (_req, res) => {
    const settings = await storage.getSiteSettings();
    res.json(await getPublicAppReleaseManifest(settings));
  });

  app.use('/api', async (req, res, next) => {
    if (!isMobileConsumerRequest(req)) {
      return next();
    }

    if (req.path === '/mobile/config') {
      return next();
    }

    const settings = await storage.getSiteSettings();
    const availability = getMobileAppAvailability(settings);

    if (availability.enabled) {
      return next();
    }

    return res.status(503).json({
      error: `Mobile app access is disabled in ${availability.environment} mode.`,
      code: 'mobile_app_disabled',
      environment: availability.environment,
    });
  });

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

  app.post('/api/document-scanner/analyze', async (req, res) => {
    try {
      const {
        documentImageDataUrl,
        mrzImageDataUrl,
        rawOcrText,
        mrzResult,
        declaredDocumentType,
      } = req.body ?? {};

      if (!documentImageDataUrl || typeof documentImageDataUrl !== "string") {
        return res.status(400).json({ error: "documentImageDataUrl required" });
      }

      const analysis = await analyzeDocumentScanWithAi({
        documentImageDataUrl,
        mrzImageDataUrl: typeof mrzImageDataUrl === "string" ? mrzImageDataUrl : null,
        rawOcrText: typeof rawOcrText === "string" ? rawOcrText : null,
        mrzResult: mrzResult && typeof mrzResult === "object" ? mrzResult : null,
        declaredDocumentType: typeof declaredDocumentType === "string" ? declaredDocumentType : null,
      });

      res.json(analysis);
    } catch (error) {
      console.error("[DOCUMENT SCANNER] Analyze route failed:", error);
      res.status(500).json({ error: "Failed to analyze document" });
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
        nonStop: (req.query.nonStop === 'true') ? true : undefined,
      };

      if (tripType === 'multi-city' && legs) {
        try {
          searchParams.legs = JSON.parse(legs as string);
        } catch (e) {
          console.error('Failed to parse multi-city legs:', e);
        }
      }

      // Call Duffel Service (never throw to client)
      let flights: any[] = [];
      try {
        flights = await searchFlights(searchParams);
      } catch (err) {
        console.error("Flight search provider failed, returning empty list:", err);
        flights = [];
      }

      // Log search for SEO/Analytics
      if (origin && destination && date) {
        storage.createFlightSearch({
          origin: origin as string,
          destination: destination as string,
          departureDate: date as string,
          passengers: passengers ? parseInt(passengers as string) : 1,
          cabinClass: (cabinClass as string) || 'economy'
        }).catch(err => console.warn("createFlightSearch failed (ignored):", err));
      }

      let responseFlights = flights;
      try {
        responseFlights = await catalogAvailableOffers(responseFlights, { limit: 50 });
        const rate = await getCommissionRate();
        responseFlights = applyMarkupToFlights(responseFlights, rate);
      } catch (err) {
        console.warn("applyMarkup failed, returning raw flights:", err);
      }

      res.json(responseFlights);
    } catch (error) {
      console.error('Flight search error (graceful fallback to empty list):', error);
      res.json([]);
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

          const catalogedOffers = await catalogAvailableOffers(offers, { limit: 4 });

          if (catalogedOffers.length > 0) {
            const sorted = catalogedOffers.sort((a, b) => a.price - b.price);
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

  app.get('/api/external/currency', async (_req, res) => {
    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=BRL,EUR,GBP');
      if (!response.ok) throw new Error('Failed to fetch from Frankfurter');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Currency API error:", error);
      res.status(500).json({ error: "Failed to fetch live currency data" });
    }
  });

  app.get('/api/external/weather/:city', async (req, res) => {
    try {
      const { city } = req.params;
      const response = await fetch(`https://wttr.in/${city}?format=j1`);
      if (!response.ok) throw new Error('Failed to fetch from wttr.in');
      const data = await response.json();
      
      // Simplificar o retorno para o frontend
      const current = data.current_condition[0];
      const simplified = {
        temp: current.temp_C,
        condition: current.weatherDesc[0].value,
        humidity: current.humidity,
        feelsLike: current.FeelsLikeC,
        city: data.nearest_area[0].areaName[0].value
      };
      
      res.json(simplified);
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  app.get('/api/external/advisory/:country', async (req, res) => {
    try {
      const { country } = req.params;
      const response = await fetch(`https://www.travel-advisory.info/api?countrycode=${country}`);
      if (!response.ok) throw new Error('Failed to fetch from Travel Advisory');
      const data = await response.json();
      
      const info = data.data[country];
      res.json({
        score: info.advisory.score,
        message: info.advisory.message,
        updated: info.advisory.updated,
        source: info.advisory.source
      });
    } catch (error) {
      console.error("Advisory API error:", error);
      res.status(500).json({ error: "Failed to fetch advisory data" });
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
        const mobileAuth = await resolveCustomerMobileAuth(req);
        const webUser = (req as any).user;
        const resolvedUserId = webUser?.claims?.sub || webUser?.id || mobileAuth?.userId || null;
        const resolvedContactEmail = bookingData.contactEmail || mobileAuth?.email;
        const commissionRate = settings?.commissionPercentage ? parseFloat(settings.commissionPercentage) / 100 : 0.085;
        const requestedOfferId = typeof bookingData?.flightData?.id === "string" ? bookingData.flightData.id : null;

        if (!resolvedContactEmail) {
          return res.status(400).json({ error: "Contact email is required" });
        }

        if (requestedOfferId) {
          const refreshedOffer = await refreshOffer(requestedOfferId);
          if (!refreshedOffer.valid) {
            return res.status(409).json({
              error: "This fare is no longer available. Please search again.",
              code: "offer_unavailable",
            });
          }

          if (typeof refreshedOffer.price === "number" && Number.isFinite(refreshedOffer.price)) {
            const refreshedMarkedUpPrice = parseFloat((refreshedOffer.price * (1 + commissionRate)).toFixed(2));
            const requestedTotalPrice = parseFloat(bookingData.totalPrice);
            if (Number.isFinite(requestedTotalPrice) && Math.abs(refreshedMarkedUpPrice - requestedTotalPrice) > 0.01) {
              return res.status(409).json({
                error: "This fare changed before checkout. Please review the updated price.",
                code: "offer_price_changed",
                updatedPrice: refreshedMarkedUpPrice,
                currency: refreshedOffer.currency || bookingData.currency || "USD",
              });
            }
          }
        }

        const price = parseFloat(bookingData.totalPrice);
        if (isNaN(price)) {
          console.error("[BOOKING ERROR] Invalid totalPrice:", bookingData.totalPrice);
          return res.status(400).json({ error: "Invalid total price provided." });
        }

        const commissionAmount = (price * (commissionRate / (1 + commissionRate))).toFixed(2);
        
        if (commissionAmount === "NaN") {
           console.error("[BOOKING ERROR] Commission calculation resulted in NaN. price:", price, "rate:", commissionRate);
           return res.status(500).json({ error: "Financial calculation error. Please try again." });
        }

        const flightDataWithMode = {
            ...bookingData.flightData,
            _testMode: isTestModeActive,
        };

        const refCode = generateReferenceCode();
        console.log(`[BOOKING] Attempting to create booking ${refCode} for ${resolvedContactEmail}`);

        const [booking] = await db.insert(bookings).values({
            referenceCode: refCode,
            flightData: flightDataWithMode,
            passengerDetails: bookingData.passengerDetails || bookingData.passengers,
            totalPrice: price.toFixed(2),
            currency: bookingData.currency || 'USD',
            contactEmail: resolvedContactEmail,
            contactPhone: bookingData.contactPhone || null,
            commissionRate: commissionRate.toString(),
            commissionAmount: commissionAmount,
            status: 'pending',
            stripePaymentStatus: 'pending',
            userId: resolvedUserId ? String(resolvedUserId) : null
        }).returning();

        console.log(`[BOOKING] Successfully created booking ID ${booking.id} with ref ${refCode}`);

        // [TRAVEL INTELLIGENCE] Log the lifecycle event
        try {
          await storage.createBookingLog({
            bookingId: booking.id,
            event: 'created',
            message: `Booking created with reference ${refCode}`,
            metadata: { price, currency: booking.currency }
          });
        } catch (logErr) {
          console.error("[BOOKING WARNING] Failed to create booking log:", logErr);
        }

         if (resolvedUserId) {
           const passengerSummary = (bookingData.passengerDetails || bookingData.passengers || [])
             .map((p: any) => `${p.givenName || ''} ${p.familyName || ''}`.trim())
             .filter(Boolean)
             .join(', ');

          // [TRAVEL INTELLIGENCE] Update centralized CRM Customer profile
          try {
            await storage.createCustomer({
              userId: String(resolvedUserId),
              fullName: passengerSummary.split(',')[0], // Primary passenger
              email: resolvedContactEmail,
              phone: bookingData.contactPhone || null
            }).catch(() => { /* Silence duplicate visitorId unique constraint errors */ });

            await db
              .update(customerProfiles)
              .set({
                preferredAirport: flightDataWithMode.originCode || flightDataWithMode.origin || null,
                lastActiveBookingId: booking.id,
                lastActiveOfferId: requestedOfferId,
                savedPassengers: (bookingData.passengerDetails || bookingData.passengers || []).map((passenger: any) => ({
                  type: passenger.type,
                  givenName: passenger.givenName,
                  familyName: passenger.familyName,
                  bornOn: passenger.bornOn,
                  documentType: passenger.documentType,
                  nationality: passenger.nationality,
                })),
                updatedAt: new Date(),
              })
              .where(eq(customerProfiles.userId, String(resolvedUserId)));
          } catch (crmErr) {
            console.error("[BOOKING WARNING] Failed to update CRM customer profile:", crmErr);
          }
        }

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
          receipt_email: resolvedContactEmail || undefined,
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
            contactEmail: resolvedContactEmail || '',
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
        console.error(`[CRITICAL] Booking creation error [${isTestModeForLog ? 'TEST' : 'LIVE'} mode]:`, error);
        
        // Log more specifics about where it might have failed
        if (error.stack) {
          console.error("[CRITICAL] Error stack:", error.stack);
        }

        let userMessage: string;
        if (error?.type === 'StripeInvalidRequestError') {
          userMessage = `Payment service configuration error (${error.message}). Please contact support.`;
          console.error("[STRIPE ERROR] Invalid Request:", error.message);
        } else if (error?.type === 'StripeAuthenticationError') {
          userMessage = "Payment service authentication failed. Please contact support.";
        } else if (error?.message?.includes('No Stripe')) {
          userMessage = `Payment keys not configured for ${isTestModeForLog ? 'test' : 'live'} mode. Please contact support.`;
        } else if (error?.message?.includes('Stripe')) {
          userMessage = `Payment processing error: ${error.message}`;
        } else if (error?.code === '23505') { // Postgres Unique Violation
          userMessage = "A technical error occurred during booking. Please try one more time.";
          console.error("[DB ERROR] Unique constraint violation:", error.detail);
        } else {
          userMessage = `Failed to create booking: ${error.message || 'Unknown error'}. Please try again.`;
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

  const emailSentCache = new Set<string>();

  app.post('/api/bookings/:id/send-confirmation', async (req, res) => {
    try {
      const id = req.params.id as string;
      if (!id) return res.status(400).json({ error: "Invalid booking ID" });

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

      res.json({ sent: true, message: "Confirmation email sent." });
    } catch (error) {
      console.error("Confirmation email error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Get booking logs (public, for customers to see alerts)
  app.get('/api/bookings/:id/logs', async (req, res) => {
    try {
      const id = req.params.id as string;
      if (!id) return res.status(400).json({ error: "Invalid booking ID" });
      
      const logs = await storage.getBookingLogs(id);
      res.json(logs);
    } catch (error) {
      console.error("Booking logs error:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });


  // Get booking by ID (for confirmation page)
  app.get('/api/bookings/:id', async (req, res) => {
    try {
      const id = req.params.id as string;
      if (!id) {
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
      const { getSeatMaps } = await import('./services/duffel');
      const seatMaps = await getSeatMaps(req.params.offerId);
      if (!seatMaps || seatMaps.length === 0) {
        return res.json({ available: false, cabins: [], seatMaps: [] });
      }

      const seatMarkupRate = await getCommissionRate();
      const processed = seatMaps.map((sm: any) => ({
        segmentId: sm.segmentId,
        cabins: (sm.cabins || []).map((cabin: any) => ({
          cabinClass: cabin.cabinClass || 'economy',
          aisles: cabin.aisles || 1,
          wings: cabin.wings || null,
          rows: (cabin.rows || []).map((row: any) => ({
            sections: (row.sections || []).map((section: any) => ({
              elements: (section.elements || []).map((el: any) => {
                if (el.type === 'seat') {
                  const rawPrice = el.totalAmount || null;
                  return {
                    type: 'seat',
                    designator: el.designator || '',
                    name: el.name || undefined,
                    available: el.available ?? false,
                    disclosures: el.disclosures || [],
                    price: rawPrice && el.available ? parseFloat((parseFloat(rawPrice) * (1 + seatMarkupRate)).toFixed(2)).toString() : null,
                    currency: el.totalCurrency || null,
                    serviceId: el.serviceId || null,
                  };
                }
                return { type: el.type };
              }),
            })),
          })),
        })),
      }));

      res.json({ available: true, seatMaps: processed });
    } catch (error) {
      console.error("Seat map error:", error);
      res.json({ available: false, cabins: [], seatMaps: [] });
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

  // Booking-specific Seat Map & Services
  app.get('/api/bookings/:id/seat-map', async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking || !booking.duffelOrderId) {
        return res.status(404).json({ error: "Booking or Duffel order not found" });
      }

      const { getOrderSeatMaps } = await import('./services/duffel');
      const seatMaps = await getOrderSeatMaps(booking.duffelOrderId);
      
      const seatMarkupRate = await getCommissionRate();
      const processed = seatMaps.map((sm: any) => ({
        segmentId: sm.segmentId,
        cabins: (sm.cabins || []).map((cabin: any) => ({
          cabinClass: cabin.cabinClass || 'economy',
          aisles: cabin.aisles || 1,
          wings: cabin.wings || null,
          rows: (cabin.rows || []).map((row: any) => ({
            sections: (row.sections || []).map((section: any) => ({
              elements: (section.elements || []).map((el: any) => {
                if (el.type === 'seat') {
                  const rawPrice = el.totalAmount || null;
                  return {
                    type: 'seat',
                    designator: el.designator || '',
                    name: el.name || undefined,
                    available: el.available ?? false,
                    disclosures: el.disclosures || [],
                    price: rawPrice && el.available ? parseFloat((parseFloat(rawPrice) * (1 + seatMarkupRate)).toFixed(2)).toString() : null,
                    currency: el.totalCurrency || null,
                    serviceId: el.serviceId || null,
                  };
                }
                return { type: el.type };
              }),
            })),
          })),
        })),
      }));

      res.json({ available: true, seatMaps: processed });
    } catch (error) {
      console.error("Booking seat map error:", error);
      res.json({ available: false, seatMaps: [] });
    }
  });

  app.post('/api/bookings/:id/services', async (req, res) => {
    try {
      const { services, referenceCode, contactEmail } = req.body;
      const booking = await storage.getBooking(req.params.id);
      
      if (!booking || !booking.duffelOrderId) {
        return res.status(404).json({ error: "Booking or Duffel order not found" });
      }

      // Security check
      const user = (req as any).user;
      const hasValidRef = referenceCode && contactEmail && booking.referenceCode === referenceCode && booking.contactEmail === contactEmail;
      const hasValidUser = user && booking.userId && user.id === booking.userId;
      if (booking.userId && !hasValidUser && !hasValidRef) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { addOrderServices } = await import('./services/duffel');
      const success = await addOrderServices(booking.duffelOrderId, services);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to add services via Duffel" });
      }
    } catch (error) {
      console.error("Add services error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/bookings/:id/check-in', async (req, res) => {
    try {
      const { passengers, referenceCode, contactEmail } = req.body;
      const booking = await storage.getBooking(req.params.id);
      
      if (!booking || !booking.duffelOrderId) {
        return res.status(404).json({ error: "Booking or Duffel order not found" });
      }

      // Security check
      const user = (req as any).user;
      const hasValidRef = referenceCode && contactEmail && booking.referenceCode === referenceCode && booking.contactEmail === contactEmail;
      const hasValidUser = user && booking.userId && user.id === booking.userId;
      if (booking.userId && !hasValidUser && !hasValidRef) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { updateOrderPassengers } = await import('./services/duffel');
      const success = await updateOrderPassengers(booking.duffelOrderId, passengers);
      
      if (success) {
        // Update local booking status if needed
        await storage.updateBooking(booking.id, {
          passengerDetails: passengers,
        });

        res.json({ success: true, message: "Check-in realizado com sucesso!" });
      } else {
        res.status(500).json({ error: "Falha ao realizar check-in via Duffel" });
      }
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // === DESTINATION HIGHLIGHTS (Geoapify) ===
  const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || process.env.VITE_GEOAPIFY_API_KEY || "";

  async function fetchJson(url: string) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
    return await resp.json();
  }

  app.get('/api/destinations/highlights', async (req, res) => {
    try {
      if (!GEOAPIFY_API_KEY) {
        return res.status(500).json({ error: "Geoapify API key missing (set GEOAPIFY_API_KEY)" });
      }

      const {
        city = "",
        country = "us",
        lat,
        lon,
        radius = "20000",
        limit = "20",
        categories = "tourism.sights,tourism.attraction,tourism.museum,catering.restaurant,catering.cafe",
        lang = "en",
      } = req.query as Record<string, string>;

      let centerLat = lat ? parseFloat(lat) : null;
      let centerLon = lon ? parseFloat(lon) : null;

      // Geocode city if lat/lon not provided
      if ((!centerLat || !centerLon) && city) {
        const geoUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
          city,
        )}&lang=${lang}&filter=countrycode:${country}&limit=1&apiKey=${GEOAPIFY_API_KEY}`;
        const geo = await fetchJson(geoUrl);
        const feature = geo?.features?.[0];
        if (feature?.properties?.lat && feature?.properties?.lon) {
          centerLat = feature.properties.lat;
          centerLon = feature.properties.lon;
        }
      }

      if (!centerLat || !centerLon) {
        return res.status(400).json({ error: "Provide lat/lon or a valid city" });
      }

      const placesUrl = `https://api.geoapify.com/v2/places?categories=${encodeURIComponent(
        categories,
      )}&filter=circle:${centerLon},${centerLat},${radius}&bias=proximity:${centerLon},${centerLat}&lang=${lang}&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`;

      const data = await fetchJson(placesUrl);
      let items =
        data?.features?.map((f: any) => ({
          id: f.properties.place_id || f.properties.osm_id,
          name: f.properties.name || f.properties.address_line1,
          category: f.properties.categories,
          address: f.properties.formatted,
          city: f.properties.city || f.properties.county,
          country: f.properties.country,
          lat: f.properties.lat,
          lon: f.properties.lon,
          website: f.properties.website,
          wikipedia: f.properties.datasource?.raw?.wikipedia,
          rating: f.properties.rank || null,
          kinds: f.properties.kinds || null,
          distance_m: f.properties.distance || null,
        })) || [];

      // Fallback for curated cities if results are empty
      if (items.length === 0) {
        if (city.toLowerCase().includes("lisboa") || city.toLowerCase().includes("lisbon")) {
          items = [
            { id: 'l1', name: 'Torre de Belém', address: 'Av. Brasília, 1400-038 Lisboa', distance_m: 500, category: ['tourism.sight'] },
            { id: 'l2', name: 'Castelo de S. Jorge', address: 'R. de Santa Cruz do Castelo, 1100-129 Lisboa', distance_m: 1200, category: ['tourism.sight'] },
            { id: 'l3', name: 'Mosteiro dos Jerónimos', address: 'Praça do Império 1400-206 Lisboa', distance_m: 800, category: ['tourism.sight'] },
          ];
        } else if (city.toLowerCase().includes("são paulo") || city.toLowerCase().includes("sao paulo")) {
          items = [
            { id: 'sp1', name: 'Museu de Arte de São Paulo (MASP)', address: 'Av. Paulista, 1578 - Bela Vista', distance_m: 100, category: ['tourism.museum'] },
            { id: 'sp2', name: 'Parque Ibirapuera', address: 'Av. Pedro Álvares Cabral - Vila Mariana', distance_m: 3000, category: ['tourism.sight'] },
            { id: 'sp3', name: 'Mercado Municipal de São Paulo', address: 'R. Cantareira, 306 - Centro Histórico', distance_m: 4500, category: ['tourism.sight'] },
          ];
        } else if (city.toLowerCase().includes("orlando")) {
          items = [
            { id: 'orl1', name: 'Magic Kingdom Park', address: 'Walt Disney World Resort, Orlando, FL', distance_m: 5000, category: ['tourism.attraction'] },
            { id: 'orl2', name: 'Universal Studios Florida', address: 'Universal Blvd, Orlando, FL', distance_m: 8000, category: ['tourism.attraction'] },
            { id: 'orl3', name: 'Icon Park', address: 'International Dr, Orlando, FL', distance_m: 2000, category: ['tourism.sight'] },
          ];
        }
      }

      res.json({ center: { lat: centerLat, lon: centerLon }, total: items.length, items });
    } catch (error: any) {
      console.error("destinations/highlights error:", error?.message || error);
      
      // Critical fallback even on error
      const mockItems = [
        { id: 'mock1', name: 'Ponto de Interesse Local', address: 'Consulte o nosso guia para detalhes', distance_m: 0, category: ['tourism.sight'] },
        { id: 'mock2', name: 'Experiência Recomenda', address: 'Dica exclusiva Michels Travel', distance_m: 0, category: ['tourism.sight'] },
      ];
      res.json({ center: { lat: 0, lon: 0 }, total: mockItems.length, items: mockItems });
    }
  });

  app.post('/api/bookings/:id/cancel', async (req, res) => {
    try {
      const id = req.params.id as string;
      if (!id) return res.status(400).json({ error: "Invalid booking ID" });

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
      const id = req.params.id as string;
      if (!id) return res.status(400).json({ error: "Invalid booking ID" });

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

  app.post('/api/bookings/:id/sync', async (req, res) => {
    try {
      const id = req.params.id as string;
      if (!id) return res.status(400).json({ error: "Invalid booking ID" });

      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const duffelOrderId = (booking as any).duffelOrderId || (booking.flightData as any)?.duffelOrderId;
      if (!duffelOrderId) {
        return res.status(400).json({ error: "No Duffel order linked to this booking" });
      }

      const { syncDuffelOrder } = await import('./services/duffel');
      const syncResult = await syncDuffelOrder(duffelOrderId);

      if (!syncResult.synced) {
        return res.status(500).json({ error: "Failed to sync with Duffel" });
      }

      const updates: Record<string, any> = {};
      if (syncResult.bookingReference) {
        updates.duffelBookingReference = syncResult.bookingReference;
      }
      if (syncResult.ticketNumbers && syncResult.ticketNumbers.length > 0) {
        updates.ticketNumber = syncResult.ticketNumbers.join(', ');
        updates.ticketStatus = 'issued';
      }
      if (syncResult.status === 'cancelled') {
        updates.ticketStatus = 'cancelled';
      }
      if (syncResult.airlineInitiatedChanges && syncResult.airlineInitiatedChanges.length > 0) {
        updates.airlineInitiatedChanges = syncResult.airlineInitiatedChanges;
        if (!updates.ticketStatus || updates.ticketStatus === 'issued') {
          updates.ticketStatus = 'schedule_changed';
        }
      }
      updates.lastDuffelWebhookAt = new Date();

      if (Object.keys(updates).length > 0) {
        await db.update(bookings)
          .set(updates)
          .where(eq(bookings.id, id));

        // [TRAVEL INTELLIGENCE] Log sync events
        if (updates.ticketStatus === 'issued') {
          await storage.createBookingLog({
            bookingId: id,
            event: 'issued',
            message: `Tickets issued: ${updates.ticketNumber}`,
            metadata: { duffelOrderId }
          });
        } else {
          await storage.createBookingLog({
            bookingId: id,
            event: 'synced',
            message: 'Booking synchronized with Duffel',
            metadata: updates
          });
        }
      }

      const updatedBooking = await storage.getBooking(id);
      res.json({
        synced: true,
        booking: updatedBooking,
        duffelStatus: syncResult.status,
        availableActions: syncResult.availableActions,
        conditions: syncResult.conditions,
        documents: syncResult.documents,
        paymentStatus: syncResult.paymentStatus,
      });
    } catch (error) {
      console.error("Booking sync error:", error);
      res.status(500).json({ error: "Failed to sync booking" });
    }
  });

  app.post('/api/bookings/:id/change-request', async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const id = req.params.id as string;
      if (!id) return res.status(400).json({ error: "Invalid booking ID" });

      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const userId = user.claims?.sub;
      const isAdmin = (req.session as any)?.isAdmin;
      if (!isAdmin && (!userId || booking.userId !== userId)) {
        return res.status(403).json({ error: "Access denied - you do not own this booking" });
      }

      const duffelOrderId = (booking as any).duffelOrderId || (booking.flightData as any)?.duffelOrderId;
      if (!duffelOrderId) {
        return res.status(400).json({ error: "No Duffel order linked - cannot change" });
      }

      const { slicesToRemove, slicesToAdd } = req.body;
      if (!slicesToRemove || !slicesToAdd) {
        return res.status(400).json({ error: "slicesToRemove and slicesToAdd are required" });
      }

      const { createOrderChangeRequest } = await import('./services/duffel');
      const result = await createOrderChangeRequest(duffelOrderId, slicesToRemove, slicesToAdd);

      if (!result) {
        return res.status(500).json({ error: "Failed to create change request with airline" });
      }

      res.json({
        changeRequestId: result.id,
        changeOffers: result.changeOffers,
      });
    } catch (error) {
      console.error("Order change request error:", error);
      res.status(500).json({ error: "Failed to create change request" });
    }
  });

  app.post('/api/bookings/:id/confirm-change', async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const id = req.params.id as string;
      if (!id) return res.status(400).json({ error: "Invalid booking ID" });

      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const userId = user.claims?.sub;
      const isAdmin = (req.session as any)?.isAdmin;
      if (!isAdmin && (!userId || booking.userId !== userId)) {
        return res.status(403).json({ error: "Access denied - you do not own this booking" });
      }

      const { orderChangeOfferId } = req.body;
      if (!orderChangeOfferId) {
        return res.status(400).json({ error: "orderChangeOfferId is required" });
      }

      const { confirmOrderChange } = await import('./services/duffel');
      const success = await confirmOrderChange(orderChangeOfferId);

      if (!success) {
        return res.status(500).json({ error: "Failed to confirm flight change" });
      }

      const duffelOrderId = (booking as any).duffelOrderId || (booking.flightData as any)?.duffelOrderId;
      if (duffelOrderId) {
        const { syncDuffelOrder } = await import('./services/duffel');
        const syncResult = await syncDuffelOrder(duffelOrderId);
        if (syncResult.synced && syncResult.bookingReference) {
          await db.update(bookings)
            .set({ duffelBookingReference: syncResult.bookingReference, lastDuffelWebhookAt: new Date() })
            .where(eq(bookings.id, id));
        }
      }

      res.json({ success: true, message: "Flight change confirmed" });
    } catch (error) {
      console.error("Confirm order change error:", error);
      res.status(500).json({ error: "Failed to confirm flight change" });
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
        firstName: (fullUser.displayName || '').split(' ')[0] || '',
        lastName: (fullUser.displayName || '').split(' ').slice(1).join(' ') || '',
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
        firstName: (updated.displayName || '').split(' ')[0] || '',
        lastName: (updated.displayName || '').split(' ').slice(1).join(' ') || '',
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
      const id = req.params.id as string;
      if (!id) return res.status(400).json({ error: "Invalid booking ID" });

      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const user = (req as any).user;
      const mobileAuth = await resolveCustomerMobileAuth(req);
      const { referenceCode, contactEmail } = req.body || {};
      const hasValidRef = referenceCode && contactEmail && booking.referenceCode === referenceCode && booking.contactEmail === contactEmail;
      const resolvedUserId = user?.claims?.sub || user?.id || mobileAuth?.userId || null;
      const hasValidUser = resolvedUserId && booking.userId && resolvedUserId === booking.userId;
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

          let paymentSucceeded = false;
          let receiptUrl = booking.stripeReceiptUrl;

          if (paymentId.startsWith('cs_')) {
            const session = await stripe.checkout.sessions.retrieve(paymentId);
            if (session.payment_status === 'paid') {
              paymentSucceeded = true;
              if (!receiptUrl && session.payment_intent) {
                try {
                  const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string, { expand: ['latest_charge'] });
                  receiptUrl = (pi.latest_charge as any)?.receipt_url || null;
                } catch {}
              }
            }
          } else if (paymentId.startsWith('pi_')) {
            const pi = await stripe.paymentIntents.retrieve(paymentId, { expand: ['latest_charge'] });
            if (pi.status === 'succeeded') {
              paymentSucceeded = true;
              receiptUrl = receiptUrl || (pi.latest_charge as any)?.receipt_url || null;
            }
          }

          if (paymentSucceeded) {
            // Check if we need to create Duffel order
            let duffelOrderId = booking.duffelOrderId;
            let duffelRef = booking.duffelBookingReference;

            if (!duffelOrderId) {
              try {
                const { createDuffelOrder } = await import('./services/duffel');
                const flightData = booking.flightData as any;
                const passengerDetails = (booking.passengerDetails as any[]) || [];
                
                // Construct Duffel passengers with IDs from the offer
                const offerPassengers = flightData.passengers || [];
                const duffelPassengers = passengerDetails.map((pax, idx) => {
                  // Link to offer passenger ID by index if not provided
                  const offerPaxId = pax.passengerId || offerPassengers[idx]?.id;
                  return {
                    passengerId: offerPaxId,
                    givenName: pax.givenName,
                    familyName: pax.familyName,
                    bornOn: pax.bornOn,
                    gender: pax.gender,
                    email: pax.email || booking.contactEmail,
                    phoneNumber: pax.phoneNumber || booking.contactPhone || "",
                    type: pax.type || "adult",
                    title: pax.title,
                    documentNumber: pax.documentNumber || pax.passportNumber,
                  } as any;
                });

                const orderResult = await createDuffelOrder(
                  flightData.id,
                  duffelPassengers
                );

                if (orderResult) {
                  duffelOrderId = orderResult.orderId;
                  duffelRef = orderResult.bookingReference;
                  
                  await storage.createBookingLog({
                    bookingId: id,
                    event: 'order_created',
                    message: `Duffel order created: ${duffelOrderId} (Ref: ${duffelRef})`,
                    metadata: { duffelOrderId, duffelRef }
                  });
                }
              } catch (duffelErr) {
                console.error('Failed to create Duffel order after payment:', duffelErr);
                // We DON'T fail the request here, but the booking will stay in 'confirmed' status
                // and an admin will have to MANUALLY book it if Duffel failed.
              }
            }

            const [updated] = await db.update(bookings)
              .set({ 
                status: 'confirmed', 
                stripePaymentStatus: 'paid',
                duffelOrderId: duffelOrderId || undefined,
                duffelBookingReference: duffelRef || undefined,
                ...(receiptUrl ? { stripeReceiptUrl: receiptUrl } : {}),
              })
              .where(eq(bookings.id, id))
              .returning();
            
            return res.json({ verified: true, status: 'confirmed', booking: updated });
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
      const id = req.params.id as string;
      if (!id) return res.status(400).json({ error: "Invalid booking ID" });

      const booking = await storage.getBooking(id);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const user = (req as any).user;
      const mobileAuth = await resolveCustomerMobileAuth(req);
      const resolvedUserId = user?.claims?.sub || user?.id || mobileAuth?.userId || null;
      if (booking.userId && resolvedUserId !== booking.userId) {
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
    try {
      const allBookings = await db.select().from(bookings);
      const totalBookings = allBookings.length;
      const totalRevenue = allBookings.reduce((acc, b) => acc + Number(b.totalPrice || 0), 0);
      const totalCommission = allBookings.reduce((acc, b) => acc + (Number(b.commissionAmount) || 0), 0);

      const recentSearches = await db.select().from(flightSearches).limit(500);

      const statusBreakdown: Record<string, number> = {};
      const ticketStatusBreakdown: Record<string, number> = {};
      allBookings.forEach(b => {
        const st = b.status || 'unknown';
        statusBreakdown[st] = (statusBreakdown[st] || 0) + 1;
        const ts = (b as any).ticketStatus || 'pending';
        ticketStatusBreakdown[ts] = (ticketStatusBreakdown[ts] || 0) + 1;
      });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todayBookings = allBookings.filter(b => b.createdAt && new Date(b.createdAt) >= today);
      const week7Bookings = allBookings.filter(b => b.createdAt && new Date(b.createdAt) >= last7Days);
      const month30Bookings = allBookings.filter(b => b.createdAt && new Date(b.createdAt) >= last30Days);

      const revenueToday = todayBookings.reduce((a, b) => a + Number(b.totalPrice || 0), 0);
      const revenue7Days = week7Bookings.reduce((a, b) => a + Number(b.totalPrice || 0), 0);
      const revenue30Days = month30Bookings.reduce((a, b) => a + Number(b.totalPrice || 0), 0);

      const dailyRevenue: Array<{ date: string; revenue: number; bookings: number; commission: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const dayBookings = allBookings.filter(b => {
          const d = b.createdAt ? new Date(b.createdAt) : null;
          return d && d >= dayStart && d < dayEnd;
        });
        dailyRevenue.push({
          date: dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          revenue: dayBookings.reduce((a, b) => a + Number(b.totalPrice || 0), 0),
          bookings: dayBookings.length,
          commission: dayBookings.reduce((a, b) => a + Number(b.commissionAmount || 0), 0),
        });
      }

      const topRoutes: Record<string, { count: number; revenue: number }> = {};
      allBookings.forEach(b => {
        const fd = b.flightData as any;
        if (fd?.origin && fd?.destination) {
          const route = `${fd.origin}-${fd.destination}`;
          if (!topRoutes[route]) topRoutes[route] = { count: 0, revenue: 0 };
          topRoutes[route].count++;
          topRoutes[route].revenue += Number(b.totalPrice || 0);
        }
      });
      const topRoutesArr = Object.entries(topRoutes)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([route, data]) => ({ route, ...data }));

      const pendingPayments = allBookings.filter(b => b.status === 'pending' || b.status === 'payment_pending').length;
      const confirmedBookings = allBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
      const cancelledBookings = allBookings.filter(b => b.status === 'cancelled').length;

      const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

      const searchesToday = recentSearches.filter(s => s.lastSearchedAt && new Date(s.lastSearchedAt) >= today).length;

      res.json({
        totalBookings,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        recentSearches: recentSearches.length,
        searchesToday,
        revenueToday: Math.round(revenueToday * 100) / 100,
        revenue7Days: Math.round(revenue7Days * 100) / 100,
        revenue30Days: Math.round(revenue30Days * 100) / 100,
        bookingsToday: todayBookings.length,
        bookings7Days: week7Bookings.length,
        bookings30Days: month30Bookings.length,
        statusBreakdown,
        ticketStatusBreakdown,
        dailyRevenue,
        topRoutes: topRoutesArr,
        pendingPayments,
        confirmedBookings,
        cancelledBookings,
        avgBookingValue,
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to compute stats" });
    }
  });

  app.get('/api/admin/command-center', requireAdmin, async (_req, res) => {
    try {
      const [
        allBookings,
        searchRows,
        liveRequests,
        activeLiveSessions,
        inboxThreads,
        unreadInboxCount,
        escalations,
        deals,
        publishedPosts,
        settings,
      ] = await Promise.all([
        db.select().from(bookings).orderBy(desc(bookings.createdAt)),
        db.select().from(flightSearches).limit(1000),
        storage.getLiveSessionRequests(),
        storage.getActiveLiveSessions(),
        storage.getAllInternalThreads(),
        storage.getUnreadCountForAdmin(),
        storage.getAllVoiceEscalations(),
        storage.getFeaturedDeals(),
        storage.getBlogPosts(),
        storage.getSiteSettings(),
      ]);

      const numberValue = (value: unknown) => Number(value || 0);
      const normalizeRoute = (origin?: string | null, destination?: string | null) => {
        if (!origin || !destination) return null;
        return `${origin}`.trim().toUpperCase() + "-" + `${destination}`.trim().toUpperCase();
      };
      const describeRoute = (routeKey: string) => routeKey.replace("-", " → ");
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todayBookings = allBookings.filter((booking) => booking.createdAt && new Date(booking.createdAt) >= today);
      const weekBookings = allBookings.filter((booking) => booking.createdAt && new Date(booking.createdAt) >= last7Days);
      const monthSearches = searchRows.filter((search) => search.lastSearchedAt && new Date(search.lastSearchedAt) >= last30Days);
      const todaySearches = searchRows.filter((search) => search.lastSearchedAt && new Date(search.lastSearchedAt) >= today);

      const revenueToday = todayBookings.reduce((sum, booking) => sum + numberValue(booking.totalPrice), 0);
      const revenue7Days = weekBookings.reduce((sum, booking) => sum + numberValue(booking.totalPrice), 0);
      const avgBookingValue = allBookings.length > 0
        ? Math.round((allBookings.reduce((sum, booking) => sum + numberValue(booking.totalPrice), 0) / allBookings.length) * 100) / 100
        : 0;

      const pendingBookings = allBookings.filter((booking) => ["pending", "payment_pending"].includes(booking.status || ""));
      const ticketIssueBookings = allBookings.filter((booking) =>
        ["failed", "cancelled", "schedule_changed"].includes((booking.ticketStatus || "").toLowerCase())
      );
      const confirmationBacklog = allBookings.filter((booking) =>
        ["confirmed", "completed"].includes(booking.status || "") && !booking.confirmationEmailSent
      );
      const atRiskRevenue = [...pendingBookings, ...ticketIssueBookings].reduce((sum, booking) => sum + numberValue(booking.totalPrice), 0);

      const routeDemand = new Map<string, {
        route: string;
        searches: number;
        bookings: number;
        revenue: number;
        isPromoted: boolean;
      }>();

      for (const search of monthSearches) {
        const routeKey = normalizeRoute(search.origin, search.destination);
        if (!routeKey) continue;
        const existing = routeDemand.get(routeKey) || {
          route: describeRoute(routeKey),
          searches: 0,
          bookings: 0,
          revenue: 0,
          isPromoted: false,
        };
        existing.searches += search.searchCount || 1;
        routeDemand.set(routeKey, existing);
      }

      for (const booking of allBookings) {
        const flightData = booking.flightData as any;
        const routeKey = normalizeRoute(flightData?.origin, flightData?.destination);
        if (!routeKey) continue;
        const existing = routeDemand.get(routeKey) || {
          route: describeRoute(routeKey),
          searches: 0,
          bookings: 0,
          revenue: 0,
          isPromoted: false,
        };
        existing.bookings += 1;
        existing.revenue += numberValue(booking.totalPrice);
        routeDemand.set(routeKey, existing);
      }

      const promotedRoutes = new Set(
        deals
          .filter((deal) => deal.isActive)
          .map((deal) => normalizeRoute(deal.origin, deal.destination))
          .filter((route): route is string => Boolean(route))
      );

      const demandRoutes = Array.from(routeDemand.entries())
        .map(([routeKey, entry]) => ({
          ...entry,
          routeKey,
          isPromoted: promotedRoutes.has(routeKey),
        }))
        .sort((left, right) => {
          const leftScore = (left.searches * 2) + left.bookings;
          const rightScore = (right.searches * 2) + right.bookings;
          return rightScore - leftScore;
        });

      const opportunityRoutes = demandRoutes.filter((route) => !route.isPromoted).slice(0, 5);

      const urgentBookings = allBookings
        .map((booking) => {
          const flightData = booking.flightData as any;
          const createdAt = booking.createdAt ? new Date(booking.createdAt) : null;
          const ageHours = createdAt ? Math.max(0, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)) : 0;
          const ticketStatus = (booking.ticketStatus || "pending").toLowerCase();
          let urgency = 0;
          let reason = "Needs review";

          if (ticketStatus === "failed") {
            urgency = 100;
            reason = "Ticketing failed";
          } else if (ticketStatus === "cancelled") {
            urgency = 95;
            reason = "Ticket cancelled";
          } else if (ticketStatus === "schedule_changed") {
            urgency = 88;
            reason = "Airline schedule changed";
          } else if (booking.status === "payment_pending") {
            urgency = 76;
            reason = "Payment follow-up needed";
          } else if (booking.status === "pending") {
            urgency = ageHours >= 12 ? 72 : 58;
            reason = ageHours >= 12 ? "Pending for more than 12h" : "Pending confirmation";
          } else if (["confirmed", "completed"].includes(booking.status || "") && !booking.confirmationEmailSent) {
            urgency = 52;
            reason = "Confirmation email still pending";
          }

          if (numberValue(booking.totalPrice) >= 1200) {
            urgency += 6;
          }

          return {
            id: booking.id,
            referenceCode: booking.referenceCode,
            contactEmail: booking.contactEmail,
            contactPhone: booking.contactPhone,
            route: normalizeRoute(flightData?.origin, flightData?.destination)
              ? describeRoute(normalizeRoute(flightData?.origin, flightData?.destination)!)
              : "Route pending",
            status: booking.status || "pending",
            ticketStatus: booking.ticketStatus || "pending",
            totalPrice: numberValue(booking.totalPrice),
            currency: booking.currency || "USD",
            urgency,
            reason,
            createdAt: booking.createdAt,
          };
        })
        .filter((booking) => booking.urgency >= 52)
        .sort((left, right) => right.urgency - left.urgency || right.totalPrice - left.totalPrice)
        .slice(0, 6);

      const openEscalations = escalations.filter((escalation) => escalation.status !== "resolved");
      const inboxPriorityThreads = inboxThreads
        .filter((thread) => thread.status === "open" || Number(thread.unreadCount || 0) > 0)
        .sort((left, right) => Number(right.unreadCount || 0) - Number(left.unreadCount || 0))
        .slice(0, 8)
        .map((thread) => ({
          id: thread.id,
          subject: thread.subject,
          status: thread.status,
          userName: (thread.userName || thread.userName || 'Unknown'),
          userEmail: thread.userEmail || null,
          unreadCount: Number(thread.unreadCount || 0),
          lastMessageAt: thread.lastMessageAt,
        }));

      const recentWins = allBookings
        .filter((booking) =>
          ["confirmed", "completed"].includes(booking.status || "") &&
          booking.createdAt &&
          new Date(booking.createdAt) >= last30Days
        )
        .sort((left, right) => numberValue(right.totalPrice) - numberValue(left.totalPrice))
        .slice(0, 4)
        .map((booking) => {
          const flightData = booking.flightData as any;
          const routeKey = normalizeRoute(flightData?.origin, flightData?.destination);
          return {
            id: booking.id,
            referenceCode: booking.referenceCode,
            contactEmail: booking.contactEmail,
            route: routeKey ? describeRoute(routeKey) : "Route pending",
            totalPrice: numberValue(booking.totalPrice),
            currency: booking.currency || "USD",
            createdAt: booking.createdAt,
          };
        });

      const recommendedActions: Array<{
        id: string;
        level: "critical" | "attention" | "growth";
        title: string;
        description: string;
        action: "open-live-chat" | "open-bookings" | "focus-inbox" | "open-settings";
        actionLabel: string;
      }> = [];

      if (liveRequests.length > 0) {
        recommendedActions.push({
          id: "live-queue",
          level: "critical",
          title: "Live help queue waiting",
          description: `${liveRequests.length} traveler${liveRequests.length === 1 ? "" : "s"} asked for a human agent right now.`,
          action: "open-live-chat",
          actionLabel: "Open live desk",
        });
      }

      if (urgentBookings.length > 0) {
        recommendedActions.push({
          id: "booking-risk",
          level: "critical",
          title: "Revenue rescue board is active",
          description: `${urgentBookings.length} booking${urgentBookings.length === 1 ? "" : "s"} need attention and $${atRiskRevenue.toFixed(2)} is exposed.`,
          action: "open-bookings",
          actionLabel: "Review bookings",
        });
      }

      if (unreadInboxCount > 0) {
        recommendedActions.push({
          id: "inbox-backlog",
          level: "attention",
          title: "Customers are waiting in inbox",
          description: `${unreadInboxCount} unread message${unreadInboxCount === 1 ? "" : "s"} need a response.`,
          action: "focus-inbox",
          actionLabel: "Reply now",
        });
      }

      if (opportunityRoutes.length > 0) {
        recommendedActions.push({
          id: "demand-gap",
          level: "growth",
          title: "Search demand is not promoted yet",
          description: `${opportunityRoutes[0].route} is getting attention without an active deal or dedicated push.`,
          action: "open-settings",
          actionLabel: "Open growth controls",
        });
      }

      const activeDealsCount = deals.filter((deal) => deal.isActive).length;
      const healthPenalty =
        (liveRequests.length * 12) +
        (openEscalations.length * 10) +
        (urgentBookings.length * 7) +
        Math.min(unreadInboxCount * 2, 12);
      const healthScore = Math.max(24, 100 - healthPenalty);
      const healthLevel = healthScore >= 82 ? "strong" : healthScore >= 62 ? "watch" : "critical";

      const shiftBriefLines = [
        `Mission status: ${healthLevel}.`,
        `Today there were ${todayBookings.length} booking${todayBookings.length === 1 ? "" : "s"} worth $${revenueToday.toFixed(2)} and ${todaySearches.length} search${todaySearches.length === 1 ? "" : "es"}.`,
        `${pendingBookings.length} pending booking${pendingBookings.length === 1 ? "" : "s"}, ${ticketIssueBookings.length} with ticket issues, ${liveRequests.length} live request${liveRequests.length === 1 ? "" : "s"}, ${openEscalations.length} open escalation${openEscalations.length === 1 ? "" : "s"}.`,
        `${unreadInboxCount} unread inbox message${unreadInboxCount === 1 ? "" : "s"} and ${activeLiveSessions.length} active live session${activeLiveSessions.length === 1 ? "" : "s"}.`,
        opportunityRoutes.length > 0
          ? `Growth gap: ${opportunityRoutes[0].route} is being searched but is not promoted yet.`
          : `Growth is covered by ${activeDealsCount} active deal${activeDealsCount === 1 ? "" : "s"} and ${publishedPosts.length} published guide post${publishedPosts.length === 1 ? "" : "s"}.`,
      ];

      res.json({
        generatedAt: now.toISOString(),
        health: {
          score: healthScore,
          level: healthLevel,
          headline: healthLevel === "strong"
            ? "Operation stable and ready to scale"
            : healthLevel === "watch"
              ? "Some queues need attention"
              : "Immediate service recovery recommended",
          summary: shiftBriefLines[1],
        },
        mission: {
          siteName: settings?.siteName || "Michels Travel",
          testMode: settings?.testMode ?? true,
        },
        counters: {
          pendingBookings: pendingBookings.length,
          ticketIssues: ticketIssueBookings.length,
          confirmationBacklog: confirmationBacklog.length,
          liveRequests: liveRequests.length,
          activeLiveSessions: activeLiveSessions.length,
          openEscalations: openEscalations.length,
          unreadInboxMessages: unreadInboxCount,
          openInboxThreads: inboxPriorityThreads.length,
          activeDeals: activeDealsCount,
          publishedPosts: publishedPosts.length,
          todayBookings: todayBookings.length,
          todaySearches: todaySearches.length,
        },
        revenue: {
          today: Math.round(revenueToday * 100) / 100,
          last7Days: Math.round(revenue7Days * 100) / 100,
          atRisk: Math.round(atRiskRevenue * 100) / 100,
          avgBookingValue,
        },
        urgentBookings,
        liveRequests: liveRequests.slice(0, 6),
        activeLiveSessions: activeLiveSessions.slice(0, 6),
        inboxThreads: inboxPriorityThreads,
        escalations: openEscalations.slice(0, 6),
        opportunityRoutes,
        recentWins,
        recommendedActions,
        shiftBrief: shiftBriefLines.join(" "),
      });
    } catch (error) {
      console.error("Admin command center error:", error);
      res.status(500).json({ error: "Failed to build admin command center" });
    }
  });

  // Lightweight system health snapshot (for admin "painel elétrico")
  app.get('/api/admin/system-health', requireAdmin, (_req, res) => {
    try {
      const mem = process.memoryUsage();
      const uptimeSec = process.uptime();
      const now = new Date().toISOString();
      res.json({
        timestamp: now,
        uptimeSec,
        nodeVersion: process.version,
        env: process.env.NODE_ENV || "development",
        memory: {
          rss: mem.rss,
          heapTotal: mem.heapTotal,
          heapUsed: mem.heapUsed,
          external: mem.external,
        },
      });
    } catch (error: any) {
      console.error("system-health error:", error?.message || error);
      res.status(500).json({ error: "Could not compute system health" });
    }
  });

  app.get('/api/admin/owner-desk', requireAdmin, async (_req, res) => {
    try {
      const snapshot = await buildOwnerDeskSnapshot();
      res.json(snapshot);
    } catch (error) {
      console.error("Owner desk error:", error);
      res.status(500).json({ error: "Failed to build owner desk" });
    }
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
        mobileAppTestEnabled: true,
        mobileAppProductionEnabled: true,
        updatedAt: new Date(),
      });
    }
    res.json(settings);
  });

  // Update Admin Settings
  app.post('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
      // Law 14: Strict validation of incoming settings
      const validatedData = insertSiteSettingsSchema.parse(req.body);
      const updated = await storage.upsertSiteSettings(validatedData);
      res.json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid settings data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get('/api/admin/mobile-release/status', requireAdmin, async (req, res) => {
    try {
      const channel = req.query.channel === "admin" ? "admin" : "senior";
      const settings = await storage.getSiteSettings();
      res.json(await getMobileReleaseStatus(channel, settings));
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to load mobile release status" });
    }
  });

  app.get('/api/admin/mobile-release/verify', requireAdmin, async (req, res) => {
    try {
      const commitHash = String(req.query.commit || "");
      const channel = req.query.channel === "admin" ? "admin" : "senior";
      const settings = await storage.getSiteSettings();
      const status = await getMobileReleaseStatus(channel, settings);
      const commit = await verifyGitHubCommit(commitHash);

      res.json({
        ...status,
        commit,
      });
    } catch (error: any) {
      res.status(400).json({ error: error?.message || "Failed to verify commit" });
    }
  });

  app.post('/api/admin/mobile-release/publish', requireAdmin, async (req, res) => {
    try {
      const channel = req.body?.channel === "admin" ? "admin" : "senior";
      const commitHash = String(req.body?.commitHash || "").trim();

      if (!commitHash) {
        return res.status(400).json({ error: "commitHash is required" });
      }

      const settings = await storage.getSiteSettings();
      const release = await publishChannelRelease(channel, commitHash, settings);
      const updated = await storage.upsertSiteSettings({
        ...(settings ? {
          siteName: settings.siteName || undefined,
          commissionPercentage: settings.commissionPercentage || undefined,
          heroTitle: settings.heroTitle || undefined,
          heroSubtitle: settings.heroSubtitle || undefined,
          testMode: settings.testMode ?? true,
          mobileAppTestEnabled: settings.mobileAppTestEnabled ?? true,
          mobileAppProductionEnabled: settings.mobileAppProductionEnabled ?? true,
          mobileConsumerRelease: channel === "senior" ? release : settings.mobileConsumerRelease ?? undefined,
          mobileAdminRelease: channel === "admin" ? release : settings.mobileAdminRelease ?? undefined,
        } : {
          testMode: true,
          mobileAppTestEnabled: true,
          mobileAppProductionEnabled: true,
          mobileConsumerRelease: channel === "senior" ? release : undefined,
          mobileAdminRelease: channel === "admin" ? release : undefined,
        }),
      });

      res.json({
        success: true,
        manifest: getStoredAppReleaseManifest(updated),
        published: release,
      });
    } catch (error: any) {
      res.status(400).json({ error: error?.message || "Failed to publish mobile release" });
    }
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
    const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

    if (attempts && attempts.count >= 5) {
      const timeRemaining = Date.now() - attempts.lastAttempt;
      if (timeRemaining < LOCKOUT_TIME) {
        return res.status(429).json({ 
          error: "Too many login attempts. Try again in 15 minutes.",
          retryAfter: Math.ceil((LOCKOUT_TIME - timeRemaining) / 1000)
        });
      } else {
        // Reset attempts after lockout period has passed
        adminWebLoginAttempts.delete(clientIp);
      }
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
    const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

    if (attempts && attempts.count >= 5) {
      const timeRemaining = Date.now() - attempts.lastAttempt;
      if (timeRemaining < LOCKOUT_TIME) {
        return res.status(429).json({ 
          error: "Too many login attempts. Try again in 15 minutes.",
          retryAfter: Math.ceil((LOCKOUT_TIME - timeRemaining) / 1000)
        });
      } else {
        // Reset attempts after lockout period has passed
        adminLoginAttempts.delete(clientIp);
      }
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

  const SITE_URL = "https://www.michelstravel.agency";

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /atendimento
Disallow: /checkout/
Disallow: /profile
Disallow: /my-trips
Disallow: /book/
Disallow: /api/
Disallow: /live/
Disallow: /messages

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
        { url: '/help', priority: '0.7', changefreq: 'monthly' },
        { url: '/terms', priority: '0.3', changefreq: 'yearly' },
        { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
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

  const chatbotAi = getServiceAiClient();
  const chatbotAiStatus = getServiceAiStatus();

  const writeChatEvent = (res: Response, payload: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    if (typeof (res as any).flush === "function") {
      (res as any).flush();
    }
  };

  const getConversationLanguage = async (sessionId: string) => {
    const [conversation] = await db
      .select({ language: conversations.language })
      .from(conversations)
      .where(eq(conversations.id, sessionId))
      .limit(1);

    return normalizeChatLanguage(conversation?.language);
  };

  const markConversationEscalated = async (sessionId: string) => {
    await db
      .update(conversations)
      .set({ escalated: true, escalatedAt: new Date() })
      .where(eq(conversations.id, sessionId));

    const allMsgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, sessionId))
      .orderBy(messages.createdAt);

    const chatLog = allMsgs.map((message) => `[${message.role}]: ${message.content}`).join("\n\n");
    sendChatEscalationEmail(sessionId, chatLog).catch((err) =>
      console.error("Failed to send escalation email:", err),
    );
  };

  const CHATBOT_SYSTEM_PROMPT = `You are the friendly customer support assistant for Michels Travel ("Opção Eficiente"), a flight booking agency based in New Jersey, USA. Your name is Mia.

ABOUT THE COMPANY:
- Flight booking website: www.michelstravel.agency (this is our flight search and booking platform — always direct customers here for flights)
- Contact email: contact@michelstravel.agency
- Phone: +1 (862) 350-1161
- Location: New Jersey, USA
- Services: Flight search and booking with competitive prices worldwide
- IMPORTANT: Never mention or recommend any old or incorrect domains — our flight booking site is www.michelstravel.agency
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
- When escalating, let the customer know that our team has been notified and will respond soon through the internal messenger on the site.
- Example escalation response: "[ESCALATE] Vou te conectar com um atendente humano! Nossa equipe foi notificada e responderá em breve. Você também pode enviar uma mensagem direta pela seção 'Mensagens' no menu do site."

BEHAVIOR:
- Always respond in the SAME LANGUAGE the customer writes in. If they write in Portuguese, respond in Portuguese. If English, respond in English. If Spanish, respond in Spanish.
- Be warm, professional, and concise
- Use the customer's name if they provide it
- Never make up flight prices or availability - direct them to search on the site
- Never share internal system details or API information
- If you don't know something, say so honestly and offer to connect them with a human agent
- Keep responses under 200 words unless more detail is needed

BOOKING LOOKUP:
- You can look up a customer's booking using the lookup_booking function
- Ask for their reference code (starts with "MT-") and the email used during booking
- Once you find their booking, share relevant details: status, flight info, ticket status, airline reference
- Ticket statuses: "pending" (awaiting processing), "issued" (ticket confirmed), "schedule_changed" (airline changed the flight), "cancelled" (ticket cancelled), "failed" (issue failed - team notified)
- If ticket status is "schedule_changed", alert them and recommend reviewing updated flight details on "My Trips" page
- If ticket status is "failed", reassure them that our team has been notified and will help
- Never share the Duffel Order ID or internal system IDs with customers`;

  const AGENT_TOOLS: any[] = [
    {
      type: "function",
      function: {
        name: "search_flights",
        description: "Search flights when the customer provides origin, destination, and date.",
        parameters: {
          type: "object",
          properties: {
            origin: { type: "string", description: "3-letter origin airport code, for example EWR" },
            destination: { type: "string", description: "3-letter destination airport code, for example MCO" },
            date: { type: "string", description: "Departure date in YYYY-MM-DD format" },
            returnDate: { type: "string", description: "Return date in YYYY-MM-DD format, when round-trip" },
            adults: { type: "string", description: "Number of adults" },
            cabinClass: {
              type: "string",
              enum: ["economy", "premium_economy", "business", "first"],
              description: "Cabin class",
            },
          },
          required: ["origin", "destination", "date"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "lookup_booking",
        description: "Look up a customer booking by reference code and email.",
        parameters: {
          type: "object",
          properties: {
            reference: {
              type: "string",
              description: "Booking reference code that starts with MT-",
            },
            email: {
              type: "string",
              description: "Email address used during booking",
            },
          },
          required: ["reference", "email"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "fill_booking_form",
        description: "Prefill the booking form with passenger and contact information when the customer is already on a /book/... page and explicitly asks for help filling the form.",
        parameters: {
          type: "object",
          properties: {
            contactEmail: { type: "string", description: "Contact email for the reservation" },
            contactPhone: { type: "string", description: "Contact phone for the reservation" },
            passengers: {
              type: "array",
              description: "Passenger details to prefill into the booking form",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", enum: ["mr", "mrs", "ms", "miss", "dr"] },
                  givenName: { type: "string" },
                  familyName: { type: "string" },
                  bornOn: { type: "string", description: "Date of birth in YYYY-MM-DD format" },
                  gender: { type: "string", enum: ["m", "f"] },
                  email: { type: "string" },
                  phoneNumber: { type: "string" },
                  documentType: { type: "string", enum: ["passport", "national_id", "drivers_license", "travel_document", "other"] },
                  documentNumber: { type: "string" },
                  documentExpiryDate: { type: "string", description: "Document expiry date in YYYY-MM-DD format" },
                  documentIssuingCountry: { type: "string" },
                  nationality: { type: "string" },
                },
                required: ["givenName", "familyName"],
              },
            },
          },
          required: ["passengers"],
        },
      },
    },
  ];

  type ChatbotRequestContext = {
    pathname?: string | null;
    search?: string | null;
    serviceMode?: string | null;
  };

  const AGENT_SYSTEM_PROMPT = `${CHATBOT_SYSTEM_PROMPT}

FORM FILLING RULES:
- Never ask for or collect full credit card numbers, CVV codes, Stripe secrets, passwords, or government IDs inside chat unless the booking form itself requires the customer to type the document number into our secure site form.
- If the customer is already on a /book/... page and explicitly asks you to help complete the reservation form, you may use fill_booking_form for contact and passenger fields only.
- Only use fill_booking_form when you have structured passenger/contact data. If information is incomplete, ask short follow-up questions.
- After prefilling the booking form, remind the customer to review every field before paying.`;

  const validPassengerTitles = new Set(["mr", "mrs", "ms", "miss", "dr"]);
  const validPassengerGenders = new Set(["m", "f"]);
  const validDocumentTypes = new Set(["passport", "national_id", "drivers_license", "travel_document", "other"]);

  const createChatHeaders = (res: Response) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
  };

  const finishChatResponse = (res: Response, escalated = false) => {
    writeChatEvent(res, { done: true, escalated });
    res.end();
  };

  const createCompletionWithFallback = async (options: Record<string, unknown>) => {
    const { model, fallbackModel, ...rest } = options as { model?: string | null; fallbackModel?: string | null } & Record<string, unknown>;
    const candidates = [model, fallbackModel].filter((candidate, index, all): candidate is string => Boolean(candidate) && all.indexOf(candidate) === index);
    let lastError: unknown = null;

    for (const candidate of candidates) {
      try {
        return await chatbotAi.client!.chat.completions.create({
          ...rest,
          model: candidate,
        } as any);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("No chatbot model configured");
  };

  const createStreamingCompletionWithFallback = async (options: Record<string, unknown>) => {
    const { model, fallbackModel, ...rest } = options as { model?: string | null; fallbackModel?: string | null } & Record<string, unknown>;
    const candidates = [model, fallbackModel].filter((candidate, index, all): candidate is string => Boolean(candidate) && all.indexOf(candidate) === index);
    let lastError: unknown = null;

    for (const candidate of candidates) {
      try {
        return await chatbotAi.client!.chat.completions.create({
          ...rest,
          model: candidate,
          stream: true,
        } as any);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("No chatbot model configured");
  };

  const buildContextPrompt = (context?: ChatbotRequestContext | null) => {
    const pathname = typeof context?.pathname === "string" ? context.pathname.trim() : "";
    const search = typeof context?.search === "string" ? context.search.trim() : "";
    const serviceMode = typeof context?.serviceMode === "string" ? context.serviceMode.trim() : "";

    if (!pathname && !search && !serviceMode) {
      return null;
    }

    const lines = ["CURRENT PAGE CONTEXT:"];

    if (pathname) lines.push(`- Pathname: ${pathname}`);
    if (search) lines.push(`- Query string: ${search}`);
    if (serviceMode) lines.push(`- Service mode: ${serviceMode}`);

    if (pathname.startsWith("/book/")) {
      lines.push("- The customer is already on the booking form.");
      lines.push("- You may use fill_booking_form if the customer explicitly asks for agent help and provides passenger/contact details.");
    } else if (pathname.startsWith("/search")) {
      lines.push("- The customer is on the flight results page.");
      lines.push("- Searching again is allowed if the customer wants better dates, airports, or cabin options.");
    } else {
      lines.push("- Keep your answer aligned with the current page when relevant.");
    }

    return lines.join("\n");
  };

  const buildChatHistory = (
    existingMessages: Array<{ role: string; content: string }>,
    systemPrompt: string,
    context?: ChatbotRequestContext | null,
  ) => {
    const history: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];
    const contextPrompt = buildContextPrompt(context);
    if (contextPrompt) {
      history.push({ role: "system", content: contextPrompt });
    }
    history.push(
      ...existingMessages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => ({
          role: message.role as "user" | "assistant",
          content: message.content,
        })),
    );
    return history;
  };

  const persistAssistantMessage = async (sessionId: string, content: string) => {
    await db.insert(messages).values({
      conversationId: sessionId,
      role: "assistant",
      content,
    });
  };

  const streamCompletionText = async (
    res: Response,
    stream: AsyncIterable<any>,
    isDisconnected: () => boolean,
  ) => {
    let fullResponse = "";

    for await (const chunk of stream) {
      if (isDisconnected()) break;
      const text = chunk.choices?.[0]?.delta?.content || "";
      if (!text) continue;
      fullResponse += text;
      writeChatEvent(res, { content: text, type: "text" });
    }

    return fullResponse;
  };

  const normalizeIsoDate = (value: unknown) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : undefined;
  };

  const normalizeText = (value: unknown) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  };

  const buildPrefillPayload = (rawArgs: Record<string, unknown>) => {
    const contactEmail = normalizeText(rawArgs.contactEmail);
    const contactPhone = normalizeText(rawArgs.contactPhone);
    const passengers = Array.isArray(rawArgs.passengers)
      ? rawArgs.passengers
          .map((item) => {
            const rawPassenger = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
            const givenName = normalizeText(rawPassenger.givenName);
            const familyName = normalizeText(rawPassenger.familyName);
            if (!givenName || !familyName) return null;

            const title = normalizeText(rawPassenger.title)?.toLowerCase();
            const gender = normalizeText(rawPassenger.gender)?.toLowerCase();
            const documentType = normalizeText(rawPassenger.documentType)?.toLowerCase();

            return {
              title: title && validPassengerTitles.has(title) ? title : undefined,
              givenName,
              familyName,
              bornOn: normalizeIsoDate(rawPassenger.bornOn),
              gender: gender && validPassengerGenders.has(gender) ? gender : undefined,
              email: normalizeText(rawPassenger.email),
              phoneNumber: normalizeText(rawPassenger.phoneNumber),
              documentType: documentType && validDocumentTypes.has(documentType) ? documentType : undefined,
              documentNumber: normalizeText(rawPassenger.documentNumber),
              documentExpiryDate: normalizeIsoDate(rawPassenger.documentExpiryDate),
              documentIssuingCountry: normalizeText(rawPassenger.documentIssuingCountry),
              nationality: normalizeText(rawPassenger.nationality),
            };
          })
          .filter(Boolean)
      : [];

    return {
      contactEmail,
      contactPhone,
      passengers,
    };
  };

  const buildPrefillConfirmation = (languageInput: string | null | undefined, passengerCount: number) => {
    const language = normalizeChatLanguage(languageInput);
    if (language === "en") {
      return passengerCount > 0
        ? `I filled the booking form with ${passengerCount} passenger${passengerCount === 1 ? "" : "s"}. Please review each field calmly before payment.`
        : "I updated the contact fields in the booking form. Please review everything before payment.";
    }
    if (language === "es") {
      return passengerCount > 0
        ? `Completé el formulario de reserva con ${passengerCount} pasajero${passengerCount === 1 ? "" : "s"}. Revise cada campo con calma antes del pago.`
        : "Actualicé los datos de contacto en el formulario de reserva. Revíselo todo antes del pago.";
    }
    return passengerCount > 0
      ? `Preenchi o formulário da reserva com ${passengerCount} passageiro${passengerCount === 1 ? "" : "s"}. Revise cada campo com calma antes do pagamento.`
      : "Atualizei os dados de contato no formulário da reserva. Revise tudo antes do pagamento.";
  };

  const buildPrefillUnavailableMessage = (languageInput: string | null | undefined) => {
    const language = normalizeChatLanguage(languageInput);
    if (language === "en") {
      return "To fill the reservation form automatically, open the booking page first and then ask me to help with the passenger details.";
    }
    if (language === "es") {
      return "Para completar el formulario de reserva automáticamente, abre primero la página de reserva y luego pídeme ayuda con los datos de los pasajeros.";
    }
    return "Para preencher o formulário da reserva automaticamente, abra primeiro a página de reserva e depois me peça ajuda com os dados dos passageiros.";
  };

  const buildMissingPrefillMessage = (languageInput: string | null | undefined) => {
    const language = normalizeChatLanguage(languageInput);
    if (language === "en") {
      return "I can fill the booking form once you send at least the passenger first and last name, plus contact email or phone if available.";
    }
    if (language === "es") {
      return "Puedo completar el formulario cuando envíes al menos el nombre y apellido del pasajero, además del correo o teléfono de contacto si ya lo tienes.";
    }
    return "Posso preencher o formulário quando você enviar pelo menos nome e sobrenome do passageiro, além do e-mail ou telefone de contato se já tiver.";
  };

  const handleFlightSearchResult = async (
    res: Response,
    sessionId: string,
    languageInput: string | null | undefined,
    args: Record<string, unknown>,
  ) => {
    try {
      const origin = normalizeText(args.origin)?.toUpperCase();
      const destination = normalizeText(args.destination)?.toUpperCase();
      const date = normalizeIsoDate(args.date);

      if (!origin || !destination || !date) {
        const invalidMessage = buildSearchErrorMessage(languageInput);
        writeChatEvent(res, { content: invalidMessage, type: "text" });
        await persistAssistantMessage(sessionId, invalidMessage);
        return false;
      }

      const flights = await searchFlights({
        origin,
        destination,
        date,
        returnDate: normalizeIsoDate(args.returnDate),
        adults: normalizeText(args.adults) || "1",
        passengers: normalizeText(args.adults) || "1",
        cabinClass: normalizeText(args.cabinClass) || "economy",
      } as any);

      const chatMarkupRate = await getCommissionRate();
      const topFlights = flights.slice(0, 5).map((flight) => ({
        id: flight.id,
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        duration: flight.duration,
        price: parseFloat((flight.price * (1 + chatMarkupRate)).toFixed(2)),
        currency: flight.currency,
        stops: flight.stops,
        logoUrl: flight.logoUrl,
        originCode: flight.originCode || origin,
        destinationCode: flight.destinationCode || destination,
        originCity: flight.originCity,
        destinationCity: flight.destinationCity,
      }));

      writeChatEvent(res, { flights: topFlights, type: "flights" });
      const summary = buildAgentSearchSummary(languageInput, topFlights, origin, destination, date);
      writeChatEvent(res, { content: summary, type: "text" });
      await persistAssistantMessage(sessionId, `[AGENT: Searched ${origin}→${destination} on ${date}]
${summary}`);
      return false;
    } catch (error) {
      console.error("Flight search error in chatbot agent mode:", error);
      const errorMessage = buildSearchErrorMessage(languageInput);
      writeChatEvent(res, { content: errorMessage, type: "text" });
      await persistAssistantMessage(sessionId, errorMessage);
      return false;
    }
  };

  const handleBookingLookupResult = async (
    res: Response,
    sessionId: string,
    languageInput: string | null | undefined,
    args: Record<string, unknown>,
  ) => {
    const reference = normalizeText(args.reference)?.toUpperCase();
    const email = normalizeText(args.email)?.toLowerCase();

    if (!reference || !email) {
      const askMessage =
        normalizeChatLanguage(languageInput) === "en"
          ? "I need both the MT reference code and the booking email to find a reservation."
          : normalizeChatLanguage(languageInput) === "es"
            ? "Necesito el código MT y el correo de la reserva para encontrarla."
            : "Preciso do código MT e do e-mail da reserva para localizar o pedido.";
      writeChatEvent(res, { content: askMessage, type: "text" });
      await persistAssistantMessage(sessionId, askMessage);
      return false;
    }

    try {
      const booking = await storage.getBookingByReferenceAndEmail(reference, email);
      const summary = booking
        ? buildAgentLookupSummary(languageInput, {
            referenceCode: booking.referenceCode || reference,
            status: booking.status || "pending",
            ticketStatus: (booking as any).ticketStatus || null,
            airlineReference: (booking as any).duffelBookingReference || null,
            airline: (booking.flightData as any)?.airline || null,
            origin: (booking.flightData as any)?.origin || (booking.flightData as any)?.originCode || null,
            destination: (booking.flightData as any)?.destination || (booking.flightData as any)?.destinationCode || null,
            departureDate: (booking.flightData as any)?.departureTime || null,
            passengerCount: Array.isArray(booking.passengerDetails) ? booking.passengerDetails.length : 0,
          })
        : buildBookingNotFoundMessage(languageInput, reference);

      writeChatEvent(res, { content: summary, type: "text" });
      await persistAssistantMessage(sessionId, booking ? `[AGENT: Looked up booking ${reference}]
${summary}` : summary);
      return false;
    } catch (error) {
      console.error("Booking lookup error in chatbot agent mode:", error);
      const fallbackMessage =
        normalizeChatLanguage(languageInput) === "en"
          ? "I could not check the booking right now. Please try again in a moment."
          : normalizeChatLanguage(languageInput) === "es"
            ? "No pude consultar la reserva ahora mismo. Inténtalo de nuevo en un momento."
            : "Não consegui consultar a reserva agora. Tente novamente em instantes.";
      writeChatEvent(res, { content: fallbackMessage, type: "text" });
      await persistAssistantMessage(sessionId, fallbackMessage);
      return false;
    }
  };

  const handleBookingFormPrefill = async (
    res: Response,
    sessionId: string,
    languageInput: string | null | undefined,
    args: Record<string, unknown>,
    context?: ChatbotRequestContext | null,
  ) => {
    if (!context?.pathname?.startsWith("/book/")) {
      const unavailableMessage = buildPrefillUnavailableMessage(languageInput);
      writeChatEvent(res, { content: unavailableMessage, type: "text" });
      await persistAssistantMessage(sessionId, unavailableMessage);
      return false;
    }

    const payload = buildPrefillPayload(args);
    if (!payload.contactEmail && !payload.contactPhone && payload.passengers.length === 0) {
      const missingMessage = buildMissingPrefillMessage(languageInput);
      writeChatEvent(res, { content: missingMessage, type: "text" });
      await persistAssistantMessage(sessionId, missingMessage);
      return false;
    }

    writeChatEvent(res, {
      type: "action",
      action: {
        type: "prefill_booking_form",
        payload,
      },
    });

    const confirmation = buildPrefillConfirmation(languageInput, payload.passengers.length);
    writeChatEvent(res, { content: confirmation, type: "text" });
    await persistAssistantMessage(sessionId, `[AGENT: Prefilled booking form]
${confirmation}`);
    return false;
  };

  const handleAgentFallbackRequest = async (
    res: Response,
    sessionId: string,
    content: string,
    languageInput?: string | null,
    context?: ChatbotRequestContext | null,
  ) => {
    const action = parseAgentFallbackRequest(content, languageInput);

    if (action.type === "reply") {
      writeChatEvent(res, { content: action.message, type: "text" });
      await persistAssistantMessage(sessionId, action.message);
      finishChatResponse(res, false);
      return;
    }

    if (action.type === "escalate") {
      writeChatEvent(res, { content: action.message, type: "text" });
      await persistAssistantMessage(sessionId, action.message);
      await markConversationEscalated(sessionId);
      finishChatResponse(res, true);
      return;
    }

    if (action.type === "lookup_booking") {
      await handleBookingLookupResult(res, sessionId, languageInput, action.args);
      finishChatResponse(res, false);
      return;
    }

    if (action.type === "search_flights") {
      await handleFlightSearchResult(res, sessionId, languageInput, action.args);
      finishChatResponse(res, false);
      return;
    }

    const fallbackMessage = buildServiceAiFallback(content, languageInput, context).message;
    writeChatEvent(res, { content: fallbackMessage, type: "text" });
    await persistAssistantMessage(sessionId, fallbackMessage);
    finishChatResponse(res, false);
  };

  app.get('/api/chatbot/status', (_req, res) => {
    res.json(chatbotAiStatus);
  });

  app.post('/api/senior/chat', async (req, res) => {
    try {
      const { transcript, currentStep, language, state, visitorId } = req.body;
      const chatbotAi = getServiceAiStatus();
      
      if (!chatbotAi.available) {
        return res.json({ understood: false });
      }

      // 1. Tentar encontrar a sessão ativa para logar o áudio
      const session = visitorId ? await storage.getLiveSessionByVisitor(visitorId) : null;
      if (session) {
        await storage.createLiveSessionMessage({
          sessionId: session.id,
          role: "client_voice",
          content: transcript,
        });

        // 1b. Verificar se admin assumiu o controle (intervenção recente)
        const messages = await storage.getLiveSessionMessages(session.id);
        const blocks = await storage.getLiveSessionBlocks(session.id);
        
        const now = new Date().getTime();
        const cutoff = 5 * 60 * 1000; // 5 minutos
        
        const lastAdminMsg = messages.filter(m => m.role === 'admin' || m.role === 'mia_voice').pop(); // mia_voice manual counts too
        const lastVoicePrompt = blocks.filter(b => b.blockType === 'voice_prompt').pop();
        
        let adminActive = false;
        if (lastAdminMsg && (now - new Date(lastAdminMsg.createdAt!).getTime() < cutoff)) adminActive = true;
        if (lastVoicePrompt && (now - new Date((lastVoicePrompt as any).updatedAt!).getTime() < cutoff)) adminActive = true;
        
        if (adminActive) {
          console.log(`Sessão ${session.id} sob controle admin. Mia em silêncio.`);
          return res.json({ understood: false, response: "" }); // Fica em silêncio se admin está ativo
        }
      }

      const systemPrompt = `You are Mia, the voice assistant for the Senior Terminal of Michels Travel.
Your goal is to extract information from the user's transcript based on the CURRENT STEP.

CURRENT STEP: ${currentStep}
CURRENT STATE: ${JSON.stringify(state)}

RULES:
1. Extract the specific piece of data requested for this step.
2. Respond in the user's language (${language}).
3. Be EXTREMELY concise and supportive.
4. If it's a "yes/no" step, return a boolean in "value".
5. If it's "ask_class", return one of: "economy", "premium_economy", "business", "first" in "value".
6. If the user says something unrelated or you don't understand, set "understood" to false.

OUTPUT FORMAT (JSON only):
{
  "understood": boolean,
  "value": any,
  "response": "short friendly confirmation or clarification"
}`;

      const response = await createServiceAiCompletionWithFallback({
        model: chatbotAi.agentModel,
        fallbackModel: chatbotAi.fallbackModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript }
        ],
        response_format: { type: "json_object" },
        max_tokens: 256,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      // 2. Logar a resposta da Mia
      if (session && result.response) {
        await storage.createLiveSessionMessage({
          sessionId: session.id,
          role: "mia_voice",
          content: result.response,
        });
      }

      // 3. Alerta de confusão (se habilitado no state ou inferido)
      if (session && result.understood === false) {
          // Incremento de confusão pode ser feito verificando as últimas mensagens
          const recentMsgs = await storage.getLiveSessionMessages(session.id);
          const failedCount = recentMsgs.slice(-5).filter(m => m.role === "mia_voice" && m.content.includes("could not understand") || m.content.length > 100).length; // simplificado
          
          if (failedCount >= 2) {
             await storage.createSeniorAlert({
                userId: session.visitorId || "anonymous",
                type: "confusion_detected",
                status: "pending",
                message: `O cliente parece confuso no passo: ${currentStep}. Transcrição: ${transcript}`,
             });
          }
      }

      res.json(result);
    } catch (error) {
      console.error('Senior AI chat failed:', error);
      res.status(500).json({ understood: false });
    }
  });

  app.post('/api/chatbot/session', async (req, res) => {
    try {
      const { visitorId, language } = req.body;
      const session = await createServiceAiSession({ visitorId, language });
      res.json(session);
    } catch (error) {
      console.error('Chatbot session creation error:', error);
      res.status(500).json({ error: "Failed to create chat session" });
    }
  });

  app.post('/api/chatbot/message', async (req, res) => {
    try {
      const { sessionId, content, context } = req.body ?? {};
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

      const sessionLanguage = await getConversationLanguage(sessionId);

      createChatHeaders(res);
      let clientDisconnected = false;
      req.on("close", () => { clientDisconnected = true; });

      if (!chatbotAi.client) {
        const fallback = buildServiceAiFallback(content, sessionLanguage, context as ChatbotRequestContext | undefined);
        writeChatEvent(res, { content: fallback.message, type: "text" });
        await persistAssistantMessage(sessionId, fallback.message);
        if (fallback.escalate) {
          await markConversationEscalated(sessionId);
        }
        finishChatResponse(res, fallback.escalate);
        return;
      }

      const chatHistory = buildServiceAiHistory(existingMessages, "support", context as ChatbotRequestContext | undefined);

      try {
        const stream = await createServiceAiStreamingCompletionWithFallback({
          model: chatbotAi.primaryModel,
          fallbackModel: chatbotAi.fallbackModel,
          messages: chatHistory,
          max_tokens: 300,
        }) as unknown as AsyncIterable<any>;

        const fullResponse = await streamCompletionText(res, stream, () => clientDisconnected);
        const savedResponse = fullResponse.trim() || buildServiceAiFallback(content, sessionLanguage, context as ChatbotRequestContext | undefined).message;
        await persistAssistantMessage(sessionId, savedResponse);

        const shouldEscalate = savedResponse.startsWith("[ESCALATE]");
        if (shouldEscalate) {
          await markConversationEscalated(sessionId);
        }

        finishChatResponse(res, shouldEscalate);
      } catch (error) {
        console.error('Chatbot message error, using basic fallback:', error);
        const fallback = buildServiceAiFallback(content, sessionLanguage, context as ChatbotRequestContext | undefined);
        writeChatEvent(res, { content: fallback.message, type: "text" });
        await persistAssistantMessage(sessionId, fallback.message);
        if (fallback.escalate) {
          await markConversationEscalated(sessionId);
        }
        finishChatResponse(res, fallback.escalate);
      }
    } catch (error) {
      console.error('Chatbot message route failed:', error);
      if (res.headersSent) {
        writeChatEvent(res, { error: "Failed to process message" });
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  app.post('/api/chatbot/agent-message', async (req, res) => {
    try {
      const { sessionId, content, context } = req.body ?? {};
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

      const sessionLanguage = await getConversationLanguage(sessionId);

      createChatHeaders(res);
      let clientDisconnected = false;
      req.on("close", () => { clientDisconnected = true; });

      if (!chatbotAi.client) {
        await handleAgentFallbackRequest(res, sessionId, content, sessionLanguage, context as ChatbotRequestContext | undefined);
        return;
      }

      const chatHistory = buildServiceAiHistory(existingMessages, "agent", context as ChatbotRequestContext | undefined);

      try {
        const initialResponse = await createServiceAiCompletionWithFallback({
          model: chatbotAi.agentModel,
          fallbackModel: chatbotAi.fallbackModel,
          messages: chatHistory,
          tools: SERVICE_AI_AGENT_TOOLS,
          tool_choice: "auto",
          max_tokens: 512,
        });

        const choice = initialResponse.choices?.[0];
        const toolCall = choice?.message?.tool_calls?.[0] as any;

        if (toolCall?.function?.name === "search_flights") {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(toolCall.function.arguments || "{}");
          } catch {
            args = {};
          }
          await handleFlightSearchResult(res, sessionId, sessionLanguage, args);
          finishChatResponse(res, false);
          return;
        }

        if (toolCall?.function?.name === "lookup_booking") {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(toolCall.function.arguments || "{}");
          } catch {
            args = {};
          }
          await handleBookingLookupResult(res, sessionId, sessionLanguage, args);
          finishChatResponse(res, false);
          return;
        }

        if (toolCall?.function?.name === "fill_booking_form") {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(toolCall.function.arguments || "{}");
          } catch {
            args = {};
          }
          await handleBookingFormPrefill(res, sessionId, sessionLanguage, args, context as ChatbotRequestContext | undefined);
          finishChatResponse(res, false);
          return;
        }

        const textContent = choice?.message?.content?.trim() || buildServiceAiFallback(content, sessionLanguage, context as ChatbotRequestContext | undefined).message;
        if (!clientDisconnected) {
          writeChatEvent(res, { content: textContent, type: "text" });
        }
        await persistAssistantMessage(sessionId, textContent);

        const shouldEscalate = textContent.startsWith("[ESCALATE]");
        if (shouldEscalate) {
          await markConversationEscalated(sessionId);
        }

        finishChatResponse(res, shouldEscalate);
      } catch (error) {
        console.error('Agent message error, using local fallback:', error);
        await handleAgentFallbackRequest(res, sessionId, content, sessionLanguage, context as ChatbotRequestContext | undefined);
      }
    } catch (error) {
      console.error('Agent message route failed:', error);
      if (res.headersSent) {
        writeChatEvent(res, { error: "Failed to process agent message" });
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
      const id = parseIdRouteParam(req.params.id);
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
      const sessionId = req.params.sessionId;
      const afterId = req.query.afterId as string || '';

      const newMessages = await db.select().from(messages)
        .where(
          and(
            eq(messages.conversationId, sessionId),
            eq(messages.role, "admin"),
            afterId ? gt(messages.id, afterId) : undefined
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
      const id = parseIdRouteParam(req.params.id);
      const msgs = await db.select().from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(messages.createdAt);
      res.json(msgs);
    } catch (error) {
      console.error('Admin conversation messages error:', error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // ============ INTERNAL MESSENGER ROUTES ============

  app.get('/api/messenger/threads', async (req, res) => {
    const user = req.user as any;
    if (!user?.claims?.sub) return res.status(401).json({ error: "Login required" });
    try {
      const threads = await storage.getInternalThreadsByUser(user.claims.sub);
      res.json(threads);
    } catch (error) {
      console.error('Messenger threads error:', error);
      res.status(500).json({ error: "Failed to fetch threads" });
    }
  });

  app.post('/api/messenger/threads', async (req, res) => {
    const user = req.user as any;
    if (!user?.claims?.sub) return res.status(401).json({ error: "Login required" });
    try {
      const { subject, message } = req.body;
      if (!subject?.trim() || !message?.trim()) return res.status(400).json({ error: "Subject and message required" });
      const thread = await storage.createInternalThread({ userId: user.claims.sub, subject: subject.trim(), status: "open" });
      const firstName = user.claims.first_name || "";
      const lastName = user.claims.last_name || "";
      const senderName = `${firstName} ${lastName}`.trim() || user.claims.email || "User";
      await storage.createInternalMessage({
        threadId: thread.id,
        senderRole: "user",
        senderName,
        content: message.trim(),
        readByAdmin: false,
        readByUser: true,
      });
      res.json(thread);
    } catch (error) {
      console.error('Messenger create thread error:', error);
      res.status(500).json({ error: "Failed to create thread" });
    }
  });

  app.get('/api/messenger/threads/:id/messages', async (req, res) => {
    const user = req.user as any;
    if (!user?.claims?.sub) return res.status(401).json({ error: "Login required" });
    try {
      const threadId = parseIdRouteParam(req.params.id);
      const thread = await storage.getInternalThread(threadId);
      if (!thread || thread.userId !== user.claims.sub) return res.status(404).json({ error: "Thread not found" });
      await storage.markMessagesRead(threadId, "user");
      const msgs = await storage.getInternalMessages(threadId);
      res.json(msgs);
    } catch (error) {
      console.error('Messenger messages error:', error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post('/api/messenger/threads/:id/messages', async (req, res) => {
    const user = req.user as any;
    if (!user?.claims?.sub) return res.status(401).json({ error: "Login required" });
    try {
      const threadId = parseIdRouteParam(req.params.id);
      const thread = await storage.getInternalThread(threadId);
      if (!thread || thread.userId !== user.claims.sub) return res.status(404).json({ error: "Thread not found" });
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: "Message content required" });
      const firstName = user.claims.first_name || "";
      const lastName = user.claims.last_name || "";
      const senderName = `${firstName} ${lastName}`.trim() || "User";
      const msg = await storage.createInternalMessage({
        threadId,
        senderRole: "user",
        senderName,
        content: content.trim(),
        readByAdmin: false,
        readByUser: true,
      });
      res.json(msg);
    } catch (error) {
      console.error('Messenger send message error:', error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get('/api/messenger/unread', async (req, res) => {
    const user = req.user as any;
    if (!user?.claims?.sub) return res.json({ count: 0 });
    try {
      const count = await storage.getUnreadCountForUser(user.claims.sub);
      res.json({ count });
    } catch {
      res.json({ count: 0 });
    }
  });

  // Admin messenger routes
  app.get('/api/admin/messenger/threads', requireAdmin, async (req, res) => {
    try {
      const threads = await storage.getAllInternalThreads();
      res.json(threads);
    } catch (error) {
      console.error('Admin messenger threads error:', error);
      res.status(500).json({ error: "Failed to fetch threads" });
    }
  });

  app.get('/api/admin/messenger/threads/:id/messages', requireAdmin, async (req, res) => {
    try {
      const threadId = parseIdRouteParam(req.params.id);
      await storage.markMessagesRead(threadId, "admin");
      const msgs = await storage.getInternalMessages(threadId);
      res.json(msgs);
    } catch (error) {
      console.error('Admin messenger messages error:', error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post('/api/admin/messenger/threads/:id/messages', requireAdmin, async (req, res) => {
    try {
      const threadId = parseIdRouteParam(req.params.id);
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: "Message content required" });
      const msg = await storage.createInternalMessage({
        threadId,
        senderRole: "admin",
        senderName: "Michels Travel",
        content: content.trim(),
        readByAdmin: true,
        readByUser: false,
      });
      res.json(msg);
    } catch (error) {
      console.error('Admin messenger send error:', error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get('/api/admin/messenger/unread', requireAdmin, async (req, res) => {
    try {
      const count = await storage.getUnreadCountForAdmin();
      res.json({ count });
    } catch {
      res.json({ count: 0 });
    }
  });

  // ============ LIVE SESSION ROUTES ============

  // SSE connections map for real-time updates
  const liveSessionClients = new Map<string, Set<Response>>();

  function notifyLiveSessionClients(sessionId: string, event: string, data: any) {
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
      const serviceMode = req.body?.serviceMode === "senior" ? "senior" : "standard";
      const entryPoint = typeof req.body?.entryPoint === "string" && req.body.entryPoint.trim()
        ? req.body.entryPoint.trim().slice(0, 80)
        : "chatbot";
      const contextSnapshot =
        req.body?.contextSnapshot && typeof req.body.contextSnapshot === "object"
          ? req.body.contextSnapshot
          : null;
      if (!visitorId) return res.status(400).json({ error: "visitorId required" });

      const existing = await storage.getLiveSessionByVisitor(visitorId);
      if (existing && (existing.status === "requested" || existing.status === "active")) {
        const shouldUpgradeExisting =
          existing.serviceMode !== serviceMode ||
          existing.entryPoint !== entryPoint ||
          JSON.stringify(existing.contextSnapshot || null) !== JSON.stringify(contextSnapshot);

        if (!shouldUpgradeExisting) {
          return res.json(existing);
        }

        const updatedExisting = await storage.updateLiveSession(existing.id, {
          serviceMode,
          entryPoint,
          contextSnapshot,
          language: language || existing.language || "pt",
          conversationId: conversationId || existing.conversationId || null,
        });

        return res.json(updatedExisting || existing);
      }

      const accessToken = nanoid(32);
      const session = await storage.createLiveSession({
        accessToken,
        visitorId,
        language: language || "pt",
        serviceMode,
        entryPoint,
        contextSnapshot,
        conversationId: conversationId || null,
        status: "requested",
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
      const id = parseIdRouteParam(req.params.id);
      const token = req.query.token as string;
      if (!token) return res.status(401).json({ error: "Access token required" });

      const session = await storage.getLiveSession(id);
      if (!session) return res.status(404).json({ error: "Session not found" });
      if (session.accessToken !== token) return res.status(403).json({ error: "Invalid access token" });

      const blocks = await storage.getLiveSessionBlocks(id, true);
      const messages = await storage.getLiveSessionMessages(id);

      let referenceCode = null;
      if (session.bookingId) {
        const booking = await storage.getBooking(session.bookingId);
        if (booking) referenceCode = booking.referenceCode;
      }

      res.json({ session: { ...session, referenceCode }, blocks, messages });
    } catch (error) {
      console.error("Live session get error:", error);
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Client SSE stream for real-time updates (requires access token)
  app.get('/api/live-sessions/:id/stream', async (req, res) => {
    const id = parseIdRouteParam(req.params.id);
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
      const id = parseIdRouteParam(req.params.id);
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

  app.get('/api/live-sessions/visitor/:visitorId/blocks', async (req, res) => {
    try {
      const { visitorId } = req.params;
      const { sharedOnly } = req.query;
      const session = await storage.getLiveSessionByVisitor(visitorId);
      if (!session) return res.status(404).json({ error: "Session not found" });
      const blocks = await storage.getLiveSessionBlocks(session.id, sharedOnly === 'true');
      res.json(blocks);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch visitor blocks" });
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

  // Admin searches flights for live session (uses existing Duffel search with markup)
  app.get('/api/live-sessions/admin/search-flights', requireAdmin, async (req, res) => {
    try {
      const params = req.query as any;
      if (params.tripType === 'multi-city' && params.legs) {
        try {
          const legs = JSON.parse(params.legs);
          if (!Array.isArray(legs) || legs.length < 2) {
            return res.status(400).json({ error: "Multi-city requires at least 2 legs" });
          }
          const searchParams = {
            ...params,
            legs,
            origin: legs[0].origin,
            destination: legs[0].destination,
            date: legs[0].date,
          };
          const flights = await searchFlights(searchParams);
          const catalogedFlights = await catalogAvailableOffers(flights, { limit: 6 });
          const rate = await getCommissionRate();
          const markedUpFlights = applyMarkupToFlights(catalogedFlights, rate);
          return res.json(markedUpFlights);
        } catch (parseErr) {
          return res.status(400).json({ error: "Invalid legs format" });
        }
      }

      if (!params.origin || !params.destination || !params.date) {
        return res.status(400).json({ error: "origin, destination, date required" });
      }

      const flights = await searchFlights(params);
      const catalogedFlights = await catalogAvailableOffers(flights, { limit: 50 });
      const rate = await getCommissionRate();
      const markedUpFlights = applyMarkupToFlights(catalogedFlights, rate);
      res.json(markedUpFlights);
    } catch (error) {
      console.error("Live session flight search error:", error);
      res.status(500).json({ error: "Flight search failed" });
    }
  });

  // Admin gets full session detail (all blocks, not just shared)
  app.get('/api/live-sessions/admin/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseIdRouteParam(req.params.id);
      const session = await storage.getLiveSession(id);
      if (!session) return res.status(404).json({ error: "Session not found" });

      const blocks = await storage.getLiveSessionBlocks(id, false);
      const messages = await storage.getLiveSessionMessages(id);

      let referenceCode = null;
      if (session.bookingId) {
        const booking = await storage.getBooking(session.bookingId);
        if (booking) referenceCode = booking.referenceCode;
      }

      res.json({ session: { ...session, referenceCode }, blocks, messages });
    } catch (error) {
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Admin accepts a session request
  app.post('/api/live-sessions/admin/:id/accept', requireAdmin, async (req, res) => {
    try {
      const id = parseIdRouteParam(req.params.id);
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
      const id = parseIdRouteParam(req.params.id);
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
      const sessionId = parseIdRouteParam(req.params.id);
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
      const blockId = parseIdRouteParam(req.params.blockId);
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
      const blockId = parseIdRouteParam(req.params.blockId);
      await storage.deleteLiveSessionBlock(blockId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete block" });
    }
  });

  // Admin sends a chat message
  app.post('/api/live-sessions/admin/:id/messages', requireAdmin, async (req, res) => {
    try {
      const id = parseIdRouteParam(req.params.id);
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

  // ===== BOOKING DRAWER WORKFLOW =====

  // Admin approves a flight for booking (sets the offer to proceed with)
  app.post('/api/live-sessions/admin/:id/approve-flight', requireAdmin, async (req, res) => {
    try {
      const id = parseIdRouteParam(req.params.id);
      const { offerId, flightData } = req.body;
      if (!offerId || !flightData) return res.status(400).json({ error: "offerId and flightData required" });

      const session = await storage.updateLiveSession(id, {
        approvedOfferId: offerId,
        approvedFlightData: flightData,
        bookingStatus: "approved",
      });
      if (!session) return res.status(404).json({ error: "Session not found" });

      notifyLiveSessionClients(id, "booking_update", {
        bookingStatus: "approved",
        approvedFlightData: flightData,
      });
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve flight" });
    }
  });

  // Admin requests documents from customer
  app.post('/api/live-sessions/admin/:id/request-documents', requireAdmin, async (req, res) => {
    try {
      const id = parseIdRouteParam(req.params.id);
      const session = await storage.updateLiveSession(id, {
        bookingStatus: "documents_requested",
      });
      if (!session) return res.status(404).json({ error: "Session not found" });

      notifyLiveSessionClients(id, "booking_update", {
        bookingStatus: "documents_requested",
        approvedFlightData: session.approvedFlightData,
      });
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to request documents" });
    }
  });

  // Customer submits documents (name, email, phone, passenger info)
  app.post('/api/live-sessions/:id/submit-documents', async (req, res) => {
    try {
      const id = parseIdRouteParam(req.params.id);
      const token = req.query.token as string;
      if (!token) return res.status(401).json({ error: "Access token required" });

      const session = await storage.getLiveSession(id);
      if (!session || session.accessToken !== token) return res.status(403).json({ error: "Invalid token" });
      if (session.bookingStatus !== "documents_requested") return res.status(400).json({ error: "Documents not requested" });

      const { customerName, customerEmail, customerPhone, passengers } = req.body;
      if (!customerName || !customerEmail || !passengers) {
        return res.status(400).json({ error: "Name, email and passenger details required" });
      }
      if (typeof customerName !== "string" || typeof customerEmail !== "string") {
        return res.status(400).json({ error: "Invalid field types" });
      }
      if (!customerEmail.includes("@")) {
        return res.status(400).json({ error: "Invalid email" });
      }
      if (!Array.isArray(passengers) || passengers.length === 0) {
        return res.status(400).json({ error: "At least one passenger required" });
      }
      for (const pax of passengers) {
        if (!pax.firstName || !pax.lastName || !pax.dateOfBirth) {
          return res.status(400).json({ error: "Each passenger must have firstName, lastName, dateOfBirth" });
        }
      }

      const updated = await storage.updateLiveSession(id, {
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        submittedDocuments: { passengers },
        bookingStatus: "documents_submitted",
      });

      notifyLiveSessionClients(id, "booking_update", {
        bookingStatus: "documents_submitted",
        customerName,
        customerEmail,
        customerPhone,
        submittedDocuments: { passengers },
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit documents" });
    }
  });

  // Admin creates the booking on behalf of the customer
  app.post('/api/live-sessions/admin/:id/create-booking', requireAdmin, async (req, res) => {
    try {
      const id = parseIdRouteParam(req.params.id);
      const session = await storage.getLiveSession(id);
      if (!session) return res.status(404).json({ error: "Session not found" });
      if (session.bookingStatus !== "documents_submitted") {
        return res.status(400).json({ error: "Documents not yet submitted" });
      }

      const flightData = session.approvedFlightData as any;
      const docs = session.submittedDocuments as any;
      if (!flightData || !docs) return res.status(400).json({ error: "Missing flight or document data" });
      if (!session.customerEmail) {
        return res.status(400).json({ error: "Customer email is required before creating a booking" });
      }

      const referenceCode = `MT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const commissionRate = await getCommissionRate();
      const totalPrice = parseFloat(flightData.totalAmount || flightData.price || "0");
      const commissionAmount = totalPrice * (commissionRate / (1 + commissionRate));
      const basePrice = totalPrice - commissionAmount;

      const booking = await storage.createBooking({
        referenceCode,
        userId: null as any,
        status: "pending",
        flightData,
        passengerDetails: docs.passengers,
        totalPrice: totalPrice.toFixed(2),
        currency: flightData.currency || "USD",
        commissionAmount: commissionAmount.toFixed(2),
        contactEmail: session.customerEmail,
        contactPhone: session.customerPhone,
        stripePaymentIntentId: null,
        duffelOrderId: null as any,
      });

      await storage.updateLiveSession(id, {
        bookingId: booking.id,
        bookingStatus: "booking_created",
        submittedDocuments: buildRedactedDocumentPayload(docs.passengers),
      });

      notifyLiveSessionClients(id, "booking_update", {
        bookingStatus: "booking_created",
        bookingId: booking.id,
        referenceCode,
      });
      res.json({ booking, referenceCode });
    } catch (error: any) {
      console.error("Create booking error:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // Admin marks booking as payment pending (manual/external payment)
  app.post('/api/live-sessions/admin/:id/payment-status', requireAdmin, async (req, res) => {
    try {
      const id = parseIdRouteParam(req.params.id);
      const { status } = req.body;
      if (!["payment_pending", "confirmed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const session = await storage.getLiveSession(id);
      if (!session) return res.status(404).json({ error: "Session not found" });

      await storage.updateLiveSession(id, { bookingStatus: status });

      if (status === "confirmed" && session.bookingId) {
        await storage.updateBooking(session.bookingId, { status: "confirmed" });

        // [TRAVEL INTELLIGENCE] Log detailed timeline and transaction
        const booking = await storage.getBooking(session.bookingId);
        if (booking) {
          await storage.createBookingLog({
            bookingId: booking.id,
            event: 'confirmed',
            message: 'Payment confirmed manually by admin'
          });

          await storage.createTransaction({
            bookingId: booking.id,
            type: 'payment',
            amount: booking.totalPrice.toString(),
            currency: booking.currency || 'USD',
            status: 'succeeded',
            metadata: { source: 'manual_admin_confirmation', liveSessionId: id }
          });
        }
      }

      notifyLiveSessionClients(id, "booking_update", {
        bookingStatus: status,
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment status" });
    }
  });

  app.post('/api/live-sessions/admin/:id/reset-booking', requireAdmin, async (req, res) => {
    try {
      const id = parseIdRouteParam(req.params.id);
      const session = await storage.getLiveSession(id);
      if (!session) return res.status(404).json({ error: "Session not found" });

      await storage.updateLiveSession(id, {
        approvedOfferId: null,
        approvedFlightData: null,
        bookingStatus: null,
        customerName: null,
        customerEmail: null,
        customerPhone: null,
        submittedDocuments: null,
        bookingId: null,
      });

      notifyLiveSessionClients(id, "booking_update", {
        bookingStatus: null,
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset booking" });
    }
  });

  // Get booking status for client side
  app.get('/api/live-sessions/:id/booking-status', async (req, res) => {
    try {
      const id = parseIdRouteParam(req.params.id);
      const token = req.query.token as string;
      if (!token) return res.status(401).json({ error: "Access token required" });

      const session = await storage.getLiveSession(id);
      if (!session || session.accessToken !== token) return res.status(403).json({ error: "Invalid token" });

      let referenceCode = null;
      if (session.bookingId) {
        const booking = await storage.getBooking(session.bookingId);
        if (booking) referenceCode = booking.referenceCode;
      }

      res.json({
        bookingStatus: session.bookingStatus,
        approvedFlightData: session.approvedFlightData,
        customerName: session.customerName,
        customerEmail: session.customerEmail,
        bookingId: session.bookingId,
        referenceCode,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get booking status" });
    }
  });

  // ======= PUBLIC API - Zapier Flight Deals =======
  app.get('/api/public/flight-deals', async (_req, res) => {
    try {
      let deals = await getBalancedDeals();
      
      // If we don't have enough deals, trigger a quick background refresh and retry once
      if (deals.length < 4) {
        console.log("[DEALS] Not enough deals found, triggering on-demand automation...");
        await runDealsAutomation();
        deals = await getBalancedDeals();
      }

      const siteUrl = 'https://www.michelstravel.agency';
      const markupRate = await getCommissionRate();

      const formatted = deals.map(deal => {
        let priceValue = deal.price ? parseFloat(deal.price) : 0;
        
        // Apply markup to automatic deals (manual deals usually have final price, but we can verify)
        if (deal.isAutomatic) {
          priceValue = parseFloat((priceValue * (1 + markupRate)).toFixed(2));
        }

        return {
          id: deal.id,
          origin: deal.origin,
          origin_city: deal.originCity || deal.origin,
          destination: deal.destination,
          destination_city: deal.destinationCity || deal.destination,
          departure_date: deal.departureDate || '',
          return_date: deal.returnDate || '',
          price: priceValue ? `${deal.currency || 'USD'} ${priceValue.toFixed(2)}` : '',
          price_value: priceValue,
          currency: deal.currency || 'USD',
          airline: deal.airline || '',
          cabin_class: deal.cabinClass || 'economy',
          stops: deal.stops || 0,
          duration: deal.duration || 'Varia',
          imageUrl: deal.imageUrl || null,
          isAutomatic: deal.isAutomatic,
          headline: deal.headline || `${deal.originCity || deal.origin} → ${deal.destinationCity || deal.destination}`,
          description: deal.description || `Voos a partir de ${deal.currency || 'USD'} ${priceValue.toFixed(2)}. Reserve agora!`,
          booking_url: `${siteUrl}/?origin=${deal.origin}&destination=${deal.destination}`,
          created_at: deal.createdAt,
        };
      });

      res.json({
        deals: formatted,
        count: formatted.length,
        site: siteUrl,
        generated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Public flight deals error:', error);
      res.status(500).json({ error: 'Failed to fetch flight deals' });
    }
  });

  // ======= ADMIN - Featured Deals CRUD =======
  app.get('/api/admin/featured-deals', requireAdmin, async (_req, res) => {
    try {
      const deals = await storage.getFeaturedDeals();
      res.json(deals);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch deals' });
    }
  });

  app.post('/api/admin/featured-deals', requireAdmin, async (req, res) => {
    try {
      const parsed = insertFeaturedDealSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid data', details: parsed.error.flatten() });
      }
      const deal = await storage.createFeaturedDeal(parsed.data);
      res.json(deal);
    } catch (error: any) {
      console.error('Create deal error:', error);
      res.status(500).json({ error: 'Failed to create deal', message: error.message });
    }
  });

  app.patch('/api/admin/featured-deals/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseIdRouteParam(req.params.id);
      const partial = insertFeaturedDealSchema.partial().safeParse(req.body);
      if (!partial.success) {
        return res.status(400).json({ error: 'Invalid data', details: partial.error.flatten() });
      }
      const deal = await storage.updateFeaturedDeal(id, partial.data);
      if (!deal) return res.status(404).json({ error: 'Deal not found' });
      res.json(deal);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update deal' });
    }
  });

  app.delete('/api/admin/featured-deals/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseIdRouteParam(req.params.id);
      await storage.deleteFeaturedDeal(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete deal' });
    }
  });

  // === SENIOR ALERTS API ===
  app.get('/api/senior-alerts', requireAdmin, async (req, res) => {
    try {
      const alerts = await db.select().from(seniorAlerts).orderBy(desc(seniorAlerts.createdAt)).limit(100);
      // Enriquecer com dados do passageiro e voo, se necessário
      res.json(alerts);
    } catch (error) {
      console.error('Erro ao buscar senior alerts:', error);
      res.status(500).json({ error: 'Erro ao buscar alertas sênior' });
    }
  });

  // === TRAVEL INTELLIGENCE ADMIN APIs ===
  
  // Knowledge Base
  app.get('/api/admin/knowledge-base', requireAdmin, async (_req, res) => {
    try {
      const items = await storage.getKnowledgeBaseEntries();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch knowledge base" });
    }
  });

  app.post('/api/admin/knowledge-base', requireAdmin, async (req, res) => {
    try {
      const entry = await storage.createKnowledgeBaseEntry(req.body);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to create knowledge entry" });
    }
  });

  app.delete('/api/admin/knowledge-base/:id', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      await storage.deleteKnowledgeBaseEntry(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete knowledge entry" });
    }
  });

  // CRM - Customers
  app.get('/api/admin/customers', requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string || "100");
      const list = await storage.getCustomers(limit);
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.patch('/api/admin/customers/:id', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const { notes, tags } = req.body;
      const updated = await storage.updateCustomer(id, { notes, tags });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // Financial - Transactions
  app.get('/api/admin/transactions', requireAdmin, async (_req, res) => {
    try {
      const list = await storage.getTransactions();
      res.json(list);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Operational - Booking Logs
  app.get('/api/admin/bookings/:id/logs', requireAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const logs = await storage.getBookingLogs(id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking logs" });
    }
  });

  // === SCANNER BRIDGE ROUTES ===

  app.post('/api/scanner/session', async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ error: "sessionId required" });
      const session = await storage.createScannerSession({ sessionId, data: null });
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create scanner session" });
    }
  });

  app.get('/api/scanner/session/:sessionId', async (req, res) => {
    try {
      const session = await storage.getScannerSession(req.params.sessionId);
      if (!session) return res.status(404).json({ error: "Session not found or expired" });
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to get scanner session" });
    }
  });

  app.post('/api/scanner/result/:sessionId', async (req, res) => {
    try {
      const { data } = req.body;
      if (!data) return res.status(400).json({ error: "data required" });
      const session = await storage.updateScannerSession(req.params.sessionId, data);
      if (!session) return res.status(404).json({ error: "Session not found or expired" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save scan result" });
    }
  });
}
