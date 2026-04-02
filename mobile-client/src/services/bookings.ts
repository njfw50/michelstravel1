import { api } from "../lib/api";
import { BookingRecord, CreateBookingPayload, CreateBookingResponse } from "../types/bookings";

export async function lookupBooking(referenceCode: string, contactEmail: string): Promise<BookingRecord> {
  const response = await api.get<BookingRecord>("/api/bookings/lookup", {
    params: {
      reference: referenceCode,
      email: contactEmail,
    },
  });

  return response.data;
}

export async function createBooking(payload: CreateBookingPayload): Promise<CreateBookingResponse> {
  const response = await api.post<CreateBookingResponse>("/api/bookings", payload);
  return response.data;
}

export async function verifyBookingPayment(bookingId: number, referenceCode: string, contactEmail: string): Promise<{ verified: boolean; status: string; booking: BookingRecord }> {
  const response = await api.post<{ verified: boolean; status: string; booking: BookingRecord }>(`/api/bookings/${bookingId}/verify-payment`, {
    referenceCode,
    contactEmail,
  });
  return response.data;
}

export async function getBookingReceipt(bookingId: number, referenceCode?: string, contactEmail?: string): Promise<string | null> {
  const response = await api.get<{ receiptUrl: string | null }>(`/api/bookings/${bookingId}/receipt`, {
    params: referenceCode && contactEmail ? { reference: referenceCode, email: contactEmail } : undefined,
  });
  return response.data.receiptUrl;
}

export async function listAccountBookings(): Promise<BookingRecord[]> {
  const response = await api.get<{ bookings: BookingRecord[] }>("/api/mobile/customer/bookings");
  return response.data.bookings;
}
