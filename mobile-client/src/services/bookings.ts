import { api } from "../lib/api";
import { BookingRecord } from "../types/bookings";

export async function lookupBooking(referenceCode: string, contactEmail: string): Promise<BookingRecord> {
  const response = await api.get<BookingRecord>("/api/bookings/lookup", {
    params: {
      reference: referenceCode,
      email: contactEmail,
    },
  });

  return response.data;
}

