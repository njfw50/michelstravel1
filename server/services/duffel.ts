import { Duffel } from "@duffel/api";
import { type FlightOffer, type FlightSearchParams } from "@shared/schema";

if (!process.env.DUFFEL_API_TOKEN) {
  console.warn("DUFFEL_API_TOKEN not set. Flight search will fail.");
}

const duffel = new Duffel({
  token: process.env.DUFFEL_API_TOKEN || "mock_token",
});

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

    // Duffel returns a list of offers. We limit to 50 to avoid payload bloat.
    const offers = await duffel.offers.list({
      offer_request_id: offerRequest.data.id,
      limit: 50,
    });

    return offers.data.map((offer) => {
      // We focus on the first slice (outbound) for the main card details
      // In a real app, you'd handle return slices properly in the UI
      const slice = offer.slices[0];
      const segment = slice.segments[0];
      const lastSegment = slice.segments[slice.segments.length - 1];
      const airline = offer.owner.name;
      const logoUrl = offer.owner.logo_symbol_url;

      // Calculate simple duration from the slice data
      // Duffel provides duration in ISO 8601 format (PT2H30M)
      
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
      };
    });
  } catch (error) {
    console.error("Duffel API Error:", error);
    // Return empty array instead of throwing to prevent crashing the UI
    return [];
  }
}

export async function getFlight(id: string): Promise<FlightOffer | null> {
  try {
    if (!process.env.DUFFEL_API_TOKEN) {
      console.warn("Using mock data because DUFFEL_API_TOKEN is missing");
      // Return a mock offer if needed, or null
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
    };
  } catch (error) {
    console.error("Duffel getFlight Error:", error);
    return null;
  }
}

export async function searchPlaces(query: string) {
  try {
    if (!process.env.DUFFEL_API_TOKEN) return [];

    // Use direct fetch as the SDK might not expose suggestions yet
    const response = await fetch(
      `https://api.duffel.com/places/suggestions?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'Duffel-Version': 'beta', 
          'Authorization': `Bearer ${process.env.DUFFEL_API_TOKEN}`
        }
      }
    );

    if (!response.ok) {
        throw new Error(`Duffel Places API error: ${response.statusText}`);
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



