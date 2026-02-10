import { Duffel } from "@duffel/api";
import { type FlightOffer, type FlightSearchParams } from "@shared/schema";

if (!process.env.DUFFEL_API_TOKEN) {
  console.warn("DUFFEL_API_TOKEN not set. Flight search will fail.");
}

const duffel = new Duffel({
  token: process.env.DUFFEL_API_TOKEN || "mock_token",
});

const DUFFEL_BASE = "https://api.duffel.com";
const headers = () => ({
  'Accept': 'application/json',
  'Accept-Encoding': 'gzip',
  'Duffel-Version': 'v2',
  'Authorization': `Bearer ${process.env.DUFFEL_API_TOKEN}`
});

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
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
  
  if (!process.env.DUFFEL_API_TOKEN) return [];
  
  try {
    console.log("Fetching airlines from Duffel API...");
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

  if (!process.env.DUFFEL_API_TOKEN) return [];

  try {
    console.log("Fetching airports from Duffel API...");
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

  if (!process.env.DUFFEL_API_TOKEN) return [];

  try {
    console.log("Fetching aircraft from Duffel API...");
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

export async function initializeReferenceData() {
  if (!process.env.DUFFEL_API_TOKEN) {
    console.warn("Skipping reference data initialization - no API token");
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

export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  try {
    if (!process.env.DUFFEL_API_TOKEN) {
      console.warn("Using mock data because DUFFEL_API_TOKEN is missing");
      return []; 
    }

    console.log("Searching Duffel with params:", params);

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
      };
    });
  } catch (error) {
    console.error("Duffel API Error:", error);
    return [];
  }
}

export async function getFlight(id: string): Promise<FlightOffer | null> {
  try {
    if (!process.env.DUFFEL_API_TOKEN) {
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
        logoUrl: null
      };
    }

    const offer = await duffel.offers.get(id);
    
    const slice = offer.data.slices[0];
    const segment = slice.segments[0];
    const lastSegment = slice.segments[slice.segments.length - 1];
    const airline = offer.data.owner.name;
    const logoUrl = offer.data.owner.logo_symbol_url;

    const aircraftIata = (segment as any).aircraft?.iata_code || null;
    const aircraftInfo = aircraftIata ? getAircraftByIata(aircraftIata) : null;

    return {
      id: offer.data.id,
      airline,
      flightNumber: `${segment.operating_carrier.iata_code}${segment.operating_carrier_flight_number}`,
      departureTime: segment.departing_at,
      arrivalTime: lastSegment.arriving_at,
      duration: slice.duration || "PT0H",
      price: parseFloat(offer.data.total_amount),
      currency: offer.data.total_currency,
      stops: slice.segments.length - 1,
      logoUrl,
      aircraftType: aircraftInfo?.name || null,
      originCity: segment.origin.iata_code || "",
      destinationCity: lastSegment.destination.iata_code || "",
      originCode: segment.origin.iata_code || "",
      destinationCode: lastSegment.destination.iata_code || "",
    };
  } catch (error) {
    console.error("Duffel getFlight Error:", error);
    return null;
  }
}

export async function searchPlaces(query: string) {
  try {
    if (!process.env.DUFFEL_API_TOKEN) return [];

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
