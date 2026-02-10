import { Duffel } from "@duffel/api";
import { storage } from "../storage";

if (!process.env.DUFFEL_API_TOKEN) {
  console.warn("DUFFEL_API_TOKEN not set. Flight search will fail.");
}

const duffel = new Duffel({
  token: process.env.DUFFEL_API_TOKEN || "mock_token",
});

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
}

export interface FlightOffer {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string; // ISO 8601 duration string (e.g. PT4H30M)
  price: number;
  currency: string;
  stops: number;
  logoUrl?: string | null;
}

export async function searchFlights(params: SearchParams): Promise<FlightOffer[]> {
  try {
    const passengers = [
      ...Array(params.adults || params.passengers || 1).fill({ type: "adult" }),
      ...Array(params.children || 0).fill({ type: "child" }),
      ...Array(params.infants || 0).fill({ type: "infant_without_seat" }),
    ];

    const offerRequest = await duffel.offerRequests.create({
      slices: [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departureDate,
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
      const segment = offer.slices[0].segments[0];
      const airline = offer.owner.name;
      const logoUrl = offer.owner.logo_symbol_url;

      return {
        id: offer.id,
        airline,
        flightNumber: `${segment.operating_carrier.iata_code}${segment.operating_carrier_flight_number}`,
        departureTime: segment.departing_at,
        arrivalTime: segment.arriving_at,
        duration: segment.duration || "PT0H", // Use duration directly or format it
        price: parseFloat(offer.total_amount),
        currency: offer.total_currency,
        stops: offer.slices[0].segments.length - 1,
        logoUrl,
      };
    });
  } catch (error) {
    console.error("Duffel API Error:", error);
    // Fallback to mock data if API fails (or token invalid)
    return [];
  }
}

export async function createBooking(offerId: string, passengers: any[]) {
    // In a real implementation with payment, this would confirm with Duffel.
    // For now, we simulate the booking creation or use Duffel's "orders" API.
    try {
        /*
        const order = await duffel.orders.create({
            selected_offers: [offerId],
            passengers: passengers.map(p => ({
                id: p.id, // ID from the offer request's passengers list
                given_name: p.given_name,
                family_name: p.family_name,
                gender: p.gender,
                title: p.title,
                born_on: p.born_on,
                email: p.email,
                phone_number: p.phone_number,
            })),
            type: 'instant',
            payments: [{
                type: 'balance',
                currency: 'USD',
                amount: '...'
            }]
        });
        return order.data;
        */
       // For MVP/Demo without real payments, we return a mock success
       return { id: `ord_${Math.random().toString(36).substr(2, 9)}`, status: 'confirmed' };
    } catch (error) {
        console.error("Duffel Booking Error:", error);
        throw error;
    }
}
