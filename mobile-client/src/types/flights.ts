export type FlightSegment = {
  segmentId?: string;
  carrierCode?: string;
  carrierName?: string;
  flightNumber?: string;
  aircraftType?: string | null;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  originCode?: string;
  originName?: string;
  originCity?: string | null;
  originTerminal?: string | null;
  destinationCode?: string;
  destinationName?: string;
  destinationCity?: string | null;
  destinationTerminal?: string | null;
};

export type FlightSlice = {
  duration?: string;
  originCode?: string;
  originCity?: string | null;
  destinationCode?: string;
  destinationCity?: string | null;
  segments?: FlightSegment[];
};

export type FlightPassengerBaggage = {
  type: string;
  quantity: number;
};

export type FlightPassengerInfo = {
  passengerId?: string;
  passengerType?: string;
  cabinClass?: string;
  cabinClassName?: string;
  baggages?: FlightPassengerBaggage[];
  fareBrandName?: string | null;
};

export type FlightOffer = {
  id: string;
  airline: string;
  flightNumber?: string;
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
  conditions?: {
    changeBeforeDeparture?: { allowed: boolean; penaltyAmount?: string; penaltyCurrency?: string } | null;
    refundBeforeDeparture?: { allowed: boolean; penaltyAmount?: string; penaltyCurrency?: string } | null;
  } | null;
};

export type FlightSearchLeg = {
  origin: string;
  destination: string;
  date: string;
};

export type FlightSearchRequest = {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  passengers: string;
  adults?: string;
  children?: string;
  infants?: string;
  cabinClass?: string;
  tripType?: "one-way" | "round-trip" | "multi-city";
  legs?: FlightSearchLeg[];
};
