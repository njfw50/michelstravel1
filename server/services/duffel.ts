import { Duffel } from "@duffel/api";
import { type FlightOffer, type FlightSearchParams, type FlightSlice, type FlightSegment, type FlightPassengerInfo } from "@shared/schema";
import { db } from "../db";
import { siteSettings } from "@shared/schema";

const DUFFEL_BASE = "https://api.duffel.com";

function getTestToken(): string {
  return process.env.DUFFEL_API_TOKEN || '';
}

function getLiveToken(): string {
  return process.env.DUFFEL_LIVE_TOKEN || '';
}

let _currentTestMode: boolean = true;

export async function loadTestModeSetting(): Promise<boolean> {
  try {
    const [settings] = await db.select().from(siteSettings).limit(1);
    _currentTestMode = settings?.testMode ?? true;
    return _currentTestMode;
  } catch {
    return true;
  }
}

export function setTestModeCache(value: boolean) {
  _currentTestMode = value;
}

export function getActiveToken(): string {
  if (_currentTestMode) {
    return getTestToken();
  }
  const live = getLiveToken();
  if (live) return live;
  console.warn("[WARNING] Production mode active but no DUFFEL_LIVE_TOKEN found - Duffel calls will fail");
  return '';
}

function getActiveDuffelClient(): Duffel {
  const token = getActiveToken();
  return new Duffel({ token: token || "mock_token" });
}

const headers = () => ({
  'Accept': 'application/json',
  'Accept-Encoding': 'gzip',
  'Duffel-Version': 'v2',
  'Authorization': `Bearer ${getActiveToken()}`
});

export function isTestMode(): boolean {
  return _currentTestMode;
}

export function activeTokenIsTest(): boolean {
  const token = getActiveToken();
  return token.startsWith('duffel_test_') || !token;
}

export function hasLiveToken(): boolean {
  const live = getLiveToken();
  return !!live && live.startsWith('duffel_live_');
}

export function hasTestToken(): boolean {
  const test = getTestToken();
  return !!test && test.startsWith('duffel_test_');
}

export interface DuffelAirline {
  id: string;
  name: string;
  iataCode: string | null;
  logoUrl: string | null;
  logoSymbolUrl: string | null;
  conditionsUrl: string | null;
}

export interface DuffelAirport {
  id: string;
  name: string;
  iataCode: string | null;
  icaoCode: string | null;
  cityName: string | null;
  countryName: string | null;
  latitude: number | null;
  longitude: number | null;
  timeZone: string | null;
}

export interface DuffelAircraft {
  id: string;
  name: string;
  iataCode: string | null;
}

let airlinesCache: DuffelAirline[] = [];
let airlinesCacheTime = 0;
let airportsCacheMap: Map<string, DuffelAirport> = new Map();
let airportsCacheTime = 0;
let aircraftCache: DuffelAircraft[] = [];
let aircraftCacheTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000;

