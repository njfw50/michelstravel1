/**
 * API Configuration for Michels Travel Mobile App
 * Integrates Duffel (Flight Search) and Stripe (Payment Processing)
 */

export const DUFFEL_CONFIG = {
  baseUrl: process.env.REACT_APP_DUFFEL_BASE_URL || "https://api.duffel.com",
  apiKey: process.env.REACT_APP_DUFFEL_API_KEY || "",
  version: "v1",
  timeout: 30000,
  cabinClasses: ["economy", "premium_economy", "business", "first"],
  maxPassengers: 9,
  maxLegs: 6,
  minAdvanceBooking: 0,
  maxAdvanceBooking: 365,
};

export const STRIPE_CONFIG = {
  publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "",
  apiVersion: "2024-04-10",
  timeout: 30000,
  currency: "USD",
  paymentMethods: ["card", "ideal", "bancontact", "giropay", "eps", "p24", "alipay"],
  minAmount: 100,
  maxAmount: 999999,
  automaticTax: true,
  savePaymentMethod: true,
};

export interface FlightSearchRequest {
  outboundDate: string;
  outboundOriginCode: string;
  outboundDestinationCode: string;
  returnDate?: string;
  legs?: Array<{
    originCode: string;
    destinationCode: string;
    departureDate: string;
  }>;
  passengers: Array<{
    type: "adult" | "child" | "infant_without_seat";
    givenName: string;
    familyName: string;
    bornOn: string;
    email?: string;
    phoneNumber?: string;
  }>;
  cabinClass: "economy" | "premium_economy" | "business" | "first";
  maxStops?: number;
  airlines?: string[];
  maxPrice?: number;
}

export interface PassengerInfo {
  type: "adult" | "child" | "infant_without_seat";
  title: "mr" | "mrs" | "ms" | "dr";
  givenName: string;
  familyName: string;
  bornOn: string;
  gender: "m" | "f";
  email: string;
  phoneNumber: string;
  documentType: "passport" | "id_card" | "drivers_license";
  documentNumber: string;
  documentExpiryDate: string;
  documentIssuingCountry: string;
  nationality: string;
  frequentFlyerNumber?: string;
  frequentFlyerAirline?: string;
  baggageAllowance?: {
    checked: number;
    carryon: number;
  };
  seatPreference?: "window" | "aisle" | "middle" | "any";
  mealPreference?: string;
  specialAssistance?: string[];
}

export interface PaymentInfo {
  paymentMethodId: string;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  cardholderName: string;
  cardholderEmail: string;
  cardholderPhone: string;
  metadata: {
    bookingReference?: string;
    flightRoute: string;
    departureDate: string;
    numberOfPassengers: number;
    cabinClass: string;
  };
}

export interface BookingResponse {
  bookingReference: string;
  bookingId: string;
  paymentId: string;
  paymentStatus: "succeeded" | "processing" | "requires_action";
  flights: Array<{
    flightNumber: string;
    airline: string;
    departure: { airport: string; time: string; };
    arrival: { airport: string; time: string; };
    duration: string;
    stops: number;
  }>;
  passengers: PassengerInfo[];
  pricing: {
    subtotal: number;
    taxes: number;
    fees: number;
    total: number;
    currency: string;
  };
  confirmationEmail: string;
  confirmationSentAt: string;
  importantInfo: {
    checkInOpensAt: string;
    bagageAllowance: string;
    cancellationPolicy: string;
    refundPolicy: string;
  };
}

export class APIError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    public details?: Record<string, any>
  ) {
    super(`API Error: ${code}`);
    this.name = "APIError";
  }
}

export const ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  INVALID_SEARCH_PARAMS: "INVALID_SEARCH_PARAMS",
  NO_FLIGHTS_FOUND: "NO_FLIGHTS_FOUND",
  FLIGHT_UNAVAILABLE: "FLIGHT_UNAVAILABLE",
  INVALID_PASSENGER_INFO: "INVALID_PASSENGER_INFO",
  PAYMENT_DECLINED: "PAYMENT_DECLINED",
  INVALID_CARD: "INVALID_CARD",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  PAYMENT_PROCESSING_ERROR: "PAYMENT_PROCESSING_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

export const validatePassengerInfo = (passenger: PassengerInfo): string[] => {
  const errors: string[] = [];
  if (!passenger.givenName?.trim()) errors.push("Given name is required");
  if (!passenger.familyName?.trim()) errors.push("Family name is required");
  if (!passenger.bornOn) errors.push("Date of birth is required");
  if (!passenger.email?.trim()) errors.push("Email is required");
  if (!passenger.phoneNumber?.trim()) errors.push("Phone number is required");
  if (!passenger.documentNumber?.trim()) errors.push("Document number is required");
  if (!passenger.documentExpiryDate) errors.push("Document expiry date is required");
  if (!passenger.nationality) errors.push("Nationality is required");
  if (passenger.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email)) errors.push("Invalid email format");
  if (passenger.documentExpiryDate && new Date(passenger.documentExpiryDate) < new Date()) errors.push("Document has expired");
  return errors;
};

export const validateFlightSearchRequest = (request: FlightSearchRequest): string[] => {
  const errors: string[] = [];
  if (!request.outboundOriginCode?.trim()) errors.push("Origin airport is required");
  if (!request.outboundDestinationCode?.trim()) errors.push("Destination airport is required");
  if (!request.outboundDate) errors.push("Departure date is required");
  if (!request.passengers || request.passengers.length === 0) errors.push("At least one passenger is required");
  if (request.passengers && request.passengers.length > DUFFEL_CONFIG.maxPassengers) errors.push(`Maximum ${DUFFEL_CONFIG.maxPassengers} passengers allowed`);
  const outboundDate = new Date(request.outboundDate);
  if (outboundDate < new Date()) errors.push("Departure date cannot be in the past");
  if (request.returnDate) {
    const returnDate = new Date(request.returnDate);
    if (returnDate <= outboundDate) errors.push("Return date must be after departure date");
  }
  return errors;
};

export const validatePaymentInfo = (payment: PaymentInfo): string[] => {
  const errors: string[] = [];
  if (!payment.paymentMethodId?.trim()) errors.push("Payment method is required");
  if (!payment.billingAddress.line1?.trim()) errors.push("Billing address is required");
  if (!payment.billingAddress.city?.trim()) errors.push("City is required");
  if (!payment.billingAddress.postalCode?.trim()) errors.push("Postal code is required");
  if (!payment.billingAddress.country?.trim()) errors.push("Country is required");
  if (!payment.cardholderName?.trim()) errors.push("Cardholder name is required");
  if (!payment.cardholderEmail?.trim()) errors.push("Cardholder email is required");
  return errors;
};
