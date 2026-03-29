export type BookingRecord = {
  id: number;
  referenceCode?: string | null;
  userId?: string | null;
  flightData: Record<string, any>;
  passengerDetails: Record<string, any>[] | null;
  totalPrice: string;
  currency?: string | null;
  status?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  createdAt?: string | null;
};