async function duffelGet(path: string) {
  const res = await fetch(`${DUFFEL_BASE}${path}`, { headers: headers() });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Duffel API error ${path}: ${res.status}`, body);
    throw new Error(`Duffel API error: ${res.status}`);
  }
  return res.json();
}

async function duffelPaginate(path: string, limit = 200): Promise<any[]> {
  const all: any[] = [];
  let after: string | null = null;
  
  while (true) {
    const url = after 
      ? `${path}?limit=${limit}&after=${after}` 
      : `${path}?limit=${limit}`;
    
    const data = await duffelGet(url);
    all.push(...data.data);
    
    if (data.meta?.after) {
      after = data.meta.after;
    } else {
      break;
    }
    
    if (all.length > 5000) break;
  }
  
  return all;
}

export async function getAirlines(): Promise<DuffelAirline[]> {
  if (airlinesCache.length > 0 && Date.now() - airlinesCacheTime < CACHE_TTL) {
    return airlinesCache;
  }
  
  if (!getActiveToken()) return [];
  
  try {
    console.log(`Fetching airlines from Duffel API (${_currentTestMode ? 'TEST' : 'LIVE'} mode)...`);
    const raw = await duffelPaginate("/air/airlines");
    
    airlinesCache = raw.map((a: any) => ({
      id: a.id,
      name: a.name,
      iataCode: a.iata_code,
      logoUrl: a.logo_lockup_url || null,
      logoSymbolUrl: a.logo_symbol_url || null,
      conditionsUrl: a.conditions_of_carriage_url || null,
    }));
    airlinesCacheTime = Date.now();
    
    console.log(`Cached ${airlinesCache.length} airlines`);
    return airlinesCache;
  } catch (error) {
    console.error("Failed to fetch airlines:", error);
    return airlinesCache;
  }
}

export async function getAirports(): Promise<DuffelAirport[]> {
  if (airportsCacheMap.size > 0 && Date.now() - airportsCacheTime < CACHE_TTL) {
    return Array.from(airportsCacheMap.values());
  }

  if (!getActiveToken()) return [];

  try {
    console.log(`Fetching airports from Duffel API (${_currentTestMode ? 'TEST' : 'LIVE'} mode)...`);
    const raw = await duffelPaginate("/air/airports");
    
    airportsCacheMap = new Map();
    for (const a of raw) {
      const airport: DuffelAirport = {
        id: a.id,
        name: a.name,
        iataCode: a.iata_code,
        icaoCode: a.icao_code,
        cityName: a.city_name || a.city?.name || null,
        countryName: a.iata_country_code || null,
        latitude: a.latitude ? parseFloat(a.latitude) : null,
        longitude: a.longitude ? parseFloat(a.longitude) : null,
        timeZone: a.time_zone || null,
      };
      if (airport.iataCode) {
        airportsCacheMap.set(airport.iataCode, airport);
      }
    }
    airportsCacheTime = Date.now();
    
    console.log(`Cached ${airportsCacheMap.size} airports`);
    return Array.from(airportsCacheMap.values());
  } catch (error) {
    console.error("Failed to fetch airports:", error);
    return Array.from(airportsCacheMap.values());
  }
}

export function getAirportByIata(iata: string): DuffelAirport | undefined {
  return airportsCacheMap.get(iata);
}

export async function getAircraft(): Promise<DuffelAircraft[]> {
  if (aircraftCache.length > 0 && Date.now() - aircraftCacheTime < CACHE_TTL) {
    return aircraftCache;
  }

  if (!getActiveToken()) return [];

  try {
    console.log(`Fetching aircraft from Duffel API (${_currentTestMode ? 'TEST' : 'LIVE'} mode)...`);
    const raw = await duffelPaginate("/air/aircraft");
    
    aircraftCache = raw.map((a: any) => ({
      id: a.id,
      name: a.name,
      iataCode: a.iata_code,
    }));
    aircraftCacheTime = Date.now();
    
    console.log(`Cached ${aircraftCache.length} aircraft types`);
    return aircraftCache;
  } catch (error) {
    console.error("Failed to fetch aircraft:", error);
    return aircraftCache;
  }
}

export function getAirlineByIata(iata: string): DuffelAirline | undefined {
  return airlinesCache.find(a => a.iataCode === iata);
}

export function getAircraftByIata(iata: string): DuffelAircraft | undefined {
  return aircraftCache.find(a => a.iataCode === iata);
}

export function clearReferenceDataCache() {
  airlinesCache = [];
  airlinesCacheTime = 0;
  airportsCacheMap = new Map();
  airportsCacheTime = 0;
  aircraftCache = [];
  aircraftCacheTime = 0;
  console.log("Duffel reference data cache cleared (token switch)");
}

let _testModeLastChecked = 0;
const TEST_MODE_CHECK_TTL = 10000;

export async function ensureTestModeLoaded(): Promise<boolean> {
  if (Date.now() - _testModeLastChecked < TEST_MODE_CHECK_TTL) {
    return _currentTestMode;
  }
  _testModeLastChecked = Date.now();
  return await loadTestModeSetting();
}

export async function initializeReferenceData() {
  await loadTestModeSetting();
  _testModeLastChecked = Date.now();
  console.log(`Duffel initializing in ${_currentTestMode ? 'TEST' : 'LIVE'} mode`);

  if (!getActiveToken()) {
    console.warn("Skipping reference data initialization - no API token for current mode");
    return;
  }
  
  try {
    await Promise.all([
      getAirlines(),
      getAirports(),
      getAircraft(),
    ]);
    console.log("Duffel reference data initialized successfully");
  } catch (error) {
    console.error("Failed to initialize reference data:", error);
  }
}

function formatCabinClass(cabinClass: string): string {
  const map: Record<string, string> = {
    economy: "Economy",
    premium_economy: "Premium Economy",
    business: "Business",
    first: "First Class",
  };
  return map[cabinClass] || cabinClass;
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  try {
    const token = getActiveToken();
    if (!token) {
      console.warn("No Duffel token available");
      return []; 
    }

    console.log(`Searching Duffel (${_currentTestMode ? 'TEST' : 'LIVE'} mode) with params:`, params);

    const duffel = getActiveDuffelClient();

    const passengers = [
      ...Array(parseInt(params.adults || params.passengers || "1")).fill({ type: "adult" }),
      ...Array(parseInt(params.children || "0")).fill({ type: "child" }),
      ...Array(parseInt(params.infants || "0")).fill({ type: "infant_without_seat" }),
    ];

    const offerRequest = await duffel.offerRequests.create({
      slices: [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.date,
        } as any,
        ...(params.returnDate
          ? [
              {
                origin: params.destination,
                destination: params.origin,
                departure_date: params.returnDate,
              } as any,
            ]
          : []),
      ],
      passengers,
      cabin_class: (params.cabinClass as any) || "economy",
    });

    const offers = await duffel.offers.list({
      offer_request_id: offerRequest.data.id,
      limit: 50,
    });

    return offers.data.map((offer) => {
      const slice = offer.slices[0];
      const segment = slice.segments[0];
      const lastSegment = slice.segments[slice.segments.length - 1];
      const airline = offer.owner.name;
      const logoUrl = offer.owner.logo_symbol_url;

      const aircraftIata = (segment as any).aircraft?.iata_code || null;
      const aircraftInfo = aircraftIata ? getAircraftByIata(aircraftIata) : null;

      const originAirport = getAirportByIata(segment.origin.iata_code || "");
      const destAirport = getAirportByIata(lastSegment.destination.iata_code || "");

      const slices: FlightSlice[] = offer.slices.map((s: any) => {
        const firstSeg = s.segments[0];
        const lastSeg = s.segments[s.segments.length - 1];
        const originAp = getAirportByIata(firstSeg.origin.iata_code || "");
        const destAp = getAirportByIata(lastSeg.destination.iata_code || "");

        const segments: FlightSegment[] = s.segments.map((seg: any) => {
          const segAircraftIata = seg.aircraft?.iata_code || null;
          const segAircraft = segAircraftIata ? getAircraftByIata(segAircraftIata) : null;
          const segOrigin = getAirportByIata(seg.origin.iata_code || "");
          const segDest = getAirportByIata(seg.destination.iata_code || "");

          return {
            segmentId: seg.id,
            carrierCode: seg.operating_carrier.iata_code || seg.marketing_carrier?.iata_code || "",
            carrierName: seg.operating_carrier.name || airline,
            flightNumber: `${seg.operating_carrier.iata_code || ""}${seg.operating_carrier_flight_number || ""}`,
            aircraftType: segAircraft?.name || null,
            departureTime: seg.departing_at,
            arrivalTime: seg.arriving_at,
            duration: seg.duration || "PT0H",
            originCode: seg.origin.iata_code || "",
            originName: seg.origin.name || "",
            originCity: segOrigin?.cityName || seg.origin.city_name || null,
            originTerminal: seg.origin_terminal || null,
            destinationCode: seg.destination.iata_code || "",
            destinationName: seg.destination.name || "",
            destinationCity: segDest?.cityName || seg.destination.city_name || null,
            destinationTerminal: seg.destination_terminal || null,
          };
        });

        return {
          duration: s.duration || "PT0H",
          originCode: firstSeg.origin.iata_code || "",
          originCity: originAp?.cityName || null,
          destinationCode: lastSeg.destination.iata_code || "",
          destinationCity: destAp?.cityName || null,
          segments,
        };
      });

      const passengers: FlightPassengerInfo[] = (offer.passengers || []).map((pax: any) => {
        const paxSlice = slice as any;
        const paxSegment = paxSlice?.segments?.[0];
        const paxCabin = paxSegment?.passengers?.find((p: any) => p.passenger_id === pax.id);

        return {
          passengerId: pax.id,
          passengerType: pax.type || "adult",
          cabinClass: paxCabin?.cabin_class || (params.cabinClass as string) || "economy",
          cabinClassName: paxCabin?.cabin_class_marketing_name || formatCabinClass(paxCabin?.cabin_class || params.cabinClass || "economy"),
          baggages: (paxCabin?.baggages || []).map((b: any) => ({
            type: b.type || "checked",
            quantity: b.quantity ?? 0,
          })),
          fareBrandName: paxCabin?.fare_brand_name || null,
        };
      });

      const conditions = (offer as any).conditions || null;
      
      return {
        id: offer.id,
        airline,
        flightNumber: `${segment.operating_carrier.iata_code}${segment.operating_carrier_flight_number}`,
        departureTime: segment.departing_at,
        arrivalTime: lastSegment.arriving_at,
        duration: slice.duration || "PT0H", 
        price: parseFloat(offer.total_amount),
        currency: offer.total_currency,
        stops: slice.segments.length - 1,
        logoUrl,
        aircraftType: aircraftInfo?.name || null,
        originCity: originAirport?.cityName || segment.origin.iata_code || params.origin,
        destinationCity: destAirport?.cityName || lastSegment.destination.iata_code || params.destination,
        originCode: segment.origin.iata_code || params.origin,
        destinationCode: lastSegment.destination.iata_code || params.destination,
        cabinClass: passengers[0]?.cabinClass || (params.cabinClass as string) || "economy",
        slices,
        passengers,
        passengerIdentityDocumentsRequired: (offer as any).passenger_identity_documents_required ?? false,
        taxAmount: (offer as any).tax_amount || null,
        baseAmount: (offer as any).base_amount || null,
        conditions: conditions ? {
          changeBeforeDeparture: conditions.change_before_departure ? {
            allowed: conditions.change_before_departure.allowed ?? false,
            penaltyAmount: conditions.change_before_departure.penalty_amount || undefined,
            penaltyCurrency: conditions.change_before_departure.penalty_currency || undefined,
          } : null,
          refundBeforeDeparture: conditions.refund_before_departure ? {
            allowed: conditions.refund_before_departure.allowed ?? false,
            penaltyAmount: conditions.refund_before_departure.penalty_amount || undefined,
            penaltyCurrency: conditions.refund_before_departure.penalty_currency || undefined,
          } : null,
        } : null,
      };
    });
  } catch (error) {
    console.error("Duffel API Error:", error);
    return [];
  }
}

export async function getFlight(id: string): Promise<FlightOffer | null> {
  try {
    const token = getActiveToken();
    if (!token) {
      return {
        id: id,
        airline: "Mock Airline",
        flightNumber: "MK123",
        departureTime: new Date().toISOString(),
        arrivalTime: new Date(Date.now() + 3600000 * 4).toISOString(),
        duration: "PT4H",
        price: 450,
        currency: "USD",
        stops: 0,
        logoUrl: null,
      };
    }

    const duffel = getActiveDuffelClient();
    const offer = await duffel.offers.get(id);
    const offerData = offer.data as any;
    
    const slice = offerData.slices[0];
    const segment = slice.segments[0];
    const lastSegment = slice.segments[slice.segments.length - 1];
    const airline = offerData.owner.name;
    const logoUrl = offerData.owner.logo_symbol_url;

    const aircraftIata = segment.aircraft?.iata_code || null;
    const aircraftInfo = aircraftIata ? getAircraftByIata(aircraftIata) : null;

    const originAirport = getAirportByIata(segment.origin.iata_code || "");
    const destAirport = getAirportByIata(lastSegment.destination.iata_code || "");

    const slices: FlightSlice[] = offerData.slices.map((s: any) => {
      const firstSeg = s.segments[0];
      const lastSeg = s.segments[s.segments.length - 1];
      const originAp = getAirportByIata(firstSeg.origin.iata_code || "");
      const destAp = getAirportByIata(lastSeg.destination.iata_code || "");

      const segments: FlightSegment[] = s.segments.map((seg: any) => {
        const segAircraftIata = seg.aircraft?.iata_code || null;
        const segAircraft = segAircraftIata ? getAircraftByIata(segAircraftIata) : null;
        const segOrigin = getAirportByIata(seg.origin.iata_code || "");
        const segDest = getAirportByIata(seg.destination.iata_code || "");

        return {
          segmentId: seg.id,
          carrierCode: seg.operating_carrier.iata_code || seg.marketing_carrier?.iata_code || "",
          carrierName: seg.operating_carrier.name || airline,
          flightNumber: `${seg.operating_carrier.iata_code || ""}${seg.operating_carrier_flight_number || ""}`,
          aircraftType: segAircraft?.name || null,
          departureTime: seg.departing_at,
          arrivalTime: seg.arriving_at,
          duration: seg.duration || "PT0H",
          originCode: seg.origin.iata_code || "",
          originName: seg.origin.name || "",
          originCity: segOrigin?.cityName || seg.origin.city_name || null,
          originTerminal: seg.origin_terminal || null,
          destinationCode: seg.destination.iata_code || "",
          destinationName: seg.destination.name || "",
          destinationCity: segDest?.cityName || seg.destination.city_name || null,
          destinationTerminal: seg.destination_terminal || null,
        };
      });

      return {
        duration: s.duration || "PT0H",
        originCode: firstSeg.origin.iata_code || "",
        originCity: originAp?.cityName || null,
        destinationCode: lastSeg.destination.iata_code || "",
        destinationCity: destAp?.cityName || null,
        segments,
      };
    });

    const passengers: FlightPassengerInfo[] = (offerData.passengers || []).map((pax: any) => {
      const paxSegment = slice.segments?.[0];
      const paxCabin = paxSegment?.passengers?.find((p: any) => p.passenger_id === pax.id);

      return {
        passengerId: pax.id,
        passengerType: pax.type || "adult",
        cabinClass: paxCabin?.cabin_class || "economy",
        cabinClassName: paxCabin?.cabin_class_marketing_name || formatCabinClass(paxCabin?.cabin_class || "economy"),
        baggages: (paxCabin?.baggages || []).map((b: any) => ({
          type: b.type || "checked",
          quantity: b.quantity ?? 0,
        })),
        fareBrandName: paxCabin?.fare_brand_name || null,
      };
    });

    const conditions = offerData.conditions || null;

    return {
      id: offerData.id,
      airline,
      flightNumber: `${segment.operating_carrier.iata_code}${segment.operating_carrier_flight_number}`,
      departureTime: segment.departing_at,
      arrivalTime: lastSegment.arriving_at,
      duration: slice.duration || "PT0H",
      price: parseFloat(offerData.total_amount),
      currency: offerData.total_currency,
      stops: slice.segments.length - 1,
      logoUrl,
      aircraftType: aircraftInfo?.name || null,
      originCity: originAirport?.cityName || segment.origin.iata_code || "",
      destinationCity: destAirport?.cityName || lastSegment.destination.iata_code || "",
      originCode: segment.origin.iata_code || "",
      destinationCode: lastSegment.destination.iata_code || "",
      cabinClass: passengers[0]?.cabinClass || "economy",
      slices,
      passengers,
      passengerIdentityDocumentsRequired: offerData.passenger_identity_documents_required ?? false,
      taxAmount: offerData.tax_amount || null,
      baseAmount: offerData.base_amount || null,
      conditions: conditions ? {
        changeBeforeDeparture: conditions.change_before_departure ? {
          allowed: conditions.change_before_departure.allowed ?? false,
          penaltyAmount: conditions.change_before_departure.penalty_amount || undefined,
          penaltyCurrency: conditions.change_before_departure.penalty_currency || undefined,
        } : null,
        refundBeforeDeparture: conditions.refund_before_departure ? {
          allowed: conditions.refund_before_departure.allowed ?? false,
          penaltyAmount: conditions.refund_before_departure.penalty_amount || undefined,
          penaltyCurrency: conditions.refund_before_departure.penalty_currency || undefined,
        } : null,
      } : null,
    };
  } catch (error) {
    console.error("Duffel getFlight Error:", error);
    return null;
  }
}

export async function searchPlaces(query: string) {
  try {
    if (!getActiveToken()) return [];

    const response = await fetch(
      `https://api.duffel.com/places/suggestions?query=${encodeURIComponent(query)}`,
      { headers: headers() }
    );

    if (!response.ok) {
        console.error(`Duffel Places API error: ${response.status} ${response.statusText}`);
        const body = await response.text();
        console.error("Duffel Response Body:", body);
        return [];
    }

    const data = await response.json();
    return data.data.map((place: any) => ({
      id: place.id,
      name: place.name,
      iataCode: place.iata_code,
      cityName: place.city_name,
      countryName: place.country_name,
      type: place.type 
    }));
  } catch (error) {
    console.error("Duffel searchPlaces Error:", error);
    return [];
  }
}

