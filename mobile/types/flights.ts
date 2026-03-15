export type NativeTripType = "round_trip" | "one_way";
export type NativeCabinClass = "economy" | "premium_economy" | "business" | "first";

export interface FlightSegment {
  id?: string;
  duration: string;
  aircraftType?: string | null;
  airline?: string | null;
  flightNumber?: string | null;
  departureTime: string;
  arrivalTime: string;
  originCode: string;
  originCity: string | null;
  originTerminal: string | null;
  destinationCode: string;
  destinationCity: string | null;
  destinationTerminal: string | null;
}

export interface FlightSlice {
  duration: string;
  originCode: string;
  originCity: string | null;
  destinationCode: string;
  destinationCity: string | null;
  segments: FlightSegment[];
}

export interface FlightPassengerBaggage {
  type: string;
  quantity: number;
}

export interface FlightPassengerInfo {
  passengerId: string;
  passengerType: string;
  cabinClass: string;
  cabinClassName: string;
  baggages: FlightPassengerBaggage[];
  fareBrandName: string | null;
}

export interface FlightAvailableService {
  id: string;
  type: string;
  totalAmount: string;
  totalCurrency: string;
  maxQuantity: number;
  passengerIds: string[];
  segmentIds: string[];
  metadata?: Record<string, unknown> | null;
}

export interface FlightOffer {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;
  logoUrl?: string | null;
  aircraftType?: string | null;
  originCity?: string | null;
  destinationCity?: string | null;
  originCode?: string | null;
  destinationCode?: string | null;
  cabinClass?: string | null;
  slices?: FlightSlice[];
  passengers?: FlightPassengerInfo[];
  passengerIdentityDocumentsRequired?: boolean;
  taxAmount?: string | null;
  baseAmount?: string | null;
  totalEmissionsKg?: string | null;
  supportedLoyaltyProgrammes?: string[];
  availableServices?: FlightAvailableService[];
  conditions?: {
    changeBeforeDeparture?: { allowed: boolean; penaltyAmount?: string; penaltyCurrency?: string } | null;
    refundBeforeDeparture?: { allowed: boolean; penaltyAmount?: string; penaltyCurrency?: string } | null;
  } | null;
}

export interface FlightSearchRequest {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  cabinClass: NativeCabinClass;
}

export type SeniorPriority = "comfort" | "fastest" | "balanced" | "cheapest";
export type SeniorConnectionPreference = "none" | "one" | "any";
export type SeniorBagPreference = "checked" | "carry" | "flexible";
export type SeniorTimePreference = "day" | "any";

export interface SeniorPreferences {
  priority: SeniorPriority;
  connections: SeniorConnectionPreference;
  bags: SeniorBagPreference;
  time: SeniorTimePreference;
}

export interface SeniorFlightInsight {
  totalDurationMinutes: number;
  totalStops: number;
  longestLayoverMinutes: number;
  hasCheckedBag: boolean;
  hasCarryOn: boolean;
  hasSensitiveHour: boolean;
  hasTerminalChange: boolean;
  comfortScore: number;
  balancedScore: number;
  routeScore: number;
  priceScore: number;
  reasonLine: string;
}

export type SeniorRecommendationKind = "comfort" | "fastest" | "balanced";

export interface SeniorRecommendation {
  kind: SeniorRecommendationKind;
  flight: FlightOffer;
  insight: SeniorFlightInsight;
  fallbackApplied: boolean;
}
