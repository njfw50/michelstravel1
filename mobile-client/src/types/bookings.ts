export type BookingRecord = {
  id: number;
  referenceCode?: string | null;
  userId?: string | null;
  flightData: Record<string, any>;
  passengerDetails: Record<string, any>[] | null;
  totalPrice: string;
  currency?: string | null;
  status?: string | null;
  stripePaymentStatus?: string | null;
  stripeReceiptUrl?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  ticketStatus?: string | null;
  ticketNumber?: string | null;
  createdAt?: string | null;
};

export type CreateBookingPayload = {
  contactEmail: string;
  contactPhone?: string;
  totalPrice: string;
  currency: string;
  flightData: Record<string, any>;
  passengerDetails: Record<string, any>[];
};

export type CreateBookingResponse = {
  booking: BookingRecord;
  clientSecret: string | null;
  testMode?: boolean;
};