export async function getSeatMap(offerId: string): Promise<any> {
  try {
    const token = getActiveToken();
    if (!token) return null;

    const response = await fetch(`${DUFFEL_BASE}/air/seat_maps?offer_id=${offerId}`, {
      headers: headers(),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Duffel Seat Map API error: ${response.status}`, body);
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Duffel getSeatMap Error:", error);
    return null;
  }
}

export async function getOfferServices(offerId: string): Promise<any[]> {
  try {
    const token = getActiveToken();
    if (!token) return [];

    const duffel = getActiveDuffelClient();
    const response = await fetch(
      `${DUFFEL_BASE}/air/offers/${offerId}/available_services`,
      { headers: headers() }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`Duffel Services API error: ${response.status}`, body);
      return [];
    }

    const data = await response.json();
    return (data.data || []).map((service: any) => ({
      id: service.id,
      type: service.type,
      totalAmount: service.total_amount,
      totalCurrency: service.total_currency,
      maxQuantity: service.maximum_quantity || 1,
      passengerIds: service.passenger_ids || [],
      segmentIds: service.segment_ids || [],
      metadata: service.metadata || {},
    }));
  } catch (error) {
    console.error("Duffel getOfferServices Error:", error);
    return [];
  }
}

export async function cancelDuffelOrder(orderId: string): Promise<{ refundAmount?: string; refundCurrency?: string; success: boolean }> {
  try {
    const token = getActiveToken();
    if (!token) return { success: false };

    const duffel = getActiveDuffelClient();

    const cancellation = await duffel.orderCancellations.create({
      order_id: orderId,
    });

    const refundAmount = (cancellation.data as any).refund_amount;
    const refundCurrency = (cancellation.data as any).refund_currency;

    await duffel.orderCancellations.confirm(cancellation.data.id);

    return {
      success: true,
      refundAmount,
      refundCurrency,
    };
  } catch (error: any) {
    console.error("Duffel cancelOrder Error:", error?.errors || error?.message || error);
    return { success: false };
  }
}

export async function getRefundQuote(orderId: string): Promise<{ refundAmount?: string; refundCurrency?: string; allowed: boolean }> {
  try {
    const token = getActiveToken();
    if (!token) return { allowed: false };

    const duffel = getActiveDuffelClient();
    const cancellation = await duffel.orderCancellations.create({
      order_id: orderId,
    });

    return {
      allowed: true,
      refundAmount: (cancellation.data as any).refund_amount,
      refundCurrency: (cancellation.data as any).refund_currency,
    };
  } catch (error: any) {
    console.error("Duffel getRefundQuote Error:", error?.errors || error?.message || error);
    return { allowed: false };
  }
}

export interface DuffelPassenger {
  passengerId: string;
  givenName: string;
  familyName: string;
  bornOn: string;
  gender: "m" | "f";
  email: string;
  phoneNumber: string;
  documentType?: string;
  documentNumber?: string;
  documentExpiryDate?: string;
  documentIssuingCountry?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  passportIssuingCountry?: string;
  nationality?: string;
  type: string;
}

export async function createDuffelOrder(
  offerId: string,
  passengers: DuffelPassenger[]
): Promise<{ orderId: string; bookingReference: string } | null> {
  try {
    const token = getActiveToken();
    if (!token) {
      console.warn("No Duffel token available for order creation");
      return null;
    }

    const duffel = getActiveDuffelClient();

    const duffelPassengers = passengers.map(pax => {
      const passenger: any = {
        id: pax.passengerId,
        given_name: pax.givenName,
        family_name: pax.familyName,
        born_on: pax.bornOn,
        gender: pax.gender,
        email: pax.email,
        phone_number: pax.phoneNumber.startsWith("+") ? pax.phoneNumber : `+${pax.phoneNumber}`,
        type: pax.type || "adult",
      };

      const docNumber = pax.documentNumber || pax.passportNumber;
      if (docNumber) {
        const docTypeMap: Record<string, string> = {
          "passport": "passport",
          "national_id": "identity_card",
          "drivers_license": "identity_card",
          "travel_document": "passport",
          "other": "identity_card",
        };
        const duffelDocType = docTypeMap[pax.documentType || "passport"] || "passport";
        passenger.identity_documents = [{
          type: duffelDocType,
          unique_identifier: docNumber,
          expires_on: pax.documentExpiryDate || pax.passportExpiryDate || undefined,
          issuing_country_code: pax.documentIssuingCountry || pax.passportIssuingCountry || undefined,
        }];
      }

      return passenger;
    });

    const order = await duffel.orders.create({
      type: "instant",
      selected_offers: [offerId],
      passengers: duffelPassengers,
      payments: [{
        type: "balance",
        amount: "0",
        currency: "USD",
      }],
    });

    return {
      orderId: order.data.id,
      bookingReference: order.data.booking_reference || order.data.id,
    };
  } catch (error: any) {
    console.error("Duffel createOrder Error:", error?.errors || error?.message || error);
    return null;
  }
}
